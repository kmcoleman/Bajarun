/**
 * RouteMap.tsx
 *
 * Interactive Mapbox map showing the Baja tour route.
 * Displays markers for each day's start/end points and draws route lines.
 *
 * Data source: Firestore events/bajarun2026/routes/day{N}
 * Uses pre-calculated route geometry when available, falls back to Mapbox Directions API.
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { POI, RouteConfig, FirestoreCoordinate } from '../types/routeConfig';
import { POI_CATEGORIES } from '../types/routeConfig';

// Convert Firestore route data (coordinates as objects) to RouteConfig (coordinates as arrays)
function convertFirestoreRoute(data: Record<string, unknown>): RouteConfig {
  const route = { ...data } as unknown as RouteConfig;

  // Convert routeGeometry coordinates from {lng, lat} objects to [lng, lat] arrays
  if (route.routeGeometry?.coordinates) {
    const coords = route.routeGeometry.coordinates;
    // Check if coordinates are stored as objects (Firestore format)
    if (coords.length > 0 && typeof coords[0] === 'object' && !Array.isArray(coords[0])) {
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

// Mapbox access token - set in environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// POI category colors for markers
const POI_COLORS: Record<string, string> = {
  gas: '#facc15',      // yellow-400
  restaurant: '#fb923c', // orange-400
  poi: '#3b82f6',      // blue-500
  viewpoint: '#22c55e', // green-500
  photo: '#a855f7',    // purple-500
  border: '#ef4444',   // red-500
  emergency: '#dc2626', // red-600
};

interface RouteMapProps {
  onDayClick?: (day: number) => void;
  selectedDay?: number | null;
}

export default function RouteMap({ onDayClick, selectedDay }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [allRoutes, setAllRoutes] = useState<RouteConfig[]>([]);
  const [allPOIs, setAllPOIs] = useState<Array<POI & { dayNumber: number }>>([]);

  // Check if token is available
  const hasToken = !!mapboxgl.accessToken;

  // Load all route data from Firestore (including geometry and POIs)
  useEffect(() => {
    async function loadAllRoutes() {
      console.log('Loading routes from Firestore...');
      try {
        const routesRef = collection(db, 'events', 'bajarun2026', 'routes');
        const snapshot = await getDocs(routesRef);
        const routes: RouteConfig[] = [];
        const pois: Array<POI & { dayNumber: number }> = [];

        console.log('Found', snapshot.size, 'route documents');

        snapshot.forEach((doc) => {
          const routeConfig = convertFirestoreRoute(doc.data() as Record<string, unknown>);
          routes.push(routeConfig);

          // Extract POIs
          if (routeConfig.pois && routeConfig.pois.length > 0) {
            console.log('Day', routeConfig.day, 'has', routeConfig.pois.length, 'POIs');
            routeConfig.pois.forEach(poi => {
              if (poi.coordinates?.lat && poi.coordinates?.lng) {
                pois.push({ ...poi, dayNumber: routeConfig.day });
              }
            });
          }
        });

        // Sort by day
        routes.sort((a, b) => a.day - b.day);

        console.log('Total routes loaded:', routes.length);
        console.log('Total POIs loaded:', pois.length);
        console.log('Routes with geometry:', routes.filter(r => r.routeGeometry).length);

        setAllRoutes(routes);
        setAllPOIs(pois);
      } catch (error) {
        console.error('Error loading routes:', error);
      }
    }

    loadAllRoutes();
  }, []);

  // Add route and markers when map is loaded and routes are available
  useEffect(() => {
    if (!map.current || !mapLoaded || allRoutes.length === 0) return;

    console.log('Adding route and markers from', allRoutes.length, 'days');
    addRouteAndMarkers();
  }, [mapLoaded, allRoutes]);

  // Add POI markers when map is loaded and POIs are available
  useEffect(() => {
    console.log('POI marker effect - mapLoaded:', mapLoaded, 'POIs:', allPOIs.length, 'map:', !!map.current);
    if (!map.current || !mapLoaded || allPOIs.length === 0) return;

    console.log('Adding', allPOIs.length, 'POI markers to map');

    // Clear existing POI markers
    poiMarkersRef.current.forEach(marker => marker.remove());
    poiMarkersRef.current = [];

    // Add POI markers
    allPOIs.forEach(poi => {
      addPOIMarker(poi);
    });

    console.log('POI markers added:', poiMarkersRef.current.length);
  }, [mapLoaded, allPOIs]);

  // Add POI marker with category-specific styling
  const addPOIMarker = (poi: POI & { dayNumber: number }) => {
    if (!map.current) return;

    const categoryConfig = POI_CATEGORIES.find(c => c.value === poi.category);
    const color = POI_COLORS[poi.category] || POI_COLORS.poi;

    // Create marker element with category color
    const el = document.createElement('div');
    el.className = 'poi-marker';
    el.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${getIconPath(poi.category)}
        </svg>
      </div>
    `;

    // Build popup content
    let popupHtml = `
      <div style="padding: 8px; font-family: system-ui; max-width: 220px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="
            display: inline-block;
            padding: 1px 6px;
            background: ${color};
            color: white;
            font-size: 10px;
            font-weight: 600;
            border-radius: 3px;
            text-transform: uppercase;
          ">${categoryConfig?.label || 'POI'}</span>
          <span style="font-size: 10px; color: #888;">Day ${poi.dayNumber}</span>
        </div>
        <strong style="font-size: 13px; display: block; margin-bottom: 2px;">${poi.name}</strong>
    `;

    if (poi.description) {
      popupHtml += `<p style="font-size: 11px; color: #555; margin: 0;">${poi.description}</p>`;
    }

    popupHtml += `</div>`;

    const popup = new mapboxgl.Popup({
      offset: 15,
      closeButton: false,
      maxWidth: '240px'
    }).setHTML(popupHtml);

    const marker = new mapboxgl.Marker(el)
      .setLngLat([poi.coordinates.lng, poi.coordinates.lat])
      .setPopup(popup)
      .addTo(map.current);

    poiMarkersRef.current.push(marker);
  };

  // Get SVG path for POI category icon
  const getIconPath = (category: string): string => {
    switch (category) {
      case 'gas':
        return '<path d="M3 22V5a2 2 0 012-2h6a2 2 0 012 2v17"/><path d="M14 10h2a2 2 0 012 2v2a2 2 0 002 2h0a2 2 0 002-2V9.83a2 2 0 00-.59-1.42L18 5"/>';
      case 'restaurant':
        return '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>';
      case 'viewpoint':
        return '<path d="M8 3l4 8 5-5 5 15H2L8 3z"/>';
      case 'photo':
        return '<path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>';
      case 'border':
        return '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>';
      case 'emergency':
        return '<path d="M12 2v20M2 12h20"/>';
      default: // poi / mappin
        return '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>';
    }
  };

  useEffect(() => {
    if (!hasToken || !mapContainer.current || map.current) return;

    try {
      // Initialize map centered on Baja California
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-114.5, 29.5], // Center of Baja
        zoom: 5,
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
        // Route will be added when allRoutes is populated
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map. Please check your API key.');
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map.');
    }

    return () => {
      // Clean up day markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Clean up POI markers
      poiMarkersRef.current.forEach(marker => marker.remove());
      poiMarkersRef.current = [];

      // Clean up map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [hasToken]);

  // Fetch driving route from Mapbox Directions API
  const fetchDrivingRoute = async (coordinates: [number, number][]): Promise<[number, number][]> => {
    // Mapbox Directions API has a limit of 25 waypoints per request
    // We'll make multiple requests if needed and combine them
    const allRouteCoords: [number, number][] = [];
    const chunkSize = 25;

    for (let i = 0; i < coordinates.length - 1; i += chunkSize - 1) {
      const chunk = coordinates.slice(i, Math.min(i + chunkSize, coordinates.length));
      if (chunk.length < 2) break;

      const coordString = chunk.map(c => `${c[0]},${c[1]}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const routeCoords = data.routes[0].geometry.coordinates as [number, number][];
          // Avoid duplicating the connection point
          if (allRouteCoords.length > 0) {
            allRouteCoords.push(...routeCoords.slice(1));
          } else {
            allRouteCoords.push(...routeCoords);
          }
        }
      } catch (error) {
        console.error('Error fetching route segment:', error);
      }
    }

    return allRouteCoords;
  };

  // Add route line and markers
  const addRouteAndMarkers = async () => {
    if (!map.current || allRoutes.length === 0) return;

    setRouteLoading(true);

    // Check if we have stored geometry
    const routesWithGeometry = allRoutes.filter(r => r.routeGeometry?.coordinates?.length);
    const hasStoredGeometry = routesWithGeometry.length > 0;

    let routeCoordinates: [number, number][] = [];

    if (hasStoredGeometry) {
      // Use stored geometry - combine all route segments
      console.log('Using stored route geometry from', routesWithGeometry.length, 'routes');
      routesWithGeometry.forEach(route => {
        if (route.routeGeometry?.coordinates) {
          // Avoid duplicating connection points
          if (routeCoordinates.length > 0) {
            routeCoordinates.push(...route.routeGeometry.coordinates.slice(1));
          } else {
            routeCoordinates.push(...route.routeGeometry.coordinates);
          }
        }
      });
    } else {
      // Fallback: fetch from Mapbox Directions API
      console.log('No stored geometry, fetching from Mapbox API');
      const waypoints: [number, number][] = [];

      allRoutes.forEach((route) => {
        // Add any intermediate waypoints
        if (route.waypoints && route.waypoints.length > 0) {
          route.waypoints.forEach(wp => {
            waypoints.push([wp.lng, wp.lat]);
          });
        }

        // Add end point
        if (route.endCoordinates) {
          const endCoord: [number, number] = [route.endCoordinates.lng, route.endCoordinates.lat];
          if (waypoints.length === 0 ||
              waypoints[waypoints.length - 1][0] !== endCoord[0] ||
              waypoints[waypoints.length - 1][1] !== endCoord[1]) {
            waypoints.push(endCoord);
          }
        }
      });

      routeCoordinates = await fetchDrivingRoute(waypoints);

      // Fallback to straight lines if API fails
      if (routeCoordinates.length === 0) {
        console.warn('Directions API failed, using straight lines');
        routeCoordinates = waypoints;
      }
    }

    // Remove existing route if present
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Add route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add markers for each unique location
    const addedLocations = new Set<string>();

    allRoutes.forEach((route) => {
      if (!route.endCoordinates) return;
      const endKey = `${route.endCoordinates.lat},${route.endCoordinates.lng}`;

      // Only add marker if we haven't added one for this location
      if (!addedLocations.has(endKey)) {
        addedLocations.add(endKey);
        addMarker(route);
      }
    });

    setRouteLoading(false);
  };

  // Add a marker for a day
  const addMarker = (route: RouteConfig) => {
    if (!map.current || !route.endCoordinates) return;

    const miles = route.estimatedDistance || 0;
    const isRestDay = miles === 0 && route.day !== 1;
    const isStart = route.day === 1;
    const isEnd = route.day === allRoutes.length;

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'route-marker';
    el.innerHTML = `
      <div class="marker-container ${isStart ? 'marker-start' : isEnd ? 'marker-end' : isRestDay ? 'marker-rest' : 'marker-default'}">
        <span class="marker-day">${route.day}</span>
      </div>
    `;

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      className: 'route-popup'
    }).setHTML(`
      <div class="popup-content">
        <h3 class="popup-title">Day ${route.day}: ${route.title}</h3>
        <p class="popup-location">${route.endName}</p>
        ${miles > 0 ? `<p class="popup-miles">${miles} miles</p>` : '<p class="popup-rest">Rest Day</p>'}
      </div>
    `);

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([route.endCoordinates.lng, route.endCoordinates.lat])
      .setPopup(popup)
      .addTo(map.current);

    // Add click handler
    el.addEventListener('click', () => {
      if (onDayClick) {
        onDayClick(route.day);
      }
    });

    markersRef.current.push(marker);
  };

  // Fly to selected day when it changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedDay || allRoutes.length === 0) return;

    const route = allRoutes.find(d => d.day === selectedDay);
    if (route && route.endCoordinates) {
      map.current.flyTo({
        center: [route.endCoordinates.lng, route.endCoordinates.lat],
        zoom: 8,
        duration: 1500
      });

      // Open the popup for this marker
      const marker = markersRef.current[selectedDay - 1];
      if (marker) {
        marker.togglePopup();
      }
    }
  }, [selectedDay, mapLoaded, allRoutes]);

  // Show placeholder if no token
  if (!hasToken) {
    return (
      <div className="h-full min-h-[300px] bg-slate-900 flex items-center justify-center rounded-xl">
        <div className="text-center text-slate-400 p-6">
          <p className="text-lg font-medium mb-2">Map requires Mapbox API key</p>
          <p className="text-sm mb-4">Add VITE_MAPBOX_TOKEN to your .env file</p>
          <a
            href="https://account.mapbox.com/auth/signup/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Get a free Mapbox account →
          </a>
        </div>
      </div>
    );
  }

  // Show error state
  if (mapError) {
    return (
      <div className="h-full min-h-[300px] bg-slate-900 flex items-center justify-center rounded-xl">
        <div className="text-center text-red-400 p-6">
          <p className="text-lg font-medium">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={mapContainer}
        className="h-full min-h-[300px] rounded-xl overflow-hidden"
      />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center rounded-xl">
          <div className="text-slate-400">Loading map...</div>
        </div>
      )}
      {mapLoaded && routeLoading && (
        <div className="absolute top-4 left-4 bg-slate-800/90 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading route...
        </div>
      )}
    </div>
  );
}
