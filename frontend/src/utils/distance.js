// frontend/src/utils/distance.js

const EARTH_RADIUS_KM = 6371.0;
const MAX_RADIUS_KM = 100.0;

/**
 * Great-circle distance between two points (in km) using the Haversine
 * formula. Mirrors the backend validation so the client can fail fast
 * before calling the Cloud Function.
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Checks every pair of destinations against the 100 km limit.
 * Returns the IDs that participate in at least one over-limit pair,
 * plus the worst offending pair for the error message.
 *
 * @param {Array<{id: string, value: string, lat: number, lng: number}>} destinations
 * @returns {{ invalidIds: Set<string>, worstPair: {a: object, b: object, distance: number}|null }}
 */
export function findDestinationsOverRadius(destinations) {
  const invalidIds = new Set();
  let worstPair = null;

  for (let i = 0; i < destinations.length; i++) {
    for (let j = i + 1; j < destinations.length; j++) {
      const a = destinations[i];
      const b = destinations[j];

      // Skip pairs without resolved coordinates.
      if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
        continue;
      }

      const distance = haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);

      if (distance > MAX_RADIUS_KM) {
        invalidIds.add(a.id);
        invalidIds.add(b.id);

        if (!worstPair || distance > worstPair.distance) {
          worstPair = { a, b, distance };
        }
      }
    }
  }

  return { invalidIds, worstPair };
}

export { MAX_RADIUS_KM };