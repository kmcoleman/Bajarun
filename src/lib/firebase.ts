/**
 * firebase.ts
 *
 * Firebase configuration for Baja Tour website.
 * Handles authentication and Firestore database.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQqbWD18gGQzUys2ABHaRl3d7tBXak31k",
  authDomain: "baja-tour-2026.firebaseapp.com",
  projectId: "baja-tour-2026",
  storageBucket: "baja-tour-2026.firebasestorage.app",
  messagingSenderId: "175968947390",
  appId: "1:175968947390:web:77a3d189985d61b807a2ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

export default app;
