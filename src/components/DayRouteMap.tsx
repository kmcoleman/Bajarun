/**
 * DayRouteMap.tsx
 *
 * Interactive Mapbox map showing a single day's route with POI markers.
 * Displays start/end points, waypoints for route shaping, and category-colored POIs.
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { RouteConfig, POI } from '../types/routeConfig';
import { POI_CATEGORIES } from '../types/routeConfig';

// Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface DayRouteMapProps {
  routeConfig?: RouteConfig;
  day: number;
  height?: string;
  showControls?: boolean;
}

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

export default function DayRouteMap({
  routeConfig,
  day,
  height = '400px',
  showControls = true
}: DayRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const hasToken = !!mapboxgl.accessToken;
  const hasRoute = routeConfig &&
    routeConfig.startCoordinates?.lat &&
    routeConfig.endCoordinates?.lat;

  // Clean up markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // Initialize map
  useEffect(() => {
    if (!hasToken || !mapContainer.current || map.current) return;

    try {
      // Default center - will be adjusted once route loads
      const defaultCenter: [number, number] = [-114.5, 28.0];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: defaultCenter,
        zoom: 7,
      });

      if (showControls) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Failed to load map');
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [hasToken, showControls]);

  // Fetch driving route from Mapbox Directions API
  const fetchDrivingRoute = async (coordinates: [number, number][]): Promise<[number, number][]> => {
    if (coordinates.length < 2) return [];

    const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry.coordinates as [number, number][];
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }

    return [];
  };

  // Add route and markers when map loads or config changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !hasRoute) return;

    const addRouteAndMarkers = async () => {
      setRouteLoading(true);
      clearMarkers();

      // Remove existing route layer/source if present
      if (map.current!.getLayer('day-route')) {
        map.current!.removeLayer('day-route');
      }
      if (map.current!.getSource('day-route')) {
        map.current!.removeSource('day-route');
      }

      // Build waypoints array: start -> waypoints -> end
      // Mapbox uses [lng, lat] format
      const waypoints: [number, number][] = [
        [routeConfig!.startCoordinates.lng, routeConfig!.startCoordinates.lat]
      ];

      // Add intermediate waypoints
      if (routeConfig!.waypoints && routeConfig!.waypoints.length > 0) {
        routeConfig!.waypoints.forEach(wp => {
          if (wp.lat && wp.lng) {
            waypoints.push([wp.lng, wp.lat]);
          }
        });
      }

      // Add end point
      waypoints.push([routeConfig!.endCoordinates.lng, routeConfig!.endCoordinates.lat]);

      // Fetch driving route
      let routeCoordinates = await fetchDrivingRoute(waypoints);

      // Fallback to straight lines if API fails
      if (routeCoordinates.length === 0) {
        console.warn('Directions API failed, using straight lines');
        routeCoordinates = waypoints;
      }

      // Add route line
      map.current!.addSource('day-route', {
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

      map.current!.addLayer({
        id: 'day-route',
        type: 'line',
        source: 'day-route',
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

      // Add start marker (green)
      addLocationMarker(
        routeConfig!.startCoordinates.lat,
        routeConfig!.startCoordinates.lng,
        routeConfig!.startName || 'Start',
        'start'
      );

      // Add end marker (red)
      addLocationMarker(
        routeConfig!.endCoordinates.lat,
        routeConfig!.endCoordinates.lng,
        routeConfig!.endName || 'End',
        'end'
      );

      // Add POI markers
      if (routeConfig!.pois && routeConfig!.pois.length > 0) {
        routeConfig!.pois.forEach(poi => {
          if (poi.coordinates?.lat && poi.coordinates?.lng) {
            addPOIMarker(poi);
          }
        });
      }

      // Fit map to show entire route
      const bounds = new mapboxgl.LngLatBounds();
      routeCoordinates.forEach(coord => bounds.extend(coord));

      // Also include POIs in bounds
      if (routeConfig!.pois) {
        routeConfig!.pois.forEach(poi => {
          if (poi.coordinates?.lat && poi.coordinates?.lng) {
            bounds.extend([poi.coordinates.lng, poi.coordinates.lat]);
          }
        });
      }

      map.current!.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10
      });

      setRouteLoading(false);
    };

    addRouteAndMarkers();
  }, [mapLoaded, routeConfig, hasRoute]);

  // Add start/end location marker
  const addLocationMarker = (lat: number, lng: number, name: string, type: 'start' | 'end') => {
    if (!map.current) return;

    const color = type === 'start' ? '#22c55e' : '#ef4444';
    const label = type === 'start' ? 'A' : 'B';

    const el = document.createElement('div');
    el.className = 'day-route-marker';
    el.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      ">${label}</div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false
    }).setHTML(`
      <div style="padding: 8px; font-family: system-ui;">
        <strong style="font-size: 14px;">${name}</strong>
        <div style="font-size: 12px; color: #666; margin-top: 2px;">
          ${type === 'start' ? 'Start' : 'End'} - Day ${day}
        </div>
      </div>
    `);

    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map.current);

    markersRef.current.push(marker);
  };

  // Add POI marker with category-specific styling
  const addPOIMarker = (poi: POI) => {
    if (!map.current) return;

    const categoryConfig = POI_CATEGORIES.find(c => c.value === poi.category);
    const color = POI_COLORS[poi.category] || POI_COLORS.poi;

    // Create marker element with category color
    const el = document.createElement('div');
    el.className = 'poi-marker';
    el.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${getIconPath(poi.category)}
        </svg>
      </div>
    `;

    // Build popup content
    let popupHtml = `
      <div style="padding: 10px; font-family: system-ui; max-width: 250px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="
            display: inline-block;
            padding: 2px 8px;
            background: ${color};
            color: white;
            font-size: 11px;
            font-weight: 600;
            border-radius: 4px;
            text-transform: uppercase;
          ">${categoryConfig?.label || 'POI'}</span>
        </div>
        <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${poi.name}</strong>
    `;

    if (poi.description) {
      popupHtml += `<p style="font-size: 12px; color: #555; margin: 0 0 6px 0;">${poi.description}</p>`;
    }

    if (poi.phone) {
      popupHtml += `<div style="font-size: 12px; color: #666;"><strong>Phone:</strong> ${poi.phone}</div>`;
    }

    if (poi.hours) {
      popupHtml += `<div style="font-size: 12px; color: #666;"><strong>Hours:</strong> ${poi.hours}</div>`;
    }

    popupHtml += `</div>`;

    const popup = new mapboxgl.Popup({
      offset: 20,
      closeButton: true,
      maxWidth: '280px'
    }).setHTML(popupHtml);

    const marker = new mapboxgl.Marker(el)
      .setLngLat([poi.coordinates.lng, poi.coordinates.lat])
      .setPopup(popup)
      .addTo(map.current);

    markersRef.current.push(marker);
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

  // No token placeholder
  if (!hasToken) {
    return (
      <div
        className="bg-slate-800 flex items-center justify-center rounded-xl"
        style={{ height }}
      >
        <div className="text-center text-slate-400 p-6">
          <p className="text-sm">Map requires Mapbox API key</p>
        </div>
      </div>
    );
  }

  // No route configured
  if (!hasRoute) {
    return (
      <div
        className="bg-slate-800 flex items-center justify-center rounded-xl"
        style={{ height }}
      >
        <div className="text-center text-slate-400 p-6">
          <p className="text-sm">No route configured for Day {day}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div
        className="bg-slate-800 flex items-center justify-center rounded-xl"
        style={{ height }}
      >
        <div className="text-center text-red-400 p-6">
          <p className="text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="rounded-xl overflow-hidden"
        style={{ height }}
      />
      {!mapLoaded && (
        <div
          className="absolute inset-0 bg-slate-800 flex items-center justify-center rounded-xl"
        >
          <div className="text-slate-400 text-sm">Loading map...</div>
        </div>
      )}
      {mapLoaded && routeLoading && (
        <div className="absolute top-3 left-3 bg-slate-800/90 text-slate-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading route...
        </div>
      )}
      {/* Route info overlay */}
      {mapLoaded && !routeLoading && routeConfig && (
        <div className="absolute bottom-3 left-3 bg-slate-800/90 text-white px-3 py-2 rounded-lg text-xs">
          <div className="font-medium">Day {day}</div>
          {routeConfig.estimatedDistance && (
            <div className="text-slate-300">{routeConfig.estimatedDistance} miles</div>
          )}
          {routeConfig.estimatedTime && (
            <div className="text-slate-300">{routeConfig.estimatedTime}</div>
          )}
        </div>
      )}
      {/* POI legend */}
      {mapLoaded && !routeLoading && routeConfig?.pois && routeConfig.pois.length > 0 && (
        <div className="absolute top-3 right-12 bg-slate-800/90 text-white px-2 py-1.5 rounded-lg text-xs">
          <div className="font-medium mb-1">{routeConfig.pois.length} POIs</div>
        </div>
      )}
    </div>
  );
}
