// Location Tracker Service - Browser Geolocation API Wrapper
// Based on guardian-sos-free-api-guide.md

export interface LocationFix {
  lat: number;
  lng: number;
  accuracy_m: number;
  timestamp: number;
  source: 'gps' | 'network' | 'fused';
}

export interface LocationTrackerOptions {
  enableHighAccuracy?: boolean;
  samples?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: LocationTrackerOptions = {
  enableHighAccuracy: true,
  samples: 5,
  timeoutMs: 8000,
};

// Global watch ID for continuous tracking
let watchId: number | null = null;

/**
 * Check if geolocation is supported in the browser
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Get a high-accuracy GPS fix by collecting multiple samples
 * and fusing them for better accuracy
 */
export function getHighAccuracyFix(
  options: LocationTrackerOptions = {}
): Promise<LocationFix> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      return reject(new Error('Geolocation not supported'));
    }

    const collected: LocationFix[] = [];
    let timedOut = false;
    const start = Date.now();

    const geoOptions: PositionOptions = {
      enableHighAccuracy: opts.enableHighAccuracy,
      maximumAge: 0,
      timeout: 5000,
    };

    const success = (pos: GeolocationPosition) => {
      collected.push({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy || 9999,
        timestamp: Date.now(),
        source: 'gps',
      });

      // Check if we got enough good samples
      const bestAcc = Math.min(...collected.map((s) => s.accuracy_m));
      if (
        collected.length >= (opts.samples || 5) ||
        bestAcc <= 10 ||
        Date.now() - start > (opts.timeoutMs || 8000)
      ) {
        if (!timedOut) {
          timedOut = true;
          navigator.geolocation.clearWatch(tempWatchId);
          const fused = fuseSamples(collected);
          resolve(fused);
        }
      }
    };

    const error = (err: GeolocationPositionError) => {
      if (!timedOut) {
        timedOut = true;
        navigator.geolocation.clearWatch(tempWatchId);

        // Fallback to coarse GPS
        navigator.geolocation.getCurrentPosition(
          (p) => {
            resolve({
              lat: p.coords.latitude,
              lng: p.coords.longitude,
              accuracy_m: p.coords.accuracy || 1000,
              timestamp: Date.now(),
              source: 'network',
            });
          },
          () => {
            reject(new Error(`Geolocation error: ${err.message}`));
          },
          { enableHighAccuracy: false, timeout: 4000 }
        );
      }
    };

    const tempWatchId = navigator.geolocation.watchPosition(success, error, geoOptions);

    // Safety timeout
    setTimeout(() => {
      if (!timedOut) {
        timedOut = true;
        navigator.geolocation.clearWatch(tempWatchId);
        if (collected.length > 0) {
          resolve(fuseSamples(collected));
        } else {
          reject(new Error('Timeout obtaining fix'));
        }
      }
    }, (opts.timeoutMs || 8000) + 1000);
  });
}

/**
 * Fuse multiple GPS samples into a single high-confidence fix
 * Uses weighted average based on accuracy
 */
function fuseSamples(samples: LocationFix[]): LocationFix {
  if (!samples || samples.length === 0) {
    throw new Error('No samples to fuse');
  }

  // Sort by accuracy (best first)
  const sorted = samples.slice().sort((a, b) => a.accuracy_m - b.accuracy_m);

  // If best sample is very accurate, just use it
  if (sorted[0].accuracy_m <= 8) {
    return { ...sorted[0], source: 'gps' };
  }

  // Weighted average based on accuracy
  let wsum = 0;
  let latSum = 0;
  let lngSum = 0;
  let accMin = Infinity;

  for (const s of samples) {
    const w = 1 / Math.max(s.accuracy_m, 1);
    wsum += w;
    latSum += s.lat * w;
    lngSum += s.lng * w;
    accMin = Math.min(accMin, s.accuracy_m);
  }

  return {
    lat: latSum / wsum,
    lng: lngSum / wsum,
    accuracy_m: accMin,
    timestamp: Date.now(),
    source: 'fused',
  };
}

/**
 * Start continuous location tracking
 * @param callback Called with each new location fix
 * @returns Cleanup function to stop tracking
 */
export function startContinuousTracking(
  callback: (fix: LocationFix) => void,
  options: { enableHighAccuracy?: boolean } = {}
): () => void {
  if (!isGeolocationSupported()) {
    console.error('Geolocation not supported');
    return () => {};
  }

  // Stop any existing tracking
  stopTracking();

  const geoOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    maximumAge: 0,
    timeout: 10000,
  };

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      callback({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy || 100,
        timestamp: Date.now(),
        source: pos.coords.accuracy && pos.coords.accuracy < 50 ? 'gps' : 'network',
      });
    },
    (err) => {
      console.error('Location tracking error:', err.message);
    },
    geoOptions
  );

  return () => stopTracking();
}

/**
 * Stop continuous tracking
 */
export function stopTracking(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Request location permission
 * Returns true if permission is granted
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isGeolocationSupported()) {
    return false;
  }

  try {
    // Try to get a quick fix to trigger permission prompt
    await new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check current permission state
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}
