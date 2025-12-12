// Nominatim (OpenStreetMap) Search Service - FREE, no API key needed
import type { EnrichedPlaceData, PlaceSearchResult } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const RATE_LIMIT_MS = 1100; // 1 request per second (being safe)

let lastRequestTime = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function searchNominatim(
  query: string,
  options?: {
    near?: { lat: number; lng: number };
    limit?: number;
  }
): Promise<EnrichedPlaceData[]> {
  await enforceRateLimit();

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: String(options?.limit || 3),
    addressdetails: '1',
  });

  // Add viewbox if near coordinates provided
  if (options?.near) {
    const { lat, lng } = options.near;
    const delta = 0.5; // ~50km radius
    params.set('viewbox', `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`);
    params.set('bounded', '0'); // Don't strictly bound, just prefer
  }

  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        'User-Agent': 'WanderForge/1.0 (travel-planning-hackathon)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return data.map((item: {
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
      type: string;
      class: string;
      address?: Record<string, string>;
    }) => ({
      placeId: String(item.place_id),
      name: item.display_name.split(',')[0],
      formattedAddress: item.display_name,
      coordinates: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
      types: [item.type, item.class].filter(Boolean),
      source: 'nominatim' as const,
    }));
  } catch (error) {
    console.error('Nominatim search failed:', error);
    return [];
  }
}

// Simple in-memory cache
const placeCache = new Map<string, EnrichedPlaceData>();

export function getCachedPlace(query: string): EnrichedPlaceData | null {
  return placeCache.get(query.toLowerCase()) || null;
}

export function cachePlace(query: string, place: EnrichedPlaceData): void {
  placeCache.set(query.toLowerCase(), place);
}

export async function searchPlace(query: string): Promise<PlaceSearchResult> {
  // Check cache first
  const cached = getCachedPlace(query);
  if (cached) {
    return { places: [cached], source: 'cached', cached: true };
  }

  // Search Nominatim
  const places = await searchNominatim(query);

  if (places.length > 0) {
    // Cache the first result
    cachePlace(query, places[0]);
    return { places, source: 'nominatim', cached: false };
  }

  return { places: [], source: 'nominatim', cached: false };
}
