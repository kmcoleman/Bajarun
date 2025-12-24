/**
 * Document caching for offline viewing.
 * Downloads documents from Firebase Storage and caches them in IndexedDB.
 */

import { get, set, del, keys } from 'idb-keyval';
import { ref, getBlob } from 'firebase/storage';
import { storage } from './firebase';

// Document types that can be cached
export type DocumentType =
  | 'driversLicense'
  | 'passport'
  | 'fmmCard'
  | 'fmmPaymentReceipt'
  | 'mexicoInsurance'
  | 'americanInsurance';

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

export interface CachedDocument {
  type: DocumentType;
  fileName: string;
  mimeType: string;
  blob: Blob;
  cachedAt: number;
}

// Document display config
export const documentConfig: Record<DocumentType, { label: string; emoji: string }> = {
  driversLicense: { label: "Driver's License", emoji: '🪪' },
  passport: { label: 'Passport', emoji: '📘' },
  fmmCard: { label: 'FMM Card', emoji: '📄' },
  fmmPaymentReceipt: { label: 'FMM Receipt', emoji: '🧾' },
  mexicoInsurance: { label: 'Mexico Insurance', emoji: '🛡️' },
  americanInsurance: { label: 'US Insurance', emoji: '🚗' },
};

// IndexedDB key prefix for cached documents
const CACHE_KEY_PREFIX = 'doc_cache_';

/**
 * Get the cache key for a document
 */
function getCacheKey(docType: DocumentType): string {
  return `${CACHE_KEY_PREFIX}${docType}`;
}

/**
 * Check if a document is cached
 */
export async function isDocumentCached(docType: DocumentType): Promise<boolean> {
  const key = getCacheKey(docType);
  const cached = await get<CachedDocument>(key);
  return !!cached;
}

/**
 * Get all cached document types
 */
export async function getCachedDocumentTypes(): Promise<DocumentType[]> {
  const allKeys = await keys();
  const docKeys = allKeys.filter(k =>
    typeof k === 'string' && k.startsWith(CACHE_KEY_PREFIX)
  ) as string[];
  return docKeys.map(k => k.replace(CACHE_KEY_PREFIX, '') as DocumentType);
}

/**
 * Extract storage path from Firebase Storage URL
 */
function extractStoragePath(url: string): string | null {
  try {
    // Firebase Storage URLs look like:
    // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?token=...
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Download and cache a document
 */
export async function cacheDocument(
  docType: DocumentType,
  docInfo: DocumentInfo,
  onProgress?: (progress: number) => void
): Promise<void> {
  console.log(`Caching document: ${docType}`, docInfo.url);

  try {
    let blob: Blob;
    let mimeType = 'application/octet-stream';

    // Try to extract storage path and use Firebase SDK
    const storagePath = extractStoragePath(docInfo.url);

    if (storagePath) {
      console.log(`Using Firebase Storage SDK for path: ${storagePath}`);
      const storageRef = ref(storage, storagePath);
      blob = await getBlob(storageRef);
      mimeType = blob.type || mimeType;
    } else {
      // Fallback to direct fetch for non-Firebase URLs
      console.log(`Using direct fetch for URL`);
      const response = await fetch(docInfo.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      blob = await response.blob();
      mimeType = response.headers.get('content-type') || mimeType;
    }

    // Store in IndexedDB
    const cached: CachedDocument = {
      type: docType,
      fileName: docInfo.fileName,
      mimeType,
      blob,
      cachedAt: Date.now(),
    };

    await set(getCacheKey(docType), cached);
    console.log(`Document cached: ${docType} (${(blob.size / 1024).toFixed(1)} KB)`);

    if (onProgress) onProgress(100);
  } catch (error) {
    console.error(`Error caching document ${docType}:`, error);
    throw error;
  }
}

/**
 * Get a cached document
 */
export async function getCachedDocument(docType: DocumentType): Promise<CachedDocument | null> {
  const key = getCacheKey(docType);
  return await get<CachedDocument>(key) || null;
}

/**
 * Remove a cached document
 */
export async function removeCachedDocument(docType: DocumentType): Promise<void> {
  const key = getCacheKey(docType);
  await del(key);
  console.log(`Document removed from cache: ${docType}`);
}

/**
 * Clear all cached documents
 */
export async function clearAllCachedDocuments(): Promise<void> {
  const cachedTypes = await getCachedDocumentTypes();
  for (const docType of cachedTypes) {
    await removeCachedDocument(docType);
  }
  console.log('All documents cleared from cache');
}

/**
 * Open a cached document for viewing
 */
export function viewCachedDocument(cached: CachedDocument): void {
  const url = URL.createObjectURL(cached.blob);
  window.open(url, '_blank');
  // Clean up the object URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Get total size of cached documents
 */
export async function getCachedDocumentsSize(): Promise<number> {
  const cachedTypes = await getCachedDocumentTypes();
  let totalSize = 0;

  for (const docType of cachedTypes) {
    const cached = await getCachedDocument(docType);
    if (cached) {
      totalSize += cached.blob.size;
    }
  }

  return totalSize;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
