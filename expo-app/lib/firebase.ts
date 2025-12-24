/**
 * Firebase configuration for Baja Tour Native App.
 * Shares the same Firebase project as the main webapp and PWA.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAQz1vuHv_dvf30dsWYY8Ox0-5QLtrK26I",
  authDomain: "bajarun-2026.firebaseapp.com",
  projectId: "bajarun-2026",
  storageBucket: "bajarun-2026.firebasestorage.app",
  messagingSenderId: "73531449020",
  appId: "1:73531449020:web:981ec8300eb4fbfa077ab9"
};

// Initialize Firebase (handle hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with AsyncStorage persistence (handle hot reload)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  // Auth already initialized, get existing instance
  auth = getAuth(app);
}
export { auth };
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

export default app;
