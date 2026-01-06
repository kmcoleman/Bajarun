/**
 * routeConfig.ts
 *
 * Types for route configuration and Points of Interest (POIs).
 * Used by admin to configure daily routes via NightlyConfigPage.
 */

/**
 * POI Categories
 */
export type POICategory =
  | 'gas'        // Gas stations
  | 'restaurant' // Restaurants/food stops
  | 'poi'        // General points of interest
  | 'viewpoint'  // Scenic viewpoints
  | 'photo'      // Photo opportunities
  | 'border'     // Border crossings
  | 'emergency'; // Hospitals, mechanics

/**
 * Coordinate object (Firestore doesn't support nested arrays)
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Individual Point of Interest
 */
export interface POI {
  id: string;
  name: string;
  coordinates: Coordinates;
  category: POICategory;
  description: string;
  phone?: string;
  hours?: string;
}

/**
 * GeoJSON LineString geometry for pre-calculated route
 * Note: Firestore stores coordinates as objects {lng, lat} since nested arrays aren't supported
 * The useRoutes hook converts them back to [lng, lat] arrays for map rendering
 */
export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] pairs (GeoJSON format) - converted from Firestore objects
}

/**
 * How coordinates are stored in Firestore (objects instead of nested arrays)
 */
export interface FirestoreCoordinate {
  lng: number;
  lat: number;
}

/**
 * Route configuration for a single day
 * This is THE single source of truth for route data.
 * Stored in: events/bajarun2026/routes/day{N}
 */
export interface RouteConfig {
  // Day information
  day: number;
  date: string;                    // "March 20, 2026"
  title: string;                   // "Temecula to Rancho Meling"
  description: string;             // Day description (legacy, use rideSummary)
  rideSummary?: string;            // Short ride summary for itinerary display

  // Start location
  startCoordinates: Coordinates;
  startName: string;

  // End location
  endCoordinates: Coordinates;
  endName: string;

  // Routing waypoints (intermediate points)
  waypoints: Coordinates[];

  // Points of Interest along route
  pois: POI[];

  // Route metrics
  estimatedDistance?: number;      // Miles
  estimatedTime?: string;          // "6h 22m"

  // Pre-calculated route geometry (eliminates API calls)
  routeGeometry?: RouteGeometry;

  // Accommodation summary (not pricing, just text)
  accommodation?: string;          // "Shared Room or Camping"
  accommodationType?: 'hotel' | 'camping' | 'mixed';
}

/**
 * Empty defaults for initialization
 */
export const emptyRouteConfig: RouteConfig = {
  day: 0,
  date: '',
  title: '',
  description: '',
  startCoordinates: { lat: 0, lng: 0 },
  startName: '',
  endCoordinates: { lat: 0, lng: 0 },
  endName: '',
  waypoints: [],
  pois: [],
};

/**
 * POI category configuration for UI
 */
export const POI_CATEGORIES: {
  value: POICategory;
  label: string;
  icon: string;  // Lucide icon name
  color: string; // Tailwind color class
  bgColor: string; // Background color for markers
}[] = [
  { value: 'gas', label: 'Gas Station', icon: 'Fuel', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
  { value: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed', color: 'text-orange-400', bgColor: 'bg-orange-500' },
  { value: 'poi', label: 'Point of Interest', icon: 'MapPin', color: 'text-blue-400', bgColor: 'bg-blue-500' },
  { value: 'viewpoint', label: 'Scenic Viewpoint', icon: 'Mountain', color: 'text-green-400', bgColor: 'bg-green-500' },
  { value: 'photo', label: 'Photo Op', icon: 'Camera', color: 'text-purple-400', bgColor: 'bg-purple-500' },
  { value: 'border', label: 'Border Crossing', icon: 'Flag', color: 'text-red-400', bgColor: 'bg-red-500' },
  { value: 'emergency', label: 'Emergency', icon: 'Cross', color: 'text-red-600', bgColor: 'bg-red-600' },
];

/**
 * Get category config by value
 */
export function getPOICategoryConfig(category: POICategory) {
  return POI_CATEGORIES.find(c => c.value === category) || POI_CATEGORIES[2]; // Default to 'poi'
}
