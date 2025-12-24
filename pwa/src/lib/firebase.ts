/**
 * Firebase configuration for Baja Tour PWA.
 * Shares the same Firebase project as the main webapp.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAQz1vuHv_dvf30dsWYY8Ox0-5QLtrK26I",
  authDomain: "bajarun-2026.firebaseapp.com",
  projectId: "bajarun-2026",
  storageBucket: "bajarun-2026.firebasestorage.app",
  messagingSenderId: "73531449020",
  appId: "1:73531449020:web:981ec8300eb4fbfa077ab9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

// Messaging (FCM) - only if supported
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
