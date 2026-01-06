/**
 * RouteMapView - Interactive map showing the day's route
 * Uses react-native-maps to display start/end points and POIs
 */

import { useEffect, useRef, useState, Component, ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Mapbox token for Directions API
const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2V2Y29sZW1hbiIsImEiOiJjbWl3cjcyaWUyYWh4M2xvZzN4ZDB2bTc3In0.EFtRNL8zM_JW78wkpAF8tQ';

// Error boundary for map component
class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.log('Map error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// POI category colors (matching webapp)
const POI_COLORS: Record<string, string> = {
  gas: '#facc15',
  restaurant: '#fb923c',
  poi: '#3b82f6',
  viewpoint: '#22c55e',
  photo: '#a855f7',
  border: '#ef4444',
  emergency: '#dc2626',
};

// POI category icons (FontAwesome names)
const POI_ICONS: Record<string, string> = {
  gas: 'tint',
  restaurant: 'cutlery',
  poi: 'map-marker',
  viewpoint: 'mountain',
  photo: 'camera',
  border: 'flag',
  emergency: 'plus-square',
};

interface POI {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  category: string;
  description?: string;
}

interface RouteMapViewProps {
  startCoordinates: [number, number]; // [lat, lng]
  endCoordinates: [number, number]; // [lat, lng]
  startName: string;
  endName: string;
  dayNumber: number;
  waypoints?: [number, number][]; // Optional intermediate waypoints
}

function MapFallback({ theme }: { theme: any }) {
  return (
    <View style={[styles.container, styles.fallback, { borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
      <FontAwesome name="map" size={32} color={theme.textMuted} />
      <Text style={[styles.fallbackText, { color: theme.textMuted }]}>
        Map unavailable
      </Text>
    </View>
  );
}

// Fetch driving route from Mapbox Directions API
async function fetchDrivingRoute(coordinates: [number, number][]): Promise<{ latitude: number; longitude: number }[]> {
  if (coordinates.length < 2) return [];

  try {
    // Convert [lat, lng] to "lng,lat" format for Mapbox
    const coordString = coordinates.map(c => `${c[1]},${c[0]}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes[0]) {
      // Mapbox returns [lng, lat], convert to { latitude, longitude }
      return data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
    }
  } catch (error) {
    console.log('Error fetching driving route:', error);
  }

  return [];
}

function RouteMapViewInner({
  startCoordinates,
  endCoordinates,
  startName,
  endName,
  dayNumber,
  waypoints,
}: RouteMapViewProps) {
  const { theme, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // Calculate initial region to fit both points
  const getRegion = (): Region => {
    const latDelta = Math.abs(startCoordinates[0] - endCoordinates[0]);
    const lngDelta = Math.abs(startCoordinates[1] - endCoordinates[1]);

    // Add padding and ensure minimum zoom
    const padding = 0.5;
    const minDelta = 0.1;

    return {
      latitude: (startCoordinates[0] + endCoordinates[0]) / 2,
      longitude: (startCoordinates[1] + endCoordinates[1]) / 2,
      latitudeDelta: Math.max(latDelta * 1.5 + padding, minDelta),
      longitudeDelta: Math.max(lngDelta * 1.5 + padding, minDelta),
    };
  };

  // State for stored geometry
  const [storedGeometry, setStoredGeometry] = useState<{ latitude: number; longitude: number }[] | null>(null);

  // Load POIs and route geometry from Firestore for this day
  useEffect(() => {
    async function loadRouteData() {
      try {
        const routeDoc = await getDoc(doc(db, 'events', 'bajarun2026', 'routes', `day${dayNumber}`));
        if (routeDoc.exists()) {
          const data = routeDoc.data();
          // Load POIs
          if (data.pois && Array.isArray(data.pois)) {
            setPois(data.pois.filter((poi: POI) => poi.coordinates?.lat && poi.coordinates?.lng));
          }
          // Load stored route geometry if available
          if (data.routeGeometry?.coordinates && Array.isArray(data.routeGeometry.coordinates)) {
            // Convert GeoJSON [lng, lat] to { latitude, longitude }
            // Filter out any invalid coordinates
            const geometry = data.routeGeometry.coordinates
              .filter((coord: any) =>
                Array.isArray(coord) &&
                coord.length >= 2 &&
                typeof coord[0] === 'number' &&
                typeof coord[1] === 'number' &&
                !isNaN(coord[0]) &&
                !isNaN(coord[1])
              )
              .map((coord: [number, number]) => ({
                latitude: coord[1],
                longitude: coord[0],
              }));
            if (geometry.length > 0) {
              setStoredGeometry(geometry);
              console.log('Using stored route geometry:', geometry.length, 'points');
            }
          }
        }
      } catch (error) {
        console.log('Error loading route data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRouteData();
  }, [dayNumber]);

  // Fetch driving route when coordinates change (or use stored geometry)
  useEffect(() => {
    async function loadRoute() {
      // Skip if same location (rest day)
      if (
        startCoordinates[0] === endCoordinates[0] &&
        startCoordinates[1] === endCoordinates[1]
      ) {
        setRouteCoordinates([]);
        return;
      }

      // Use stored geometry if available (instant, no API call)
      if (storedGeometry && storedGeometry.length > 0) {
        setRouteCoordinates(storedGeometry);
        return;
      }

      // Fallback: fetch from Mapbox API
      setRouteLoading(true);

      // Build waypoints array: start -> waypoints -> end
      const allWaypoints: [number, number][] = [
        startCoordinates,
        ...(waypoints || []),
        endCoordinates,
      ];

      const route = await fetchDrivingRoute(allWaypoints);

      if (route.length > 0) {
        setRouteCoordinates(route);
      } else {
        // Fallback to straight line if API fails
        setRouteCoordinates([
          { latitude: startCoordinates[0], longitude: startCoordinates[1] },
          ...(waypoints?.map(wp => ({ latitude: wp[0], longitude: wp[1] })) || []),
          { latitude: endCoordinates[0], longitude: endCoordinates[1] },
        ]);
      }

      setRouteLoading(false);
    }

    loadRoute();
  }, [startCoordinates, endCoordinates, waypoints, storedGeometry]);

  // Animate to region when day changes
  useEffect(() => {
    if (mapRef.current) {
      const region = getRegion();
      mapRef.current.animateToRegion(region, 500);
    }
  }, [startCoordinates, endCoordinates]);

  // Check if start and end are the same (rest day or arrival day)
  const isSameLocation =
    startCoordinates[0] === endCoordinates[0] &&
    startCoordinates[1] === endCoordinates[1];

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getRegion()}
        mapType={isDark ? 'mutedStandard' : 'standard'}
        showsUserLocation={false}
        showsCompass={true}
        showsScale={true}
        pitchEnabled={false}
        rotateEnabled={false}
        onMapReady={() => setLoading(false)}
      >
        {/* Route polyline (only if we have valid coordinates) */}
        {routeCoordinates.length > 1 &&
          routeCoordinates.every(c => typeof c.latitude === 'number' && typeof c.longitude === 'number') && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.accent}
            strokeWidth={4}
          />
        )}

        {/* Start marker */}
        <Marker
          coordinate={{
            latitude: startCoordinates[0],
            longitude: startCoordinates[1],
          }}
          title={isSameLocation ? endName : `Start: ${startName}`}
          description={isSameLocation ? `Day ${dayNumber}` : 'Starting point'}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={[styles.markerContainer, { backgroundColor: '#22c55e' }]}>
            <FontAwesome name="flag" size={14} color="#ffffff" />
          </View>
        </Marker>

        {/* End marker (only if different from start) */}
        {!isSameLocation && (
          <Marker
            coordinate={{
              latitude: endCoordinates[0],
              longitude: endCoordinates[1],
            }}
            title={`End: ${endName}`}
            description="Destination"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[styles.markerContainer, { backgroundColor: '#ef4444' }]}>
              <FontAwesome name="flag-checkered" size={14} color="#ffffff" />
            </View>
          </Marker>
        )}

        {/* POI markers */}
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={{
              latitude: poi.coordinates.lat,
              longitude: poi.coordinates.lng,
            }}
            title={poi.name}
            description={poi.description}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.poiMarker,
                { backgroundColor: POI_COLORS[poi.category] || POI_COLORS.poi },
              ]}
            >
              <FontAwesome
                name={(POI_ICONS[poi.category] || 'map-marker') as any}
                size={10}
                color="#ffffff"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading overlay */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.card }]}>
          <ActivityIndicator color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Loading map...
          </Text>
        </View>
      )}

      {/* Route loading indicator */}
      {routeLoading && !loading && (
        <View style={[styles.routeLoadingBadge, { backgroundColor: theme.card + 'E6' }]}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.routeLoadingText, { color: theme.textMuted }]}>
            Loading route...
          </Text>
        </View>
      )}

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: theme.card + 'E6' }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Start</Text>
        </View>
        {!isSameLocation && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>End</Text>
          </View>
        )}
        {pois.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>POI</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Wrapper component with error boundary
export default function RouteMapView(props: RouteMapViewProps) {
  const { theme } = useTheme();

  return (
    <MapErrorBoundary fallback={<MapFallback theme={theme} />}>
      <RouteMapViewInner {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: spacing.md,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  poiMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  routeLoadingBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  routeLoadingText: {
    fontSize: 12,
  },
  legend: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
});
