/**
 * AsyncStorage wrapper for offline data storage.
 * Replaces IndexedDB (idb-keyval) from the PWA.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  ROSTER: 'roster',
  EVENT_CONFIG: 'eventConfig',
  USER_SELECTIONS: 'userSelections',
  USER_PROFILE: 'userProfile',
  ANNOUNCEMENTS: 'announcements',
  RIDER_DOCUMENTS: 'riderDocuments',
  META: 'meta',
} as const;

// Meta data for sync tracking
export interface SyncMeta {
  lastSyncAt: number;
  pushToken?: string;
  userId?: string;
}

// Get data from AsyncStorage
export async function getData<T>(key: string): Promise<T | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return undefined;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error getting ${key} from AsyncStorage:`, error);
    return undefined;
  }
}

// Set data in AsyncStorage
export async function setData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} in AsyncStorage:`, error);
    throw error;
  }
}

// Delete data from AsyncStorage
export async function deleteData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting ${key} from AsyncStorage:`, error);
    throw error;
  }
}

// Get all stored keys
export async function getAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting keys from AsyncStorage:', error);
    return [];
  }
}

// Clear all data (for logout)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
    throw error;
  }
}

// Get sync metadata
export async function getSyncMeta(): Promise<SyncMeta | undefined> {
  return getData<SyncMeta>(STORAGE_KEYS.META);
}

// Update sync metadata
export async function updateSyncMeta(updates: Partial<SyncMeta>): Promise<void> {
  const current = await getSyncMeta();
  await setData(STORAGE_KEYS.META, {
    ...current,
    ...updates,
  });
}

// Check if we need to sync (more than 5 minutes since last sync)
export async function shouldSync(): Promise<boolean> {
  const meta = await getSyncMeta();
  if (!meta?.lastSyncAt) return true;

  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - meta.lastSyncAt > fiveMinutes;
}
