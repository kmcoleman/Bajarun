/**
 * AuthContext.tsx
 *
 * Provides authentication state throughout the app.
 * Handles login/logout and tracks current user.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

// Terms config from Firestore
interface TermsConfig {
  privacyVersion: string;
  termsVersion: string;
  privacyUrl: string;
  termsUrl: string;
}

// Registration document type
export interface Registration {
  id: string;
  uid: string;
  tourId?: string;
  email: string;
  fullName: string;
  phone?: string;
  nickname?: string;
  headshotUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Terms acceptance type
export interface TermsAcceptance {
  acceptedAt: any;
  privacyVersion: string;
  termsVersion: string;
}

// Hardcoded admin UID for production
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  registration: Registration | null;
  registrationLoading: boolean;
  hasRegistration: boolean;
  isAdmin: boolean;
  termsAccepted: boolean;
  termsLoading: boolean;
  termsConfig: TermsConfig | null;
  acceptTerms: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termsConfig, setTermsConfig] = useState<TermsConfig | null>(null);

  // Fetch terms config from Firestore on mount
  useEffect(() => {
    const fetchTermsConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'terms'));
        if (configDoc.exists()) {
          setTermsConfig(configDoc.data() as TermsConfig);
        }
      } catch (error) {
        console.error('Error fetching terms config:', error);
      }
    };
    fetchTermsConfig();
  }, []);

  useEffect(() => {
    let registrationUnsubscribe: (() => void) | null = null;
    let userDocUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

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
        // Check admin status: hardcoded UID OR isAdmin flag in Firestore
        const checkAdmin = user.uid === ADMIN_UID;
        setIsAdmin(checkAdmin);

        // Listen to user's registration
        setRegistrationLoading(true);
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('uid', '==', user.uid));

        registrationUnsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const reg: Registration = {
              id: docSnap.id,
              ...docSnap.data(),
            } as Registration;
            setRegistration(reg);
          } else {
            setRegistration(null);
          }
          setRegistrationLoading(false);
        }, (error) => {
          console.error('Registration listener error:', error);
          setRegistration(null);
          setRegistrationLoading(false);
        });

        // Listen to user document for terms acceptance and admin flag
        setTermsLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        userDocUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Check isAdmin flag from Firestore (for emulator/flexibility)
            if (data.isAdmin === true) {
              setIsAdmin(true);
            }

            // Don't finalize terms loading until termsConfig is loaded
            if (!termsConfig) {
              // Keep termsLoading true until config is available
              return;
            }
            const termsData = data.termsAcceptance as TermsAcceptance | undefined;
            // Check if terms were accepted and versions match current config
            if (termsData &&
                termsData.privacyVersion === termsConfig.privacyVersion &&
                termsData.termsVersion === termsConfig.termsVersion) {
              setTermsAccepted(true);
            } else {
              setTermsAccepted(false);
            }
          } else {
            setTermsAccepted(false);
          }
          setTermsLoading(false);
        }, (error) => {
          console.error('User doc listener error:', error);
          setTermsAccepted(false);
          setTermsLoading(false);
        });
      } else {
        setRegistration(null);
        setRegistrationLoading(false);
        setIsAdmin(false);
        setTermsAccepted(false);
        setTermsLoading(false);
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
  }, [termsConfig]);

  const acceptTerms = async () => {
    if (!user) throw new Error('Must be signed in to accept terms');
    if (!termsConfig) throw new Error('Terms config not loaded');

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      termsAcceptance: {
        acceptedAt: serverTimestamp(),
        privacyVersion: termsConfig.privacyVersion,
        termsVersion: termsConfig.termsVersion,
      }
    }, { merge: true });
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const createAccount = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      registration,
      registrationLoading,
      hasRegistration: !!registration,
      isAdmin,
      termsAccepted,
      termsLoading,
      termsConfig,
      acceptTerms,
      signInWithGoogle,
      signInWithEmail,
      createAccount,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
