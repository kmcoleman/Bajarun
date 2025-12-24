/**
 * Authentication hook for Firebase Auth.
 */

import { useState, useEffect } from 'preact/hooks';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { clearAllData, updateSyncMeta } from '../lib/db';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false, error: null });
      if (user) {
        updateSyncMeta({ userId: user.uid });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithPopup(auth, googleProvider);
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
  };
}
