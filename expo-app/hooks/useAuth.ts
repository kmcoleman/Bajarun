/**
 * Authentication hook for Firebase Auth with Expo.
 * Uses expo-auth-session for Google Sign-In.
 * Uses expo-apple-authentication for Apple Sign-In.
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  User,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Terms config from Firestore
export interface TermsConfig {
  privacyVersion: string;
  termsVersion: string;
  privacyUrl: string;
  termsUrl: string;
}

// Terms acceptance type
export interface TermsAcceptance {
  acceptedAt: any;
  privacyVersion: string;
  termsVersion: string;
}
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth, db } from '../lib/firebase';
import { clearAllData, updateSyncMeta } from '../lib/storage';
import { registerForPushNotifications } from '../lib/notifications';

// Registration document type
export interface Registration {
  id: string;
  uid: string;
  tourId?: string;
  email: string;
  fullName: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bikeType?: string;
  experienceLevel?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Required for expo-auth-session
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAppleAvailable: boolean;
  registration: Registration | null;
  registrationLoading: boolean;
  termsAccepted: boolean;
  termsLoading: boolean;
  termsConfig: TermsConfig | null;
  userTermsData: TermsAcceptance | null; // Raw data from user doc for re-evaluation
}

// Google OAuth client IDs from Google Cloud Console
const GOOGLE_IOS_CLIENT_ID = '73531449020-55bab060gne2c4iqf3u5m77rvde2h6qh.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = ''; // Add Android client ID when ready
const GOOGLE_WEB_CLIENT_ID = '73531449020-0kmmgg6jg0pmun1ip5rcqul1d9s90h6e.apps.googleusercontent.com';
// For Expo Go, we use the proxy which requires a web client ID
const EXPO_CLIENT_ID = '73531449020-0kmmgg6jg0pmun1ip5rcqul1d9s90h6e.apps.googleusercontent.com';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAppleAvailable: false,
    registration: null,
    registrationLoading: true,
    termsAccepted: false,
    termsLoading: true,
    termsConfig: null,
    userTermsData: null,
  });

  // Check if Apple Sign-In is available (iOS 13+ only)
  useEffect(() => {
    const checkAppleAvailability = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setState(prev => ({ ...prev, isAppleAvailable: isAvailable }));
      }
    };
    checkAppleAvailability();
  }, []);

  // Fetch terms config from Firestore on mount
  useEffect(() => {
    const fetchTermsConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'terms'));
        if (configDoc.exists()) {
          setState(prev => ({ ...prev, termsConfig: configDoc.data() as TermsConfig }));
        }
      } catch (error) {
        console.error('Error fetching terms config:', error);
      }
    };
    fetchTermsConfig();
  }, []);

  // Compute termsAccepted when termsConfig or userTermsData changes
  useEffect(() => {
    // Only compute after user is loaded and we have termsConfig
    if (state.loading) return;

    // If no user, terms don't apply
    if (!state.user) {
      setState(prev => ({ ...prev, termsAccepted: false, termsLoading: false }));
      return;
    }

    // If termsConfig hasn't loaded yet, keep loading
    if (!state.termsConfig) {
      // Still loading config, but don't block - set termsLoading false so navigation can proceed
      // User will be redirected to terms page since termsAccepted is false
      setState(prev => ({ ...prev, termsAccepted: false, termsLoading: false }));
      return;
    }

    // Now we can properly evaluate terms acceptance
    if (state.userTermsData &&
        state.userTermsData.privacyVersion === state.termsConfig.privacyVersion &&
        state.userTermsData.termsVersion === state.termsConfig.termsVersion) {
      setState(prev => ({ ...prev, termsAccepted: true, termsLoading: false }));
    } else {
      setState(prev => ({ ...prev, termsAccepted: false, termsLoading: false }));
    }
  }, [state.loading, state.user, state.termsConfig, state.userTermsData]);

  // Configure Google auth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    expoClientId: EXPO_CLIENT_ID,
    selectAccount: true, // Always show account picker
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    let registrationUnsubscribe: (() => void) | null = null;
    let userDocUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setState(prev => ({ ...prev, user, loading: false, error: null }));

      // Cleanup previous listeners
      if (registrationUnsubscribe) {
        registrationUnsubscribe();
        registrationUnsubscribe = null;
      }
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (user) {
        updateSyncMeta({ userId: user.uid });
        // Register for push notifications
        registerForPushNotifications(user.uid).catch(console.error);

        // Listen to user's registration
        setState(prev => ({ ...prev, registrationLoading: true }));
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('uid', '==', user.uid));

        registrationUnsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const registration: Registration = {
              id: docSnap.id,
              ...docSnap.data(),
            } as Registration;
            setState(prev => ({ ...prev, registration, registrationLoading: false }));
          } else {
            setState(prev => ({ ...prev, registration: null, registrationLoading: false }));
          }
        }, (error) => {
          console.error('Registration listener error:', error);
          setState(prev => ({ ...prev, registration: null, registrationLoading: false }));
        });

        // Listen to user document for terms acceptance data
        const userDocRef = doc(db, 'users', user.uid);
        userDocUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const termsData = data.termsAcceptance as TermsAcceptance | undefined;
            setState(prev => ({ ...prev, userTermsData: termsData || null }));
          } else {
            setState(prev => ({ ...prev, userTermsData: null }));
          }
        }, (error) => {
          console.error('User doc listener error:', error);
          setState(prev => ({ ...prev, userTermsData: null }));
        });
      } else {
        setState(prev => ({
          ...prev,
          registration: null,
          registrationLoading: false,
          termsAccepted: false,
          termsLoading: false,
          userTermsData: null,
        }));
      }
    });

    return () => {
      unsubscribe();
      if (registrationUnsubscribe) {
        registrationUnsubscribe();
      }
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((error) => {
        console.error('Firebase sign in error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to sign in with Google.',
        }));
      });
    }
  }, [response]);

  const signIn = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await promptAsync();
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign in. Please try again.',
      }));
    }
  };

  // Apple Sign-In
  const signInWithApple = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Generate a secure random nonce
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Create Firebase credential with Apple token
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken!,
        rawNonce: nonce,
      });

      // Sign in to Firebase
      await signInWithCredential(auth, firebaseCredential);
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      // Don't show error if user cancelled
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to sign in with Apple. Please try again.',
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await clearAllData();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email sign in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      }
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email sign up error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const acceptTerms = async () => {
    if (!state.user) throw new Error('Must be signed in to accept terms');
    if (!state.termsConfig) throw new Error('Terms config not loaded');

    const userDocRef = doc(db, 'users', state.user.uid);
    await setDoc(userDocRef, {
      termsAcceptance: {
        acceptedAt: serverTimestamp(),
        privacyVersion: state.termsConfig.privacyVersion,
        termsVersion: state.termsConfig.termsVersion,
      }
    }, { merge: true });
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signInWithApple,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    clearError,
    isAuthenticated: !!state.user,
    isGoogleReady: !!request,
    isAppleAvailable: state.isAppleAvailable,
    // Registration state
    registration: state.registration,
    registrationLoading: state.registrationLoading,
    hasRegistration: !!state.registration,
    // Terms acceptance state
    termsAccepted: state.termsAccepted,
    termsLoading: state.termsLoading,
    termsConfig: state.termsConfig,
    acceptTerms,
  };
}
