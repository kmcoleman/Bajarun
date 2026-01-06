/**
 * useRoutes.ts
 *
 * Hook for fetching route data from Firestore.
 * This is the single source of truth for all route/itinerary data.
 *
 * Data location: events/bajarun2026/routes/day{N}
 */

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RouteConfig, FirestoreCoordinate } from '../types/routeConfig';

export interface UseRoutesResult {
  routes: RouteConfig[];
  loading: boolean;
  error: string | null;
}

export interface UseSingleRouteResult {
  route: RouteConfig | null;
  loading: boolean;
  error: string | null;
}

/**
 * Convert Firestore route data to RouteConfig
 * Handles converting coordinates from objects back to arrays for GeoJSON
 */
function convertFirestoreRoute(data: Record<string, unknown>): RouteConfig {
  const route = data as unknown as RouteConfig;

  // Convert routeGeometry coordinates from objects to arrays if needed
  if (route.routeGeometry?.coordinates) {
    const coords = route.routeGeometry.coordinates;
    // Check if first coordinate is an object (Firestore format) or array (already GeoJSON)
    if (coords.length > 0 && typeof coords[0] === 'object' && !Array.isArray(coords[0])) {
      // Convert from {lng, lat} objects to [lng, lat] arrays
      route.routeGeometry.coordinates = (coords as unknown as FirestoreCoordinate[]).map(
        (c) => [c.lng, c.lat] as [number, number]
      );
    }
  }

  return route;
}

/**
 * Fetch all routes for the trip
 */
export function useRoutes(): UseRoutesResult {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const routesRef = collection(db, 'events', 'bajarun2026', 'routes');
        const snapshot = await getDocs(routesRef);

        const routeData: RouteConfig[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          routeData.push(convertFirestoreRoute(data));
        });

        // Sort by day number
        routeData.sort((a, b) => a.day - b.day);

        setRoutes(routeData);
        setError(null);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError('Failed to load routes');
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  return { routes, loading, error };
}

/**
 * Fetch a single route by day number
 */
export function useRoute(dayNumber: number): UseSingleRouteResult {
  const [route, setRoute] = useState<RouteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoute() {
      try {
        const docRef = doc(db, 'events', 'bajarun2026', 'routes', `day${dayNumber}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRoute(convertFirestoreRoute(docSnap.data()));
          setError(null);
        } else {
          setRoute(null);
          setError(`Route for day ${dayNumber} not found`);
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Failed to load route');
      } finally {
        setLoading(false);
      }
    }

    fetchRoute();
  }, [dayNumber]);

  return { route, loading, error };
}

/**
 * Calculate trip summary from routes
 */
export function calculateTripSummary(routes: RouteConfig[]) {
  const totalMiles = routes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0);
  const ridingDays = routes.filter(r => (r.estimatedDistance || 0) > 0).length;
  const restDays = routes.length - ridingDays;

  return {
    totalDays: routes.length,
    ridingDays,
    restDays,
    totalMiles: Math.round(totalMiles),
    startDate: routes[0]?.date || '',
    endDate: routes[routes.length - 1]?.date || '',
    startLocation: routes[0]?.startName || '',
    endLocation: routes[routes.length - 1]?.endName || '',
  };
}
