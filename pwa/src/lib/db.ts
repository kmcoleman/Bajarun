/**
 * IndexedDB wrapper using idb-keyval for offline data storage.
 */

import { get, set, del, keys, clear } from 'idb-keyval';

// Storage keys
export const STORAGE_KEYS = {
  ROSTER: 'roster',
  EVENT_CONFIG: 'eventConfig',
  USER_SELECTIONS: 'userSelections',
  USER_PROFILE: 'userProfile',
  ANNOUNCEMENTS: 'announcements',
  DOCUMENTS: 'documents',
  RIDER_DOCUMENTS: 'riderDocuments',
  META: 'meta',
} as const;

// Meta data for sync tracking
export interface SyncMeta {
  lastSyncAt: number;
  fcmToken?: string;
  userId?: string;
}

// Get data from IndexedDB
export async function getData<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch (error) {
    console.error(`Error getting ${key} from IndexedDB:`, error);
    return undefined;
  }
}

// Set data in IndexedDB
export async function setData<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in IndexedDB:`, error);
    throw error;
  }
}

// Delete data from IndexedDB
export async function deleteData(key: string): Promise<void> {
  try {
    await del(key);
  } catch (error) {
    console.error(`Error deleting ${key} from IndexedDB:`, error);
    throw error;
  }
}

// Get all stored keys
export async function getAllKeys(): Promise<IDBValidKey[]> {
  try {
    return await keys();
  } catch (error) {
    console.error('Error getting keys from IndexedDB:', error);
    return [];
  }
}

// Clear all data (for logout)
export async function clearAllData(): Promise<void> {
  try {
    await clear();
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
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

// Store a document blob
export async function storeDocument(docId: string, blob: Blob): Promise<void> {
  const docs = await getData<Record<string, Blob>>(STORAGE_KEYS.DOCUMENTS) || {};
  docs[docId] = blob;
  await setData(STORAGE_KEYS.DOCUMENTS, docs);
}

// Get a stored document
export async function getDocument(docId: string): Promise<Blob | undefined> {
  const docs = await getData<Record<string, Blob>>(STORAGE_KEYS.DOCUMENTS);
  return docs?.[docId];
}
