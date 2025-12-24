/**
 * Document caching for offline access.
 * Downloads documents from Firebase Storage to local file system.
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

const DOCS_DIR = FileSystem.documentDirectory + 'rider_documents/';
const CACHE_META_KEY = 'cached_documents_meta';

interface CachedDocMeta {
  localPath: string;
  remoteUrl: string;
  fileName: string;
  cachedAt: number;
}

interface CacheMetaStore {
  [docType: string]: CachedDocMeta;
}

/**
 * Ensure the documents directory exists
 */
async function ensureDocsDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

/**
 * Get cached documents metadata
 */
async function getCacheMeta(): Promise<CacheMetaStore> {
  try {
    const meta = await AsyncStorage.getItem(CACHE_META_KEY);
    return meta ? JSON.parse(meta) : {};
  } catch {
    return {};
  }
}

/**
 * Save cached documents metadata
 */
async function saveCacheMeta(meta: CacheMetaStore): Promise<void> {
  await AsyncStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
}

/**
 * Get file extension from URL or content-type
 */
function getFileExtension(url: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split('.').pop();
    if (ext) return ext.toLowerCase();
  }

  // Try to extract from URL
  const urlPath = url.split('?')[0];
  const ext = urlPath.split('.').pop();
  if (ext && ext.length <= 4) return ext.toLowerCase();

  // Default to pdf
  return 'pdf';
}

/**
 * Download a document and cache it locally
 */
export async function cacheDocument(
  docType: string,
  remoteUrl: string,
  fileName?: string
): Promise<string | null> {
  try {
    await ensureDocsDir();

    const ext = getFileExtension(remoteUrl, fileName);
    const localFileName = `${docType}.${ext}`;
    const localPath = DOCS_DIR + localFileName;

    // Download the file
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localPath);

    if (downloadResult.status !== 200) {
      console.error('Failed to download document:', downloadResult.status);
      return null;
    }

    // Save metadata
    const meta = await getCacheMeta();
    meta[docType] = {
      localPath,
      remoteUrl,
      fileName: fileName || localFileName,
      cachedAt: Date.now(),
    };
    await saveCacheMeta(meta);

    console.log('Document cached:', docType, localPath);
    return localPath;
  } catch (error) {
    console.error('Error caching document:', error);
    return null;
  }
}

/**
 * Get cached document path if it exists
 */
export async function getCachedDocument(docType: string): Promise<string | null> {
  try {
    const meta = await getCacheMeta();
    const docMeta = meta[docType];

    if (!docMeta) return null;

    // Check if file still exists
    const fileInfo = await FileSystem.getInfoAsync(docMeta.localPath);
    if (!fileInfo.exists) {
      // File was deleted, remove from meta
      delete meta[docType];
      await saveCacheMeta(meta);
      return null;
    }

    return docMeta.localPath;
  } catch {
    return null;
  }
}

/**
 * Check if a document is cached and if it matches the remote URL
 */
export async function isDocumentCached(docType: string, remoteUrl: string): Promise<boolean> {
  try {
    const meta = await getCacheMeta();
    const docMeta = meta[docType];

    if (!docMeta || docMeta.remoteUrl !== remoteUrl) return false;

    const fileInfo = await FileSystem.getInfoAsync(docMeta.localPath);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * Open a document (from cache or download first)
 */
export async function openDocument(
  docType: string,
  remoteUrl: string,
  fileName?: string
): Promise<boolean> {
  try {
    // Try to use sharing if available
    let Sharing: typeof import('expo-sharing') | null = null;
    try {
      Sharing = require('expo-sharing');
    } catch {
      // expo-sharing not available
    }

    if (Sharing) {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        // Check if already cached
        let localPath = await getCachedDocument(docType);
        const meta = await getCacheMeta();

        // If not cached or URL changed, download it
        if (!localPath || meta[docType]?.remoteUrl !== remoteUrl) {
          localPath = await cacheDocument(docType, remoteUrl, fileName);
        }

        if (localPath) {
          await Sharing.shareAsync(localPath, {
            mimeType: getMimeType(localPath),
            dialogTitle: fileName || docType,
          });
          return true;
        }
      }
    }

    // Fallback: open remote URL in browser
    // Still cache in background for offline access
    cacheDocument(docType, remoteUrl, fileName).catch(console.error);

    const canOpen = await Linking.canOpenURL(remoteUrl);
    if (canOpen) {
      await Linking.openURL(remoteUrl);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error opening document:', error);
    // Last resort: try opening URL directly
    try {
      await Linking.openURL(remoteUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Cache all documents from rider documents object
 */
export async function cacheAllDocuments(
  riderDocuments: Record<string, { url?: string; fileName?: string } | undefined>
): Promise<void> {
  const promises = Object.entries(riderDocuments).map(async ([docType, doc]) => {
    if (doc?.url) {
      const isCached = await isDocumentCached(docType, doc.url);
      if (!isCached) {
        await cacheDocument(docType, doc.url, doc.fileName);
      }
    }
  });

  await Promise.all(promises);
}

/**
 * Clear all cached documents
 */
export async function clearDocumentCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOCS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(DOCS_DIR, { idempotent: true });
    }
    await AsyncStorage.removeItem(CACHE_META_KEY);
  } catch (error) {
    console.error('Error clearing document cache:', error);
  }
}

/**
 * Get MIME type from file path
 */
function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Get cache status for all documents
 */
export async function getDocumentCacheStatus(): Promise<Record<string, boolean>> {
  const meta = await getCacheMeta();
  const status: Record<string, boolean> = {};

  for (const [docType, docMeta] of Object.entries(meta)) {
    const fileInfo = await FileSystem.getInfoAsync(docMeta.localPath);
    status[docType] = fileInfo.exists;
  }

  return status;
}
