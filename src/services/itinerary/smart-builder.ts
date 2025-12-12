// Smart Itinerary Builder - Knowledge-Based Intelligent Planning
import type { PlaceKnowledge, NearbyPlace } from './place-research.types';
import type {
  GeneratedItinerary,
  DayItinerary,
  ScheduledActivity,
  ItinerarySummary,
  Coords,
  PlaceRecommendation,
  TimeSlot,
} from './types';
import type { ExtractedPlace } from '../ai/types';
import { haversineDistance, optimizeVisitOrder } from './route-optimizer';
import { knowledgeToExtractedPlace } from './place-research';

// Time constants (in minutes from midnight)
const BREAKFAST_TIME = 7 * 60 + 30;    // 07:30
const MORNING_START = 8 * 60;          // 08:00
const MORNING_SNACK_TIME = 10 * 60 + 30; // 10:30
const LUNCH_TIME = 12 * 60 + 30;       // 12:30
const AFTERNOON_START = 14 * 60;       // 14:00
const EVENING_SNACK_TIME = 16 * 60 + 30; // 16:30
const EVENING_START = 17 * 60;         // 17:00
const DINNER_TIME = 19 * 60 + 30;      // 19:30
const NIGHT_START = 21 * 60;           // 21:00
const DAY_END = 23 * 60;               // 23:00

// Meal configuration
const MEAL_CONFIG = {
  breakfast: { time: BREAKFAST_TIME, duration: 45, cost: 250, label: 'Breakfast', preferCafe: true },
  morningSnack: { time: MORNING_SNACK_TIME, duration: 20, cost: 100, label: 'Morning Tea', preferCafe: true },
  lunch: { time: LUNCH_TIME, duration: 60, cost: 400, label: 'Lunch', preferCafe: false },
  eveningSnack: { time: EVENING_SNACK_TIME, duration: 20, cost: 150, label: 'Refreshments', preferCafe: true },
  dinner: { time: DINNER_TIME, duration: 75, cost: 600, label: 'Dinner', preferCafe: false },
} as const;

type MealType = keyof typeof MEAL_CONFIG;

/**
 * Format minutes from midnight to HH:MM string
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to minutes from midnight
 */
function parseTime(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

/**
 * Get time slot for a given minute value
 */
function getTimeSlot(minutes: number): TimeSlot {
  if (minutes < AFTERNOON_START) return 'morning';
  if (minutes < EVENING_START) return 'afternoon';
  if (minutes < NIGHT_START) return 'evening';
  return 'night';
}

/**
 * Determine optimal time of day for a place based on knowledge
 */
function getOptimalTimeOfDay(place: PlaceKnowledge): 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible' {
  const bestTime = place.bestTimeToVisit.toLowerCase();

  if (bestTime.includes('morning') || bestTime.includes('sunrise')) {
    return 'morning';
  }
  if (bestTime.includes('evening') || bestTime.includes('sunset')) {
    return 'evening';
  }
  if (bestTime.includes('night') || place.type === 'nightlife') {
    return 'night';
  }
  if (bestTime.includes('afternoon')) {
    return 'afternoon';
  }

  // Default based on type
  if (place.type === 'fort' || place.type === 'landmark') {
    return 'morning';
  }
  if (place.type === 'beach') {
    return 'evening'; // Sunset at beach
  }
  if (place.type === 'nightlife') {
    return 'night';
  }

  return 'flexible';
}

/**
 * Check if a place is open at a given time
 */
function isPlaceOpen(place: PlaceKnowledge, minutes: number): boolean {
  if (!place.openingHours) return true; // Assume open if unknown

  const openTime = parseTime(place.openingHours.open);
  const closeTime = parseTime(place.openingHours.close);

  // Handle overnight hours (e.g., bar open until 2 AM)
  if (closeTime < openTime) {
    return minutes >= openTime || minutes < closeTime;
  }

  return minutes >= openTime && minutes < closeTime;
}

/**
 * Group places by optimal time of day
 */
function groupByTimeOfDay(places: PlaceKnowledge[]): {
  morning: PlaceKnowledge[];
  afternoon: PlaceKnowledge[];
  evening: PlaceKnowledge[];
  night: PlaceKnowledge[];
  flexible: PlaceKnowledge[];
} {
  const groups = {
    morning: [] as PlaceKnowledge[],
    afternoon: [] as PlaceKnowledge[],
    evening: [] as PlaceKnowledge[],
    night: [] as PlaceKnowledge[],
    flexible: [] as PlaceKnowledge[],
  };

  for (const place of places) {
    const optimalTime = getOptimalTimeOfDay(place);
    groups[optimalTime].push(place);
  }

  return groups;
}

/**
 * Maximum reasonable travel distance within a single day (in km)
 * Places farther apart should be on different days
 */
const MAX_SAME_DAY_DISTANCE = 100; // 100 km max

/**
 * Cluster places by geographic proximity for multi-day trips
 * Ensures places that are too far apart end up on different days
 */
function clusterByProximity(places: PlaceKnowledge[], numClusters: number): PlaceKnowledge[][] {
  if (places.length <= numClusters) {
    return places.map(p => [p]);
  }

  // First, identify distinct geographic regions (places far apart)
  const regionGroups = groupByGeographicRegion(places);
  console.log(`[SmartBuilder] Found ${regionGroups.length} distinct geographic regions`);

  // If we have more regions than days, we need to warn the user
  if (regionGroups.length > numClusters) {
    console.warn(`[SmartBuilder] Warning: ${regionGroups.length} regions but only ${numClusters} days. Some regions will share days.`);
  }

  // Distribute region groups across days
  const clusters: PlaceKnowledge[][] = [];

  if (regionGroups.length >= numClusters) {
    // More regions than days - assign one region per day, combine extras
    for (let i = 0; i < numClusters; i++) {
      if (i < regionGroups.length) {
        clusters.push([...regionGroups[i]]);
      }
    }
    // Add remaining regions to existing clusters (closest ones)
    for (let i = numClusters; i < regionGroups.length; i++) {
      const region = regionGroups[i];
      const regionCentroid = getClusterCentroid(region);

      let nearestClusterIdx = 0;
      let minDist = Infinity;

      for (let j = 0; j < clusters.length; j++) {
        const clusterCentroid = getClusterCentroid(clusters[j]);
        const dist = haversineDistance(
          regionCentroid.lat,
          regionCentroid.lng,
          clusterCentroid.lat,
          clusterCentroid.lng
        );
        if (dist < minDist) {
          minDist = dist;
          nearestClusterIdx = j;
        }
      }

      clusters[nearestClusterIdx].push(...region);
    }
  } else {
    // More days than regions - split larger regions across multiple days
    const daysPerRegion = Math.ceil(numClusters / regionGroups.length);

    for (const region of regionGroups) {
      if (region.length <= daysPerRegion || clusters.length >= numClusters - 1) {
        clusters.push([...region]);
      } else {
        // Split this region into multiple days
        const subClusters = splitRegionIntoDays(region, Math.min(daysPerRegion, numClusters - clusters.length));
        clusters.push(...subClusters);
      }
    }

    // Fill remaining days if we have extra capacity
    while (clusters.length < numClusters && clusters.some(c => c.length > 2)) {
      // Find the largest cluster and split it
      let largestIdx = 0;
      let largestSize = 0;
      for (let i = 0; i < clusters.length; i++) {
        if (clusters[i].length > largestSize) {
          largestSize = clusters[i].length;
          largestIdx = i;
        }
      }

      if (largestSize <= 2) break;

      const toSplit = clusters[largestIdx];
      const half = Math.ceil(toSplit.length / 2);
      clusters[largestIdx] = toSplit.slice(0, half);
      clusters.push(toSplit.slice(half));
    }
  }

  // Ensure we don't have empty clusters
  return clusters.filter(c => c.length > 0);
}

/**
 * Group places by geographic region (places within MAX_SAME_DAY_DISTANCE of each other)
 */
function groupByGeographicRegion(places: PlaceKnowledge[]): PlaceKnowledge[][] {
  const regions: PlaceKnowledge[][] = [];
  const assigned = new Set<string>();

  for (const place of places) {
    if (assigned.has(place.name)) continue;

    // Start a new region with this place
    const region: PlaceKnowledge[] = [place];
    assigned.add(place.name);

    // Find all other places within reasonable distance
    for (const other of places) {
      if (assigned.has(other.name)) continue;

      const dist = haversineDistance(
        place.coordinates.lat,
        place.coordinates.lng,
        other.coordinates.lat,
        other.coordinates.lng
      );

      if (dist <= MAX_SAME_DAY_DISTANCE) {
        region.push(other);
        assigned.add(other.name);
      }
    }

    regions.push(region);
  }

  // Sort regions by size (largest first) for better distribution
  regions.sort((a, b) => b.length - a.length);

  return regions;
}

/**
 * Split a region into multiple day clusters based on proximity
 */
function splitRegionIntoDays(region: PlaceKnowledge[], numDays: number): PlaceKnowledge[][] {
  if (region.length <= numDays) {
    return region.map(p => [p]);
  }

  const clusters: PlaceKnowledge[][] = [];
  const assigned = new Set<string>();
  const placesPerDay = Math.ceil(region.length / numDays);

  for (let d = 0; d < numDays && assigned.size < region.length; d++) {
    const cluster: PlaceKnowledge[] = [];

    // Find an unassigned place to start
    let seed: PlaceKnowledge | null = null;
    for (const p of region) {
      if (!assigned.has(p.name)) {
        seed = p;
        break;
      }
    }

    if (!seed) break;

    cluster.push(seed);
    assigned.add(seed.name);

    // Add nearby places
    while (cluster.length < placesPerDay && assigned.size < region.length) {
      const centroid = getClusterCentroid(cluster);
      let nearest: PlaceKnowledge | null = null;
      let minDist = Infinity;

      for (const p of region) {
        if (assigned.has(p.name)) continue;

        const dist = haversineDistance(
          centroid.lat,
          centroid.lng,
          p.coordinates.lat,
          p.coordinates.lng
        );

        if (dist < minDist) {
          minDist = dist;
          nearest = p;
        }
      }

      if (!nearest) break;

      cluster.push(nearest);
      assigned.add(nearest.name);
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Get centroid of a cluster of places
 */
function getClusterCentroid(places: PlaceKnowledge[]): Coords {
  if (places.length === 0) return { lat: 0, lng: 0 };

  const sum = places.reduce(
    (acc, p) => ({
      lat: acc.lat + p.coordinates.lat,
      lng: acc.lng + p.coordinates.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / places.length,
    lng: sum.lng / places.length,
  };
}

/**
 * Build a day schedule from places, respecting times and inserting meals
 */
function buildDaySchedule(
  dayNumber: number,
  dateStr: string,
  places: PlaceKnowledge[],
  budget: { total: number; currency: string; perPerson: boolean } | null,
  numDays: number
): DayItinerary {
  const activities: ScheduledActivity[] = [];
  let currentTime = MORNING_START;
  let totalFatigue = 0;
  let totalCost = 0;
  let activityIndex = 0;

  // Sort places by optimal time
  const sorted = [...places].sort((a, b) => {
    const timeOrder = { morning: 0, afternoon: 1, evening: 2, night: 3, flexible: 1.5 };
    return timeOrder[getOptimalTimeOfDay(a)] - timeOrder[getOptimalTimeOfDay(b)];
  });

  for (const place of sorted) {
    // Skip accommodation as activities (they're not visits)
    if (place.type === 'accommodation') continue;

    // Determine start time based on optimal time
    const optimalTime = getOptimalTimeOfDay(place);
    let startTime = currentTime;

    if (optimalTime === 'afternoon' && currentTime < AFTERNOON_START) {
      startTime = AFTERNOON_START;
    } else if (optimalTime === 'evening' && currentTime < EVENING_START) {
      startTime = EVENING_START;
    } else if (optimalTime === 'night' && currentTime < NIGHT_START) {
      startTime = NIGHT_START;
    }

    // Check if place is open
    const openTime = place.openingHours ? parseTime(place.openingHours.open) : MORNING_START;
    const closeTime = place.openingHours ? parseTime(place.openingHours.close) : DAY_END;

    if (startTime < openTime) {
      startTime = openTime;
    }

    // Skip if we can't fit this visit before closing
    if (startTime + place.typicalDuration > closeTime) {
      continue;
    }

    // Skip if too late in the day (except nightlife)
    if (startTime >= DAY_END && place.type !== 'nightlife') {
      continue;
    }

    // Add travel time from previous activity
    if (activities.length > 0) {
      const prevActivity = activities[activities.length - 1];
      if (prevActivity.place.coordinates && place.coordinates) {
        const travelDistance = haversineDistance(
          prevActivity.place.coordinates.lat,
          prevActivity.place.coordinates.lng,
          place.coordinates.lat,
          place.coordinates.lng
        );
        const travelTime = Math.max(15, Math.round(travelDistance * 3)); // ~20 km/h average
        startTime = Math.max(startTime, currentTime + travelTime);

        // Add travel segment
        activities.push({
          id: `travel-${dayNumber}-${activityIndex}`,
          place: {
            name: `Travel to ${place.name}`,
            type: 'destination',
            coordinates: place.coordinates,
            confidence: 1,
            raw: '',
          },
          day: dayNumber,
          timeSlot: getTimeSlot(currentTime),
          startTime: formatTime(currentTime),
          endTime: formatTime(startTime),
          duration: startTime - currentTime,
          type: 'travel',
          fatigueImpact: Math.round(travelTime / 10),
          travelFromPrev: {
            distance: Math.round(travelDistance * 10) / 10,
            duration: travelTime,
            mode: travelDistance > 5 ? 'car' : 'auto',
          },
        });
        totalFatigue += Math.round(travelTime / 10);
      }
    }

    // Add the main activity
    const endTime = startTime + place.typicalDuration;
    const activityCost = place.entryFee || estimateCostByType(place.type, budget, numDays);

    activities.push({
      id: `visit-${dayNumber}-${activityIndex}`,
      place: knowledgeToExtractedPlace(place),
      day: dayNumber,
      timeSlot: getTimeSlot(startTime),
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      duration: place.typicalDuration,
      type: 'visit',
      fatigueImpact: getFatigueByType(place.type),
      crowdLevel: getCrowdLevel(startTime, place.crowdPeakHours),
      bestTimeReason: place.bestTimeToVisit,
      estimatedCost: activityCost,
    });

    totalCost += activityCost;
    totalFatigue += getFatigueByType(place.type);
    currentTime = endTime + 15; // 15 min buffer
    activityIndex++;
  }

  // Calculate travel distance
  const visitActivities = activities.filter(a => a.type === 'visit');
  let travelDistance = 0;
  for (let i = 1; i < visitActivities.length; i++) {
    const prev = visitActivities[i - 1];
    const curr = visitActivities[i];
    if (prev.place.coordinates && curr.place.coordinates) {
      travelDistance += haversineDistance(
        prev.place.coordinates.lat,
        prev.place.coordinates.lng,
        curr.place.coordinates.lat,
        curr.place.coordinates.lng
      );
    }
  }

  // Generate recommendations for missing categories
  const recommendations = generateDayRecommendations(places, dateStr);

  // Insert all meals (breakfast, snacks, lunch, dinner)
  const { activities: activitiesWithMeals, mealCost } = insertAllMeals(activities, dayNumber, places);

  return {
    day: dayNumber,
    date: dateStr,
    activities: activitiesWithMeals,
    totalFatigue,
    totalCost: totalCost + mealCost,
    travelDistance: Math.round(travelDistance * 10) / 10,
    recommendations,
  };
}

/**
 * Find best nearby restaurant from a place's nearby restaurants
 */
function findBestNearbyRestaurant(
  place: PlaceKnowledge,
  usedRestaurants: Set<string>
): NearbyPlace | null {
  for (const restaurant of place.nearbyRestaurants) {
    if (!usedRestaurants.has(restaurant.name)) {
      return restaurant;
    }
  }
  return null;
}

/**
 * Create a meal activity
 */
function createMealActivity(
  id: string,
  restaurant: NearbyPlace,
  startMinutes: number,
  dayNumber: number,
  reason: string,
  duration: number = 60,
  cost: number = 500
): ScheduledActivity {
  return {
    id,
    place: {
      name: restaurant.name,
      type: 'restaurant',
      coordinates: restaurant.coordinates,
      confidence: 0.8,
      raw: restaurant.name,
    },
    day: dayNumber,
    timeSlot: getTimeSlot(startMinutes),
    startTime: formatTime(startMinutes),
    endTime: formatTime(startMinutes + duration),
    duration,
    type: 'meal',
    fatigueImpact: -10, // Meals reduce fatigue
    bestTimeReason: reason,
    estimatedCost: cost,
  };
}

/**
 * Find the best restaurant for a specific meal type
 * Prefers cafes for breakfast/snacks, restaurants for main meals
 */
function findBestRestaurantForMeal(
  allRestaurants: NearbyPlace[],
  usedRestaurants: Set<string>,
  preferCafe: boolean
): NearbyPlace | null {
  // Filter out already used restaurants
  const available = allRestaurants.filter(r => !usedRestaurants.has(r.name));

  if (available.length === 0) return null;

  // Sort by: 1) Type preference (cafe vs restaurant), 2) Rating, 3) Distance
  const sorted = [...available].sort((a, b) => {
    const aIsCafe = a.type?.toLowerCase().includes('cafe') ? 1 : 0;
    const bIsCafe = b.type?.toLowerCase().includes('cafe') ? 1 : 0;

    // Apply cafe preference
    if (preferCafe && aIsCafe !== bIsCafe) {
      return bIsCafe - aIsCafe; // Cafes first
    }
    if (!preferCafe && aIsCafe !== bIsCafe) {
      return aIsCafe - bIsCafe; // Restaurants first
    }

    // Higher rating first
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }

    // Closer distance first
    return (a.distance || 0) - (b.distance || 0);
  });

  return sorted[0];
}

/**
 * Find the correct index to insert a meal based on time
 */
function findInsertIndex(activities: ScheduledActivity[], mealTime: number): number {
  for (let i = 0; i < activities.length; i++) {
    const activityTime = parseTime(activities[i].startTime);
    if (activityTime > mealTime) {
      return i;
    }
  }
  return activities.length;
}

/**
 * Insert all meals (breakfast, snacks, lunch, dinner) into the day's activities
 */
function insertAllMeals(
  activities: ScheduledActivity[],
  dayNumber: number,
  places: PlaceKnowledge[]
): { activities: ScheduledActivity[]; mealCost: number } {
  const withMeals = [...activities];
  const usedRestaurants = new Set<string>();
  let mealCost = 0;

  // Collect all nearby restaurants from all places
  const allNearbyRestaurants = places.flatMap(p => p.nearbyRestaurants || []);

  // If no restaurants found, return original activities
  if (allNearbyRestaurants.length === 0) {
    return { activities: withMeals, mealCost: 0 };
  }

  // Get the first and last activity times to determine which meals to insert
  const firstActivityTime = activities.length > 0 ? parseTime(activities[0].startTime) : MORNING_START;
  const lastActivityTime = activities.length > 0
    ? parseTime(activities[activities.length - 1].endTime || activities[activities.length - 1].startTime)
    : DAY_END;

  // Define meals to insert based on day's activity span
  const mealsToInsert: MealType[] = [];

  // Always try to insert meals that fall within the activity window
  if (firstActivityTime <= BREAKFAST_TIME + 60) mealsToInsert.push('breakfast');
  if (firstActivityTime <= MORNING_SNACK_TIME && lastActivityTime >= MORNING_SNACK_TIME) mealsToInsert.push('morningSnack');
  if (firstActivityTime <= LUNCH_TIME && lastActivityTime >= LUNCH_TIME - 30) mealsToInsert.push('lunch');
  if (firstActivityTime <= EVENING_SNACK_TIME && lastActivityTime >= EVENING_SNACK_TIME) mealsToInsert.push('eveningSnack');
  if (lastActivityTime >= DINNER_TIME - 60) mealsToInsert.push('dinner');

  // Insert each meal
  for (const mealType of mealsToInsert) {
    const config = MEAL_CONFIG[mealType];

    // Find the best restaurant for this meal
    const restaurant = findBestRestaurantForMeal(
      allNearbyRestaurants,
      usedRestaurants,
      config.preferCafe
    );

    if (restaurant) {
      // Create the meal activity
      const mealActivity = createMealActivity(
        `${mealType}-${dayNumber}`,
        restaurant,
        config.time,
        dayNumber,
        config.label,
        config.duration,
        config.cost
      );

      // Find where to insert based on time
      const insertIndex = findInsertIndex(withMeals, config.time);
      withMeals.splice(insertIndex, 0, mealActivity);

      // Track used restaurant and cost
      usedRestaurants.add(restaurant.name);
      mealCost += config.cost;
    }
  }

  // Sort all activities by start time to ensure proper order
  withMeals.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  return { activities: withMeals, mealCost };
}

/**
 * Estimate cost by place type
 */
function estimateCostByType(
  type: string,
  budget: { total: number } | null,
  numDays: number
): number {
  const defaults: Record<string, number> = {
    beach: 0,
    fort: 100,
    landmark: 150,
    activity: 500,
    nightlife: 1000,
    restaurant: 400,
    destination: 100,
  };

  if (budget) {
    const dailyBudget = budget.total / numDays;
    const typeMultipliers: Record<string, number> = {
      beach: 0,
      fort: 0.02,
      landmark: 0.03,
      activity: 0.1,
      nightlife: 0.2,
      restaurant: 0.08,
      destination: 0.02,
    };
    return Math.round(dailyBudget * (typeMultipliers[type] || 0.05));
  }

  return defaults[type] || 100;
}

/**
 * Get fatigue impact by place type
 */
function getFatigueByType(type: string): number {
  const impacts: Record<string, number> = {
    beach: 20,
    fort: 35,
    landmark: 25,
    activity: 40,
    nightlife: 30,
    restaurant: -5,
    destination: 20,
  };
  return impacts[type] || 20;
}

/**
 * Determine crowd level based on time and peak hours
 */
function getCrowdLevel(
  minutes: number,
  peakHours: string[]
): 'low' | 'medium' | 'high' {
  const timeStr = formatTime(minutes);

  for (const peak of peakHours) {
    const [start, end] = peak.split('-');
    if (timeStr >= start && timeStr <= end) {
      return 'high';
    }
  }

  // Check if close to peak
  for (const peak of peakHours) {
    const [start] = peak.split('-');
    const peakMinutes = parseTime(start);
    if (Math.abs(minutes - peakMinutes) < 60) {
      return 'medium';
    }
  }

  return 'low';
}

/**
 * Generate recommendations for a day
 */
function generateDayRecommendations(
  places: PlaceKnowledge[],
  _dateStr: string
): PlaceRecommendation[] {
  const recommendations: PlaceRecommendation[] = [];

  // Check what categories are missing
  const hasRestaurant = places.some(p => p.type === 'restaurant');
  const hasBeach = places.some(p => p.type === 'beach');

  // Collect nearby places from all researched places
  const allNearbyRestaurants = places.flatMap(p => p.nearbyRestaurants);
  const centroid = getClusterCentroid(places);

  if (!hasRestaurant && allNearbyRestaurants.length > 0) {
    const restaurant = allNearbyRestaurants[0];
    recommendations.push({
      name: restaurant.name,
      type: 'restaurant',
      coordinates: restaurant.coordinates,
      distance: restaurant.distance,
      reason: 'No restaurant in your plan - consider this nearby option',
      score: 0.8,
      mapUrl: `https://www.openstreetmap.org/?mlat=${restaurant.coordinates.lat}&mlon=${restaurant.coordinates.lng}`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`,
    });
  }

  return recommendations.slice(0, 3);
}

/**
 * Calculate number of days between two dates
 */
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Main function: Generate smart itinerary from PlaceKnowledge
 */
export async function generateSmartItinerary(
  knowledge: PlaceKnowledge[],
  dates: { start: string; end: string },
  budget: { total: number; currency: string; perPerson: boolean } | null,
  members: string[] = []
): Promise<GeneratedItinerary> {
  console.log(`[SmartBuilder] Generating itinerary for ${knowledge.length} places, ${dates.start} to ${dates.end}`);

  const numDays = daysBetween(dates.start, dates.end);

  // Filter out accommodation from visit planning
  const visitablePlaces = knowledge.filter(p => p.type !== 'accommodation');

  // Cluster places by proximity for each day
  const clusters = clusterByProximity(visitablePlaces, numDays);

  // Build each day's schedule
  const days: DayItinerary[] = [];

  for (let i = 0; i < numDays; i++) {
    const dayNumber = i + 1;
    const dateStr = addDays(dates.start, i);
    const dayPlaces = clusters[i] || [];

    // Optimize route within the day's places
    if (dayPlaces.length > 1) {
      const optimizedRoute = optimizeVisitOrder(dayPlaces.map(knowledgeToExtractedPlace));
      const orderedKnowledge = optimizedRoute.places.map(ep =>
        dayPlaces.find(k => k.name === ep.name) || dayPlaces[0]
      );
      const daySchedule = buildDaySchedule(dayNumber, dateStr, orderedKnowledge, budget, numDays);
      days.push(daySchedule);
    } else {
      const daySchedule = buildDaySchedule(dayNumber, dateStr, dayPlaces, budget, numDays);
      days.push(daySchedule);
    }
  }

  // Build route polyline from all visit coordinates
  const route: Coords[] = [];
  for (const day of days) {
    for (const activity of day.activities) {
      if (activity.type === 'visit' && activity.place.coordinates) {
        route.push(activity.place.coordinates);
      }
    }
  }

  // Calculate summary
  const summary: ItinerarySummary = {
    totalDays: numDays,
    totalCost: days.reduce((sum, d) => sum + d.totalCost, 0),
    placesVisited: days.reduce((sum, d) => sum + d.activities.filter(a => a.type === 'visit').length, 0),
    distanceTraveled: Math.round(days.reduce((sum, d) => sum + d.travelDistance, 0) * 10) / 10,
    averageFatiguePerDay: Math.round(days.reduce((sum, d) => sum + d.totalFatigue, 0) / numDays),
    missingCategories: findMissingCategories(knowledge),
  };

  console.log(`[SmartBuilder] Generated ${days.length} days, ${summary.placesVisited} visits, ${summary.distanceTraveled}km total`);

  return {
    days,
    route,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Find categories not covered by the places
 */
function findMissingCategories(places: PlaceKnowledge[]): string[] {
  const present = new Set(places.map(p => p.type));
  const recommended = ['beach', 'restaurant', 'landmark'];

  return recommended.filter(cat => !present.has(cat as any));
}
