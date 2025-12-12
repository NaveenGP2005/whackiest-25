// Real-Time Location Tracking Service
// Uses Supabase Realtime for multi-user location synchronization

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbLocation, DbMember } from '../../lib/supabase';
import type { LocationFix } from './location-tracker';
import { haversineDistance } from './geo-utils';

// ==================== Constants ====================

const DEVICE_ID_KEY = 'wanderforge_device_id';
const LOCATION_BROADCAST_INTERVAL = 5000; // 5 seconds
const GROUP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0/O, 1/I/L)

// ==================== Types ====================

export interface RealtimeMember {
  id: string;
  name: string;
  avatar: string;
  location: { lat: number; lng: number } | null;
  accuracy: number;
  battery: number;
  signal: number;
  isMoving: boolean;
  lastSeen: Date;
  status: 'safe' | 'warning' | 'danger';
  distanceFromGroup: number;
}

export interface GroupSession {
  groupId: string;
  groupCode: string;
  groupName: string;
  myMemberId: string;
  members: Map<string, RealtimeMember>;
}

export interface CreateGroupResult {
  groupCode: string;
  groupId: string;
  memberId: string;
}

export interface JoinGroupResult {
  groupId: string;
  memberId: string;
  groupName: string;
}

// ==================== Session State ====================

let currentSession: GroupSession | null = null;
let locationChannel: RealtimeChannel | null = null;
let memberChannel: RealtimeChannel | null = null;
let broadcastInterval: ReturnType<typeof setInterval> | null = null;
let lastLocationFix: LocationFix | null = null;
let updateCallback: ((members: RealtimeMember[]) => void) | null = null;
let memberJoinCallback: ((member: RealtimeMember) => void) | null = null;

// ==================== Device ID ====================

/**
 * Get or create a persistent device ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// ==================== Group Code ====================

/**
 * Generate a random 6-character group code
 */
export function generateGroupCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += GROUP_CODE_CHARS[Math.floor(Math.random() * GROUP_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Validate group code format
 */
export function isValidGroupCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(code);
}

// ==================== Group Management ====================

/**
 * Create a new tracking group
 */
export async function createGroup(
  groupName: string,
  userName: string
): Promise<CreateGroupResult | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured');
    return null;
  }

  const deviceId = getDeviceId();
  const groupCode = generateGroupCode();
  const memberId = crypto.randomUUID();
  const avatar = userName.substring(0, 2).toUpperCase();

  try {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        code: groupCode,
        name: groupName,
        creator_id: memberId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true,
      })
      .select()
      .single();

    if (groupError || !group) {
      console.error('Failed to create group:', groupError);
      return null;
    }

    // Add creator as first member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        id: memberId,
        group_id: group.id,
        device_id: deviceId,
        name: userName,
        avatar: avatar,
        is_active: true,
      })
      .select()
      .single();

    if (memberError || !member) {
      console.error('Failed to add member:', memberError);
      // Cleanup: delete the group
      await supabase.from('groups').delete().eq('id', group.id);
      return null;
    }

    return {
      groupCode: group.code,
      groupId: group.id,
      memberId: member.id,
    };
  } catch (error) {
    console.error('Error creating group:', error);
    return null;
  }
}

/**
 * Join an existing group by code
 */
export async function joinGroup(
  groupCode: string,
  userName: string
): Promise<JoinGroupResult | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured');
    return null;
  }

  const deviceId = getDeviceId();
  const avatar = userName.substring(0, 2).toUpperCase();

  try {
    // Find the group by code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select()
      .eq('code', groupCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (groupError || !group) {
      console.error('Group not found:', groupError);
      return null;
    }

    // Check if already a member (same device)
    const { data: existingMember } = await supabase
      .from('members')
      .select()
      .eq('group_id', group.id)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single();

    if (existingMember) {
      // Already a member, return existing info
      return {
        groupId: group.id,
        memberId: existingMember.id,
        groupName: group.name,
      };
    }

    // Add as new member
    const memberId = crypto.randomUUID();
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        id: memberId,
        group_id: group.id,
        device_id: deviceId,
        name: userName,
        avatar: avatar,
        is_active: true,
      })
      .select()
      .single();

    if (memberError || !member) {
      console.error('Failed to join group:', memberError);
      return null;
    }

    return {
      groupId: group.id,
      memberId: member.id,
      groupName: group.name,
    };
  } catch (error) {
    console.error('Error joining group:', error);
    return null;
  }
}

/**
 * Leave the current group
 */
export async function leaveGroup(): Promise<void> {
  if (!currentSession || !isSupabaseConfigured() || !supabase) return;

  try {
    // Mark member as inactive
    await supabase
      .from('members')
      .update({ is_active: false })
      .eq('id', currentSession.myMemberId);
  } catch (error) {
    console.error('Error leaving group:', error);
  }

  await stopRealtimeSession();
}

// ==================== Real-Time Session ====================

/**
 * Start a real-time tracking session
 */
export async function startRealtimeSession(
  groupId: string,
  memberId: string,
  groupCode: string,
  groupName: string,
  onMembersUpdate: (members: RealtimeMember[]) => void,
  onMemberJoin?: (member: RealtimeMember) => void
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured');
    return false;
  }

  // Initialize session
  currentSession = {
    groupId,
    groupCode,
    groupName,
    myMemberId: memberId,
    members: new Map(),
  };
  updateCallback = onMembersUpdate;
  memberJoinCallback = onMemberJoin || null;

  try {
    // Load existing members
    const { data: members } = await supabase
      .from('members')
      .select()
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (members) {
      for (const m of members) {
        currentSession.members.set(m.id, {
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          location: null,
          accuracy: 100,
          battery: 100,
          signal: 4,
          isMoving: false,
          lastSeen: new Date(m.joined_at),
          status: 'safe',
          distanceFromGroup: 0,
        });
      }
    }

    // Load latest locations for each member
    const { data: locations } = await supabase
      .from('locations')
      .select()
      .eq('group_id', groupId)
      .order('timestamp', { ascending: false });

    if (locations) {
      // Get only the latest location per member
      const latestByMember = new Map<string, DbLocation>();
      for (const loc of locations) {
        if (!latestByMember.has(loc.member_id)) {
          latestByMember.set(loc.member_id, loc);
        }
      }

      for (const [memId, loc] of latestByMember) {
        const member = currentSession.members.get(memId);
        if (member) {
          member.location = { lat: loc.lat, lng: loc.lng };
          member.accuracy = loc.accuracy_m;
          member.battery = loc.battery_percent;
          member.signal = loc.signal_strength;
          member.isMoving = loc.is_moving;
          member.lastSeen = new Date(loc.timestamp);
          updateMemberStatus(member);
        }
      }
    }

    // Subscribe to new location updates
    locationChannel = supabase
      .channel(`locations:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const loc = payload.new as DbLocation;
          handleLocationUpdate(loc);
        }
      )
      .subscribe();

    // Subscribe to member changes (join/leave)
    memberChannel = supabase
      .channel(`members:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const m = payload.new as DbMember;
            handleMemberJoin(m);
          } else if (payload.eventType === 'UPDATE') {
            const m = payload.new as DbMember;
            if (!m.is_active) {
              handleMemberLeave(m.id);
            }
          }
        }
      )
      .subscribe();

    // Initial callback with current members
    emitMembersUpdate();

    return true;
  } catch (error) {
    console.error('Error starting realtime session:', error);
    return false;
  }
}

/**
 * Stop the real-time tracking session
 */
export async function stopRealtimeSession(): Promise<void> {
  // Stop location broadcasting
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }

  // Unsubscribe from channels
  if (locationChannel) {
    await locationChannel.unsubscribe();
    locationChannel = null;
  }

  if (memberChannel) {
    await memberChannel.unsubscribe();
    memberChannel = null;
  }

  // Clear session
  currentSession = null;
  updateCallback = null;
  memberJoinCallback = null;
  lastLocationFix = null;
}

// ==================== Location Broadcasting ====================

/**
 * Update the current location fix (call this from GPS tracker)
 */
export function updateLocationFix(fix: LocationFix): void {
  lastLocationFix = fix;
}

/**
 * Start broadcasting location to the group
 */
export function startLocationBroadcast(): void {
  if (broadcastInterval) return;

  // Broadcast immediately if we have a location
  if (lastLocationFix) {
    broadcastMyLocation();
  }

  // Then broadcast every 5 seconds
  broadcastInterval = setInterval(() => {
    if (lastLocationFix) {
      broadcastMyLocation();
    }
  }, LOCATION_BROADCAST_INTERVAL);
}

/**
 * Stop broadcasting location
 */
export function stopLocationBroadcast(): void {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

/**
 * Broadcast current location to Supabase
 */
async function broadcastMyLocation(): Promise<void> {
  if (!currentSession || !lastLocationFix || !isSupabaseConfigured() || !supabase) {
    return;
  }

  try {
    const { error } = await supabase.from('locations').insert({
      member_id: currentSession.myMemberId,
      group_id: currentSession.groupId,
      lat: lastLocationFix.lat,
      lng: lastLocationFix.lng,
      accuracy_m: Math.round(lastLocationFix.accuracy_m),
      battery_percent: await getBatteryLevel(),
      signal_strength: getSignalStrength(lastLocationFix.accuracy_m),
      is_moving: lastLocationFix.accuracy_m < 20, // Moving if high accuracy
    });

    if (error) {
      console.error('Failed to broadcast location:', error);
    }
  } catch (error) {
    console.error('Error broadcasting location:', error);
  }
}

// ==================== Event Handlers ====================

/**
 * Handle incoming location update from another member
 */
function handleLocationUpdate(loc: DbLocation): void {
  if (!currentSession) return;

  const existingMember = currentSession.members.get(loc.member_id);
  if (existingMember) {
    // Create a new object to trigger React re-renders
    const updatedMember: RealtimeMember = {
      ...existingMember,
      location: { lat: loc.lat, lng: loc.lng },
      accuracy: loc.accuracy_m,
      battery: loc.battery_percent,
      signal: loc.signal_strength,
      isMoving: loc.is_moving,
      lastSeen: new Date(loc.timestamp),
    };

    // Update the map with new reference
    currentSession.members.set(loc.member_id, updatedMember);

    // Recalculate status
    updateMemberStatus(updatedMember);
    emitMembersUpdate();
  }
}

/**
 * Handle new member joining the group
 */
function handleMemberJoin(m: DbMember): void {
  if (!currentSession) return;

  if (!currentSession.members.has(m.id)) {
    const newMember: RealtimeMember = {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      location: null,
      accuracy: 100,
      battery: 100,
      signal: 4,
      isMoving: false,
      lastSeen: new Date(m.joined_at),
      status: 'safe',
      distanceFromGroup: 0,
    };
    currentSession.members.set(m.id, newMember);
    emitMembersUpdate();

    // Notify about new member (skip if it's the current user)
    if (memberJoinCallback && m.id !== currentSession.myMemberId) {
      memberJoinCallback(newMember);
    }
  }
}

/**
 * Handle member leaving the group
 */
function handleMemberLeave(memberId: string): void {
  if (!currentSession) return;

  currentSession.members.delete(memberId);
  emitMembersUpdate();
}

// ==================== Status Calculation ====================

/**
 * Update a member's status based on various factors
 */
function updateMemberStatus(member: RealtimeMember): void {
  if (!currentSession) return;

  // Calculate distance from group centroid
  const otherLocations: { lat: number; lng: number }[] = [];
  for (const [id, m] of currentSession.members) {
    if (id !== member.id && m.location) {
      otherLocations.push(m.location);
    }
  }

  if (otherLocations.length > 0 && member.location) {
    // Calculate centroid
    const centroid = {
      lat: otherLocations.reduce((sum, l) => sum + l.lat, 0) / otherLocations.length,
      lng: otherLocations.reduce((sum, l) => sum + l.lng, 0) / otherLocations.length,
    };

    member.distanceFromGroup = haversineDistance(
      member.location.lat,
      member.location.lng,
      centroid.lat,
      centroid.lng
    );
  } else {
    member.distanceFromGroup = 0;
  }

  // Calculate silence duration
  const silenceMinutes = (Date.now() - member.lastSeen.getTime()) / 60000;

  // Determine status based on factors
  if (
    silenceMinutes > 15 ||
    member.distanceFromGroup > 500 ||
    member.battery < 10
  ) {
    member.status = 'danger';
  } else if (
    silenceMinutes > 5 ||
    member.distanceFromGroup > 200 ||
    member.battery < 20
  ) {
    member.status = 'warning';
  } else {
    member.status = 'safe';
  }
}

/**
 * Emit members update to callback
 */
function emitMembersUpdate(): void {
  if (!currentSession || !updateCallback) return;

  const members = Array.from(currentSession.members.values());

  // Recalculate all statuses (distances may have changed)
  for (const member of members) {
    updateMemberStatus(member);
  }

  updateCallback(members);
}

// ==================== Helpers ====================

/**
 * Get battery level from Battery API (if available)
 */
async function getBatteryLevel(): Promise<number> {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return Math.round(battery.level * 100);
    }
  } catch {
    // Battery API not available or failed
  }
  return 100; // Default to 100%
}

/**
 * Estimate signal strength from GPS accuracy
 */
function getSignalStrength(accuracyM: number): number {
  if (accuracyM < 10) return 4;   // Excellent
  if (accuracyM < 30) return 3;   // Good
  if (accuracyM < 100) return 2;  // Fair
  if (accuracyM < 500) return 1;  // Poor
  return 0;                        // No signal
}

// ==================== Session Info ====================

/**
 * Get current session information
 */
export function getCurrentSession(): GroupSession | null {
  return currentSession;
}

/**
 * Check if currently in an active session
 */
export function isInSession(): boolean {
  return currentSession !== null;
}

/**
 * Get the current group code (for sharing)
 */
export function getGroupCode(): string | null {
  return currentSession?.groupCode || null;
}

/**
 * Get the current group name
 */
export function getGroupName(): string | null {
  return currentSession?.groupName || null;
}
