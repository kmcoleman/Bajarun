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
 * Route configuration for a single day
 */
export interface RouteConfig {
  // Start location
  startCoordinates: Coordinates;
  startName: string;

  // End location
  endCoordinates: Coordinates;
  endName: string;

  // Routing waypoints (intermediate points for Mapbox Directions API)
  waypoints: Coordinates[];

  // Points of Interest along route
  pois: POI[];

  // Optional metadata
  estimatedDistance?: number; // Miles
  estimatedTime?: string;     // "6 hours"
}

/**
 * Empty defaults for initialization
 */
export const emptyRouteConfig: RouteConfig = {
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
