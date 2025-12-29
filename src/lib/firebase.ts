/**
 * firebase.ts
 *
 * Firebase configuration for Baja Tour website.
 * Handles authentication and Firestore database.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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

// Functions
export const functions = getFunctions(app);

// Connect to emulators in development mode when flag is set
console.log('DEV mode:', import.meta.env.DEV);
console.log('VITE_USE_EMULATORS:', import.meta.env.VITE_USE_EMULATORS);

if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Connected to Firebase Emulators');
}

export default app;
