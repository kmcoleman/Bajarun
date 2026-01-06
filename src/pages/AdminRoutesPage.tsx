/**
 * AdminRoutesPage.tsx
 *
 * Admin page to view and edit route documents for each day.
 * Manages the single source of truth: events/bajarun2026/routes/day{N}
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Map,
  MapPin,
  Route,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Trash2,
  Fuel,
  UtensilsCrossed,
  Mountain,
  Camera,
  Flag,
  Cross,
  Edit2,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import type { RouteConfig, POI, POICategory, FirestoreCoordinate } from '../types/routeConfig';
import { POI_CATEGORIES, emptyRouteConfig } from '../types/routeConfig';
import simplify from '@turf/simplify';
import { lineString } from '@turf/helpers';

/**
 * Convert Firestore route data to RouteConfig
 * Handles converting coordinates from objects back to arrays for GeoJSON
 */
function convertFirestoreRoute(data: Record<string, unknown>): RouteConfig {
  const route = { ...data } as unknown as RouteConfig;

  // Convert routeGeometry coordinates from objects to arrays if needed
  if (route.routeGeometry?.coordinates) {
    const coords = route.routeGeometry.coordinates;
    // Check if first coordinate is an object (Firestore format) or array (already GeoJSON)
    if (coords.length > 0 && typeof coords[0] === 'object' && !Array.isArray(coords[0])) {
      // Convert from {lng, lat} objects to [lng, lat] arrays
      route.routeGeometry = {
        type: 'LineString',
        coordinates: (coords as unknown as FirestoreCoordinate[]).map(
          (c) => [c.lng, c.lat] as [number, number]
        ),
      };
    }
  }

  return route;
}

/**
 * Convert RouteConfig to Firestore-safe format
 * Converts geometry coordinates from arrays to objects (Firestore doesn't support nested arrays)
 */
function convertRouteForFirestore(route: RouteConfig): Record<string, unknown> {
  const firestoreRoute: Record<string, unknown> = { ...route };

  // Convert routeGeometry coordinates from arrays to objects
  if (route.routeGeometry?.coordinates) {
    firestoreRoute.routeGeometry = {
      type: 'LineString',
      coordinates: route.routeGeometry.coordinates.map((coord) => ({
        lng: coord[0],
        lat: coord[1],
      })),
    };
  }

  return firestoreRoute;
}

// Icon mapping for POI categories
const POI_ICONS: Record<POICategory, React.ComponentType<{ className?: string }>> = {
  gas: Fuel,
  restaurant: UtensilsCrossed,
  poi: MapPin,
  viewpoint: Mountain,
  photo: Camera,
  border: Flag,
  emergency: Cross,
};

export default function AdminRoutesPage() {
  const { loading: authLoading } = useAuth();

  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<number | null>(null);
  const [editingPoi, setEditingPoi] = useState<{ day: number; poiIndex: number } | null>(null);
  const [generatingRoute, setGeneratingRoute] = useState<number | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Load all routes
  useEffect(() => {
    async function loadRoutes() {
      try {
        const routesRef = collection(db, 'events', 'bajarun2026', 'routes');
        const snapshot = await getDocs(routesRef);
        const routeData: RouteConfig[] = [];

        snapshot.forEach((docSnapshot) => {
          routeData.push(convertFirestoreRoute(docSnapshot.data()));
        });

        // Sort by day and ensure all 9 days exist
        routeData.sort((a, b) => a.day - b.day);

        // Fill in missing days with empty config
        const fullRoutes: RouteConfig[] = [];
        for (let day = 1; day <= 9; day++) {
          const existing = routeData.find(r => r.day === day);
          if (existing) {
            fullRoutes.push(existing);
          } else {
            fullRoutes.push({ ...emptyRouteConfig, day });
          }
        }

        setRoutes(fullRoutes);
      } catch (error) {
        console.error('Error loading routes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRoutes();
  }, []);

  // Toggle day expansion
  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  // Update a route field
  const updateRoute = (day: number, field: keyof RouteConfig, value: any) => {
    setRoutes(prev => prev.map(r =>
      r.day === day ? { ...r, [field]: value } : r
    ));
  };

  // Update coordinates
  const updateCoordinates = (day: number, field: 'startCoordinates' | 'endCoordinates', coord: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0;
    setRoutes(prev => prev.map(r =>
      r.day === day ? {
        ...r,
        [field]: { ...r[field], [coord]: numValue }
      } : r
    ));
  };

  // Add a new POI
  const addPoi = (day: number) => {
    const newPoi: POI = {
      id: `poi-${Date.now()}`,
      name: '',
      coordinates: { lat: 0, lng: 0 },
      category: 'poi',
      description: '',
    };
    setRoutes(prev => prev.map(r =>
      r.day === day ? { ...r, pois: [...r.pois, newPoi] } : r
    ));
    // Start editing the new POI
    const route = routes.find(r => r.day === day);
    if (route) {
      setEditingPoi({ day, poiIndex: route.pois.length });
    }
  };

  // Update a POI
  const updatePoi = (day: number, poiIndex: number, field: keyof POI, value: any) => {
    setRoutes(prev => prev.map(r => {
      if (r.day !== day) return r;
      const newPois = [...r.pois];
      newPois[poiIndex] = { ...newPois[poiIndex], [field]: value };
      return { ...r, pois: newPois };
    }));
  };

  // Update POI coordinates
  const updatePoiCoordinates = (day: number, poiIndex: number, coord: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0;
    setRoutes(prev => prev.map(r => {
      if (r.day !== day) return r;
      const newPois = [...r.pois];
      newPois[poiIndex] = {
        ...newPois[poiIndex],
        coordinates: { ...newPois[poiIndex].coordinates, [coord]: numValue }
      };
      return { ...r, pois: newPois };
    }));
  };

  // Delete a POI
  const deletePoi = (day: number, poiIndex: number) => {
    if (!confirm('Delete this POI?')) return;
    setRoutes(prev => prev.map(r => {
      if (r.day !== day) return r;
      const newPois = r.pois.filter((_, i) => i !== poiIndex);
      return { ...r, pois: newPois };
    }));
    setEditingPoi(null);
  };

  // Add a new waypoint
  const addWaypoint = (day: number) => {
    setRoutes(prev => prev.map(r =>
      r.day === day ? { ...r, waypoints: [...r.waypoints, { lat: 0, lng: 0 }] } : r
    ));
  };

  // Update a waypoint
  const updateWaypoint = (day: number, wpIndex: number, coord: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0;
    setRoutes(prev => prev.map(r => {
      if (r.day !== day) return r;
      const newWaypoints = [...r.waypoints];
      newWaypoints[wpIndex] = { ...newWaypoints[wpIndex], [coord]: numValue };
      return { ...r, waypoints: newWaypoints };
    }));
  };

  // Delete a waypoint
  const deleteWaypoint = (day: number, wpIndex: number) => {
    setRoutes(prev => prev.map(r => {
      if (r.day !== day) return r;
      const newWaypoints = r.waypoints.filter((_, i) => i !== wpIndex);
      return { ...r, waypoints: newWaypoints };
    }));
  };

  // Save a route
  const saveRoute = async (day: number) => {
    const route = routes.find(r => r.day === day);
    if (!route) return;

    setSavingDay(day);
    try {
      const docRef = doc(db, 'events', 'bajarun2026', 'routes', `day${day}`);
      const firestoreData = convertRouteForFirestore(route);
      await setDoc(docRef, {
        ...firestoreData,
        updatedAt: serverTimestamp(),
      });
      setSaveSuccess(day);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Failed to save route. Please try again.');
    } finally {
      setSavingDay(null);
    }
  };

  // Generate route geometry using Mapbox Directions API
  const generateRouteGeometry = async (day: number) => {
    const route = routes.find(r => r.day === day);
    if (!route) return;

    // Validate coordinates
    if (!route.startCoordinates.lat || !route.startCoordinates.lng ||
        !route.endCoordinates.lat || !route.endCoordinates.lng) {
      setRouteError('Start and end coordinates are required');
      setTimeout(() => setRouteError(null), 3000);
      return;
    }

    setGeneratingRoute(day);
    setRouteError(null);

    try {
      // Build coordinates string: start;waypoints;end
      const coords: string[] = [];
      coords.push(`${route.startCoordinates.lng},${route.startCoordinates.lat}`);

      // Add waypoints if any
      if (route.waypoints && route.waypoints.length > 0) {
        route.waypoints.forEach(wp => {
          if (wp.lat && wp.lng) {
            coords.push(`${wp.lng},${wp.lat}`);
          }
        });
      }

      coords.push(`${route.endCoordinates.lng},${route.endCoordinates.lat}`);

      const coordString = coords.join(';');
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

      // Call Mapbox Directions API
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${mapboxToken}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found between these points');
      }

      const routeData = data.routes[0];
      const geometry = routeData.geometry;
      const distanceMeters = routeData.distance;
      const durationSeconds = routeData.duration;

      // Convert distance to miles
      const distanceMiles = Math.round(distanceMeters / 1609.34);

      // Convert duration to hours and minutes
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.round((durationSeconds % 3600) / 60);
      const estimatedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Simplify geometry to reduce storage (Douglas-Peucker algorithm)
      // tolerance: 0.0005 ≈ ~50m accuracy, good balance of size vs detail
      const originalCount = geometry.coordinates.length;
      const line = lineString(geometry.coordinates);
      const simplified = simplify(line, { tolerance: 0.0005, highQuality: true });
      const simplifiedCoords = simplified.geometry.coordinates as [number, number][];
      console.log(`Route simplified: ${originalCount} → ${simplifiedCoords.length} points (${Math.round((1 - simplifiedCoords.length / originalCount) * 100)}% reduction)`);

      // Convert nested arrays to objects for Firestore (doesn't support nested arrays)
      const coordinatesAsObjects = simplifiedCoords.map((coord: [number, number]) => ({
        lng: coord[0],
        lat: coord[1],
      }));

      // Update route with geometry and calculated metrics
      setRoutes(prev => prev.map(r =>
        r.day === day ? {
          ...r,
          routeGeometry: {
            type: 'LineString' as const,
            coordinates: simplifiedCoords, // Keep as arrays in state for map rendering
          },
          estimatedDistance: distanceMiles,
          estimatedTime: estimatedTime,
        } : r
      ));

      // Auto-save the route after generating (convert to objects for Firestore)
      const updatedRoute = {
        ...route,
        routeGeometry: {
          type: 'LineString' as const,
          coordinates: coordinatesAsObjects, // Store as objects in Firestore
        },
        estimatedDistance: distanceMiles,
        estimatedTime: estimatedTime,
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, 'events', 'bajarun2026', 'routes', `day${day}`);
      await setDoc(docRef, updatedRoute);

      setSaveSuccess(day);
      setTimeout(() => setSaveSuccess(null), 2000);

    } catch (error) {
      console.error('Error generating route:', error);
      setRouteError(error instanceof Error ? error.message : 'Failed to generate route');
      setTimeout(() => setRouteError(null), 5000);
    } finally {
      setGeneratingRoute(null);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <AdminLayout title="Route Management">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Route Management">
      {/* Header */}
      <div className="mb-6">
        <p className="text-slate-400">
          Edit route information for each day of the trip. Changes are saved per-day.
        </p>
      </div>

      {/* Route Cards */}
      <div className="space-y-4">
        {routes.map((route) => {
          const isExpanded = expandedDays.has(route.day);
          const isSaving = savingDay === route.day;
          const isSuccess = saveSuccess === route.day;
          const hasData = route.title && route.startName;

          return (
            <div
              key={route.day}
              className={`bg-slate-800 rounded-xl border overflow-hidden ${
                hasData ? 'border-slate-700' : 'border-amber-500/50'
              }`}
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDay(route.day)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    hasData ? 'bg-blue-600/20' : 'bg-amber-600/20'
                  }`}>
                    <Map className={`h-5 w-5 ${hasData ? 'text-blue-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">
                      Day {route.day}: {route.title || '(No title)'}
                    </h3>
                    <div className="text-sm text-slate-400 flex items-center gap-4">
                      <span>{route.date || 'No date'}</span>
                      {route.estimatedDistance && (
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {route.estimatedDistance} mi
                        </span>
                      )}
                      <span>{route.pois.length} POIs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!hasData && (
                    <span className="px-3 py-1 rounded-full text-sm bg-amber-600/20 text-amber-400">
                      Incomplete
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-slate-700">
                  <div className="pt-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                        <input
                          type="text"
                          value={route.title}
                          onChange={(e) => updateRoute(route.day, 'title', e.target.value)}
                          placeholder="e.g., Temecula to Rancho Meling"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                        <input
                          type="text"
                          value={route.date}
                          onChange={(e) => updateRoute(route.day, 'date', e.target.value)}
                          placeholder="e.g., March 20, 2026"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Ride Summary */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Ride Summary</label>
                      <textarea
                        value={route.rideSummary || ''}
                        onChange={(e) => updateRoute(route.day, 'rideSummary', e.target.value)}
                        placeholder="Short summary of the day's ride for itinerary display..."
                        rows={2}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description (Full)</label>
                      <textarea
                        value={route.description}
                        onChange={(e) => updateRoute(route.day, 'description', e.target.value)}
                        placeholder="Full day description..."
                        rows={3}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Start Location */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Flag className="h-4 w-4" /> Start Location
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={route.startName}
                            onChange={(e) => updateRoute(route.day, 'startName', e.target.value)}
                            placeholder="e.g., Temecula, CA"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={route.startCoordinates.lat || ''}
                            onChange={(e) => updateCoordinates(route.day, 'startCoordinates', 'lat', e.target.value)}
                            placeholder="33.4936"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={route.startCoordinates.lng || ''}
                            onChange={(e) => updateCoordinates(route.day, 'startCoordinates', 'lng', e.target.value)}
                            placeholder="-117.1484"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* End Location */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> End Location
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={route.endName}
                            onChange={(e) => updateRoute(route.day, 'endName', e.target.value)}
                            placeholder="e.g., Rancho Meling, BC"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            value={route.endCoordinates.lat || ''}
                            onChange={(e) => updateCoordinates(route.day, 'endCoordinates', 'lat', e.target.value)}
                            placeholder="30.9667"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            value={route.endCoordinates.lng || ''}
                            onChange={(e) => updateCoordinates(route.day, 'endCoordinates', 'lng', e.target.value)}
                            placeholder="-115.7333"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Waypoints Section */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                          <Route className="h-4 w-4" /> Waypoints ({route.waypoints.length})
                        </h4>
                        <button
                          onClick={() => addWaypoint(route.day)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add Waypoint
                        </button>
                      </div>

                      <p className="text-sm text-slate-400 mb-4">
                        Add intermediate points to shape the route. The generated route will pass through these coordinates in order.
                      </p>

                      {route.waypoints.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 bg-slate-800/50 rounded-lg text-sm">
                          No waypoints. Route will go directly from start to end.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {route.waypoints.map((wp, wpIndex) => (
                            <div key={wpIndex} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                              <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-400 text-sm font-medium">{wpIndex + 1}</span>
                              </div>
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={wp.lat || ''}
                                    onChange={(e) => updateWaypoint(route.day, wpIndex, 'lat', e.target.value)}
                                    placeholder="32.1234"
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={wp.lng || ''}
                                    onChange={(e) => updateWaypoint(route.day, wpIndex, 'lng', e.target.value)}
                                    placeholder="-116.5678"
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => deleteWaypoint(route.day, wpIndex)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                                title="Delete waypoint"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Route Geometry Section */}
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                          <Navigation className="h-4 w-4" /> Route Geometry
                        </h4>
                        {route.routeGeometry ? (
                          <span className="px-3 py-1 rounded-full text-xs bg-green-600/20 text-green-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {route.routeGeometry.coordinates.length} points
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs bg-amber-600/20 text-amber-400">
                            No geometry
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 mb-4">
                        Generate road-following route from Mapbox Directions API. This will also calculate distance and time.
                      </p>

                      {routeError && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {routeError}
                        </div>
                      )}

                      <button
                        onClick={() => generateRouteGeometry(route.day)}
                        disabled={generatingRoute === route.day || !route.startCoordinates.lat || !route.endCoordinates.lat}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          generatingRoute === route.day
                            ? 'bg-slate-600 text-slate-400 cursor-wait'
                            : (!route.startCoordinates.lat || !route.endCoordinates.lat)
                            ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {generatingRoute === route.day ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating Route...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4" />
                            {route.routeGeometry ? 'Regenerate Route' : 'Generate Route'}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Route Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Distance (miles)</label>
                        <input
                          type="number"
                          value={route.estimatedDistance || ''}
                          onChange={(e) => updateRoute(route.day, 'estimatedDistance', parseFloat(e.target.value) || 0)}
                          placeholder="273"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Time</label>
                        <input
                          type="text"
                          value={route.estimatedTime || ''}
                          onChange={(e) => updateRoute(route.day, 'estimatedTime', e.target.value)}
                          placeholder="6h 22m"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Accommodation Type</label>
                        <select
                          value={route.accommodationType || ''}
                          onChange={(e) => updateRoute(route.day, 'accommodationType', e.target.value || undefined)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="hotel">Hotel</option>
                          <option value="camping">Camping</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                    </div>

                    {/* POIs Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                          Points of Interest ({route.pois.length})
                        </h4>
                        <button
                          onClick={() => addPoi(route.day)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add POI
                        </button>
                      </div>

                      {route.pois.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-700/30 rounded-lg">
                          No POIs added yet. Click "Add POI" to create one.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {route.pois.map((poi, poiIndex) => {
                            const isEditing = editingPoi?.day === route.day && editingPoi?.poiIndex === poiIndex;
                            const IconComponent = POI_ICONS[poi.category] || MapPin;
                            const categoryConfig = POI_CATEGORIES.find(c => c.value === poi.category);

                            return (
                              <div
                                key={poi.id}
                                className={`rounded-lg border ${
                                  isEditing ? 'border-blue-500 bg-slate-700' : 'border-slate-600 bg-slate-700/50'
                                }`}
                              >
                                {isEditing ? (
                                  // Edit Mode
                                  <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">Name</label>
                                        <input
                                          type="text"
                                          value={poi.name}
                                          onChange={(e) => updatePoi(route.day, poiIndex, 'name', e.target.value)}
                                          placeholder="POI Name"
                                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">Category</label>
                                        <select
                                          value={poi.category}
                                          onChange={(e) => updatePoi(route.day, poiIndex, 'category', e.target.value)}
                                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          {POI_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">Latitude</label>
                                        <input
                                          type="number"
                                          step="any"
                                          value={poi.coordinates.lat || ''}
                                          onChange={(e) => updatePoiCoordinates(route.day, poiIndex, 'lat', e.target.value)}
                                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-slate-400 mb-1">Longitude</label>
                                        <input
                                          type="number"
                                          step="any"
                                          value={poi.coordinates.lng || ''}
                                          onChange={(e) => updatePoiCoordinates(route.day, poiIndex, 'lng', e.target.value)}
                                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">Description</label>
                                      <input
                                        type="text"
                                        value={poi.description}
                                        onChange={(e) => updatePoi(route.day, poiIndex, 'description', e.target.value)}
                                        placeholder="Optional description"
                                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        onClick={() => deletePoi(route.day, poiIndex)}
                                        className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded text-sm transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => setEditingPoi(null)}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // View Mode
                                  <div
                                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/70 transition-colors"
                                    onClick={() => setEditingPoi({ day: route.day, poiIndex })}
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryConfig?.bgColor || 'bg-blue-500'}`}>
                                      <IconComponent className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-white truncate">
                                        {poi.name || '(Unnamed POI)'}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {categoryConfig?.label} • {poi.coordinates.lat.toFixed(4)}, {poi.coordinates.lng.toFixed(4)}
                                      </div>
                                    </div>
                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-slate-700">
                      <button
                        onClick={() => saveRoute(route.day)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-colors ${
                          isSuccess
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isSuccess ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Save className="h-5 w-5" />
                        )}
                        {isSaving ? 'Saving...' : isSuccess ? 'Saved!' : 'Save Day ' + route.day}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
