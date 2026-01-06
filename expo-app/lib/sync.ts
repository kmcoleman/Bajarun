/**
 * Data sync logic - Fetches from Firestore and caches to AsyncStorage.
 * Adapted from PWA version.
 */

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import {
  getData,
  setData,
  updateSyncMeta,
  shouldSync,
  STORAGE_KEYS,
} from './storage';

export interface Participant {
  odId: string;
  odFirstName: string;
  odLastName: string;
  odNickname?: string;
  odPhone?: string;
  odEmail?: string;
  odPhotoUrl?: string;
  odBike?: string;
  odEmergencyContactName?: string;
  odEmergencyContactPhone?: string;
  odSkills?: string[];
}

export interface NightConfig {
  night: number;
  // Hotel accommodation
  hotelName?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  hotelWebsite?: string;
  hotelMapsLink?: string;
  hotelDescription?: string;
  // Camping accommodation
  campingName?: string;
  campingMapsLink?: string;
  // External route file links (GPX downloads, etc.)
  routeLinks?: Array<{ name: string; url: string; type?: string }>;
  gpxFileUrl?: string;
  reverRouteUrl?: string;
}

export type EventConfig = Record<string, NightConfig>;

export interface UserSelections {
  odUserId: string;
  nights: Record<string, {
    accommodation?: string;
    dinner?: boolean;
    breakfast?: boolean;
    assignedRoom?: string;
    assignedRoommate?: string;
    prefersSingleRoom?: boolean;
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'normal';
  createdAt: number;
}

export interface DocumentInfo {
  url: string;
  fileName: string;
  uploadedAt: string | { seconds: number; nanoseconds: number };
}

export interface RiderDocuments {
  driversLicense?: DocumentInfo;
  passport?: DocumentInfo;
  fmmCard?: DocumentInfo;
  fmmPaymentReceipt?: DocumentInfo;
  mexicoInsurance?: DocumentInfo;
  americanInsurance?: DocumentInfo;
}

// Route types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface POI {
  id: string;
  name: string;
  coordinates: Coordinates;
  category: 'gas' | 'restaurant' | 'poi' | 'viewpoint' | 'photo' | 'border' | 'emergency';
  description: string;
  phone?: string;
  hours?: string;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface RouteConfig {
  // Day info
  day: number;
  date: string;
  title: string;
  description: string;
  // Route
  startCoordinates: Coordinates;
  startName: string;
  endCoordinates: Coordinates;
  endName: string;
  waypoints: Coordinates[];
  pois: POI[];
  estimatedDistance?: number;
  estimatedTime?: string;
  routeGeometry?: RouteGeometry;
  // Accommodation
  accommodation?: string;
  accommodationType?: 'hotel' | 'camping' | 'mixed';
}

// Sync all data from Firestore
export async function syncAllData(userId: string, force = false): Promise<void> {
  // Check if we should sync
  if (!force && !(await shouldSync())) {
    console.log('Skipping sync - too recent');
    return;
  }

  console.log('Starting data sync...');

  try {
    // Sync in parallel
    await Promise.all([
      syncRoster(),
      syncEventConfig(),
      syncRoutes(),
      syncUserSelections(userId),
      syncUserProfile(userId),
      syncAnnouncements(),
      syncUserDocuments(userId),
    ]);

    // Update sync timestamp
    await updateSyncMeta({ lastSyncAt: Date.now() });
    console.log('Data sync complete');
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

// Sync roster (all registrations)
async function syncRoster(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'registrations'));
    const roster: Participant[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const fullName = data.fullName || '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      roster.push({
        odId: doc.id,
        odFirstName: firstName,
        odLastName: lastName,
        odNickname: data.nickname,
        odPhone: data.phone,
        odEmail: data.email,
        odPhotoUrl: data.headshotUrl,
        odBike: data.bikeYear && data.bikeModel ? `${data.bikeYear} ${data.bikeModel}` : data.bikeModel || '',
        odEmergencyContactName: data.emergencyName,
        odEmergencyContactPhone: data.emergencyPhone,
        odSkills: data.skills,
      });
    });

    await setData(STORAGE_KEYS.ROSTER, roster);
    console.log(`Synced ${roster.length} participants`);
  } catch (error) {
    console.error('Error syncing roster:', error);
  }
}

// Sync event config (nightly info - pricing/accommodation)
async function syncEventConfig(): Promise<void> {
  try {
    const docRef = doc(db, 'eventConfig', 'pricing');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      await setData(STORAGE_KEYS.EVENT_CONFIG, data.nights || {});
      console.log('Synced event config');
    }
  } catch (error) {
    console.error('Error syncing event config:', error);
  }
}

// Sync routes from events/bajarun2026/routes (SINGLE SOURCE OF TRUTH)
async function syncRoutes(): Promise<void> {
  try {
    const routesRef = collection(db, 'events', 'bajarun2026', 'routes');
    const snapshot = await getDocs(routesRef);
    const routes: RouteConfig[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as RouteConfig;
      routes.push(data);
    });

    // Sort by day
    routes.sort((a, b) => a.day - b.day);

    await setData(STORAGE_KEYS.ROUTES, routes);
    console.log(`Synced ${routes.length} routes`);
  } catch (error) {
    console.error('Error syncing routes:', error);
  }
}

// Sync user's accommodation selections
async function syncUserSelections(userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.accommodationSelections) {
        await setData(STORAGE_KEYS.USER_SELECTIONS, {
          odUserId: userId,
          nights: data.accommodationSelections,
        });
        console.log('Synced user selections');
      }
    }
  } catch (error) {
    console.error('Error syncing user selections:', error);
  }
}

// Sync user's profile
async function syncUserProfile(userId: string): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'registrations'));
    let userProfile: Participant | null = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.uid === userId) {
        const fullName = data.fullName || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        userProfile = {
          odId: docSnap.id,
          odFirstName: firstName,
          odLastName: lastName,
          odNickname: data.nickname,
          odPhone: data.phone,
          odEmail: data.email,
          odPhotoUrl: data.headshotUrl,
          odBike: data.bikeYear && data.bikeModel ? `${data.bikeYear} ${data.bikeModel}` : data.bikeModel || '',
          odEmergencyContactName: data.emergencyName,
          odEmergencyContactPhone: data.emergencyPhone,
          odSkills: data.skills,
        };
      }
    });

    if (userProfile) {
      await setData(STORAGE_KEYS.USER_PROFILE, userProfile);
      console.log('Synced user profile');
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
  }
}

// Sync announcements
async function syncAnnouncements(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'announcements'));
    const announcements: Announcement[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        title: data.title || '',
        body: data.body || '',
        priority: data.priority || 'normal',
        createdAt: data.createdAt?.toMillis() || Date.now(),
      });
    });

    announcements.sort((a, b) => b.createdAt - a.createdAt);

    await setData(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
    console.log(`Synced ${announcements.length} announcements`);
  } catch (error) {
    console.error('Error syncing announcements:', error);
  }
}

// Sync user's rider documents metadata from registrations collection
async function syncUserDocuments(userId: string): Promise<void> {
  try {
    // Find user's registration by uid
    const registrationsRef = collection(db, 'registrations');
    const q = query(registrationsRef, where('uid', '==', userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      if (data.riderDocuments) {
        await setData(STORAGE_KEYS.RIDER_DOCUMENTS, data.riderDocuments);
        console.log('Synced rider documents metadata');
      }
    }
  } catch (error) {
    console.error('Error syncing rider documents:', error);
  }
}

// Get cached roster
export async function getCachedRoster(): Promise<Participant[]> {
  return (await getData<Participant[]>(STORAGE_KEYS.ROSTER)) || [];
}

// Get cached event config
export async function getCachedEventConfig(): Promise<EventConfig | null> {
  return (await getData<EventConfig>(STORAGE_KEYS.EVENT_CONFIG)) || null;
}

// Get cached routes
export async function getCachedRoutes(): Promise<RouteConfig[]> {
  return (await getData<RouteConfig[]>(STORAGE_KEYS.ROUTES)) || [];
}

// Get cached user selections
export async function getCachedUserSelections(): Promise<UserSelections | null> {
  return (await getData<UserSelections>(STORAGE_KEYS.USER_SELECTIONS)) || null;
}

// Get cached user profile
export async function getCachedUserProfile(): Promise<Participant | null> {
  return (await getData<Participant>(STORAGE_KEYS.USER_PROFILE)) || null;
}

// Get cached announcements
export async function getCachedAnnouncements(): Promise<Announcement[]> {
  return (await getData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS)) || [];
}

// Get cached rider documents metadata
export async function getCachedRiderDocuments(): Promise<RiderDocuments | null> {
  return (await getData<RiderDocuments>(STORAGE_KEYS.RIDER_DOCUMENTS)) || null;
}
