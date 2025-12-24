/**
 * Authentication hook for Firebase Auth with Expo.
 * Uses expo-auth-session for Google Sign-In.
 */

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../lib/firebase';
import { clearAllData, updateSyncMeta } from '../lib/storage';
import { registerForPushNotifications } from '../lib/notifications';

// Required for expo-auth-session
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
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
  });

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setState({ user, loading: false, error: null });
      if (user) {
        updateSyncMeta({ userId: user.uid });
        // Register for push notifications
        registerForPushNotifications(user.uid).catch(console.error);
      }
    });

    return () => unsubscribe();
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

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await clearAllData();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    isAuthenticated: !!state.user,
    isGoogleReady: !!request,
  };
}
