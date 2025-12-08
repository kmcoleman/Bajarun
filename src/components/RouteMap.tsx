/**
 * RouteMap.tsx
 *
 * Interactive Mapbox map showing the Baja tour route.
 * Displays markers for each day's start/end points and draws route lines.
 * Uses Mapbox Directions API to show actual road routes.
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { itineraryData, type DayItinerary } from '../data/itinerary';

// Mapbox access token - set in environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface RouteMapProps {
  onDayClick?: (day: number) => void;
  selectedDay?: number | null;
}

export default function RouteMap({ onDayClick, selectedDay }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Check if token is available
  const hasToken = !!mapboxgl.accessToken;

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
        addRouteAndMarkers();
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
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

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
    if (!map.current) return;

    setRouteLoading(true);

    // Create waypoint coordinates from itinerary (unique locations only)
    const waypoints: [number, number][] = [];

    itineraryData.forEach((day) => {
      // Add end point of each day (which is the destination)
      const endCoord: [number, number] = [day.coordinates.end[1], day.coordinates.end[0]];

      // Only add if different from last waypoint
      if (waypoints.length === 0 ||
          waypoints[waypoints.length - 1][0] !== endCoord[0] ||
          waypoints[waypoints.length - 1][1] !== endCoord[1]) {
        waypoints.push(endCoord);
      }
    });

    // Fetch actual driving route
    let routeCoordinates = await fetchDrivingRoute(waypoints);

    // Fallback to straight lines if directions API fails
    if (routeCoordinates.length === 0) {
      console.warn('Directions API failed, using straight lines');
      routeCoordinates = waypoints;
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

    itineraryData.forEach((day) => {
      const endKey = `${day.coordinates.end[0]},${day.coordinates.end[1]}`;

      // Only add marker if we haven't added one for this location
      if (!addedLocations.has(endKey)) {
        addedLocations.add(endKey);
        addMarker(day);
      }
    });

    setRouteLoading(false);
  };

  // Add a marker for a day
  const addMarker = (day: DayItinerary) => {
    if (!map.current) return;

    const isRestDay = day.miles === 0 && day.day !== 1;
    const isStart = day.day === 1;
    const isEnd = day.day === itineraryData.length;

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'route-marker';
    el.innerHTML = `
      <div class="marker-container ${isStart ? 'marker-start' : isEnd ? 'marker-end' : isRestDay ? 'marker-rest' : 'marker-default'}">
        <span class="marker-day">${day.day}</span>
      </div>
    `;

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      className: 'route-popup'
    }).setHTML(`
      <div class="popup-content">
        <h3 class="popup-title">Day ${day.day}: ${day.title}</h3>
        <p class="popup-location">${day.endPoint}</p>
        ${day.miles > 0 ? `<p class="popup-miles">${day.miles} miles</p>` : '<p class="popup-rest">Rest Day</p>'}
      </div>
    `);

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([day.coordinates.end[1], day.coordinates.end[0]])
      .setPopup(popup)
      .addTo(map.current);

    // Add click handler
    el.addEventListener('click', () => {
      if (onDayClick) {
        onDayClick(day.day);
      }
    });

    markersRef.current.push(marker);
  };

  // Fly to selected day when it changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedDay) return;

    const day = itineraryData.find(d => d.day === selectedDay);
    if (day) {
      map.current.flyTo({
        center: [day.coordinates.end[1], day.coordinates.end[0]],
        zoom: 8,
        duration: 1500
      });

      // Open the popup for this marker
      const marker = markersRef.current[selectedDay - 1];
      if (marker) {
        marker.togglePopup();
      }
    }
  }, [selectedDay, mapLoaded]);

  // Show placeholder if no token
  if (!hasToken) {
    return (
      <div className="h-64 md:h-96 bg-slate-900 flex items-center justify-center rounded-xl">
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
      <div className="h-64 md:h-96 bg-slate-900 flex items-center justify-center rounded-xl">
        <div className="text-center text-red-400 p-6">
          <p className="text-lg font-medium">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="h-64 md:h-96 rounded-xl overflow-hidden"
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
