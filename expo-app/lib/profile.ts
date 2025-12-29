/**
 * Profile update and document upload functions.
 */

import { collection, doc, updateDoc, getDocs, query, where, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from './firebase';
import { setData, STORAGE_KEYS } from './storage';

export interface ProfileUpdateData {
  phone?: string;
  email?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

export interface DocumentUploadResult {
  url: string;
  fileName: string;
  uploadedAt: string;
}

/**
 * Find the user's registration document ID by their Firebase UID.
 */
export async function findRegistrationDocId(userId: string): Promise<string | null> {
  try {
    const registrationsRef = collection(db, 'registrations');
    const q = query(registrationsRef, where('uid', '==', userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding registration:', error);
    return null;
  }
}

/**
 * Update user profile fields in the registrations collection.
 */
export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<boolean> {
  try {
    const registrationId = await findRegistrationDocId(userId);
    if (!registrationId) {
      console.error('No registration found for user');
      return false;
    }

    const docRef = doc(db, 'registrations', registrationId);
    await updateDoc(docRef, updates);

    console.log('Profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

/**
 * Pick a document file (PDF, image, etc.)
 */
export async function pickDocument(): Promise<{ uri: string; name: string; mimeType: string } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
}

/**
 * Pick an image from the library or camera.
 */
export async function pickImage(useCamera = false): Promise<{ uri: string; name: string; mimeType: string } | null> {
  try {
    // Request permissions
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() || 'image.jpg';

    return {
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
}

/**
 * Upload a document to Firebase Storage and update the user's document metadata.
 */
export async function uploadDocument(
  userId: string,
  documentType: string,
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<DocumentUploadResult | null> {
  try {
    const registrationId = await findRegistrationDocId(userId);
    if (!registrationId) {
      console.error('No registration found for user');
      return null;
    }

    // Create a reference for the file
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'pdf';
    const storagePath = `riderDocuments/${userId}/${documentType}_${timestamp}.${extension}`;
    const storageRef = ref(storage, storagePath);

    // Fetch the file and convert to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob, { contentType: mimeType });

    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // Update user's document metadata in registrations collection
    const docRef = doc(db, 'registrations', registrationId);
    const uploadedAt = new Date().toISOString();

    await updateDoc(docRef, {
      [`riderDocuments.${documentType}`]: {
        url: downloadUrl,
        fileName: fileName,
        uploadedAt: uploadedAt,
      },
    });

    const result: DocumentUploadResult = {
      url: downloadUrl,
      fileName: fileName,
      uploadedAt: uploadedAt,
    };

    console.log(`Document ${documentType} uploaded successfully`);
    return result;
  } catch (error) {
    console.error('Error uploading document:', error);
    return null;
  }
}

/**
 * Upload a profile photo.
 */
export async function uploadProfilePhoto(
  userId: string,
  fileUri: string,
  fileName: string
): Promise<string | null> {
  try {
    const registrationId = await findRegistrationDocId(userId);
    if (!registrationId) {
      console.error('No registration found for user');
      return null;
    }

    // Create a reference for the file
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'jpg';
    const storagePath = `headshots/${registrationId}_${timestamp}.${extension}`;
    const storageRef = ref(storage, storagePath);

    // Fetch the file and convert to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // Update the registration document
    const docRef = doc(db, 'registrations', registrationId);
    await updateDoc(docRef, { headshotUrl: downloadUrl });

    console.log('Profile photo uploaded successfully');
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return null;
  }
}

/**
 * Delete a document from Firebase Storage and remove metadata from Firestore.
 */
export async function deleteDocument(
  userId: string,
  documentType: string,
  documentUrl: string
): Promise<boolean> {
  try {
    const registrationId = await findRegistrationDocId(userId);
    if (!registrationId) {
      console.error('No registration found for user');
      return false;
    }

    // Try to delete from storage (may fail if URL format changed)
    try {
      const storageRef = ref(storage, documentUrl);
      await deleteObject(storageRef);
    } catch (storageError) {
      // Storage delete may fail if the file was already deleted or URL format is different
      console.warn('Could not delete from storage:', storageError);
    }

    // Remove document metadata from Firestore
    const docRef = doc(db, 'registrations', registrationId);
    await updateDoc(docRef, {
      [`riderDocuments.${documentType}`]: deleteField(),
    });

    console.log(`Document ${documentType} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}
