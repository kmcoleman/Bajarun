/**
 * Firebase Cloud Messaging client for push notifications.
 */

import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, getMessagingInstance } from './firebase';

// VAPID key for web push (get from Firebase Console -> Project Settings -> Cloud Messaging)
const VAPID_KEY = 'BDcMFYFTQjeTt0DdWlKhAlB6NlFvECSdjGKMV2pyqzYL1HC0IkXRRlNo8i51HsnUQimfZ94JscCzIGeTljgzIGY';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get messaging instance
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('FCM not supported');
      return null;
    }

    // Register the Firebase messaging service worker and wait for it to be active
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('FCM Service Worker registered:', swRegistration);

        // Wait for the service worker to be active
        if (swRegistration.installing) {
          console.log('Waiting for service worker to activate...');
          await new Promise<void>((resolve) => {
            swRegistration!.installing!.addEventListener('statechange', (e) => {
              const sw = e.target as ServiceWorker;
              console.log('Service worker state:', sw.state);
              if (sw.state === 'activated') {
                resolve();
              }
            });
          });
          console.log('Service worker activated');
        } else if (swRegistration.waiting) {
          console.log('Service worker waiting, skipping to active');
        } else if (swRegistration.active) {
          console.log('Service worker already active');
        }
      } catch (swError) {
        console.error('FCM Service Worker registration failed:', swError);
      }
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('FCM token obtained:', token.substring(0, 20) + '...');
      // Save token to Firestore
      await saveTokenToFirestore(userId, token);
      return token;
    } else {
      console.log('No FCM token received');
    }

    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Save FCM token to Firestore
 */
async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
  console.log('Saving FCM token for user:', userId);
  try {
    await setDoc(doc(db, 'fcmTokens', userId), {
      token,
      updatedAt: serverTimestamp(),
    });
    console.log('FCM token saved to Firestore successfully');
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
    throw error;
  }
}

/**
 * Listen for foreground messages
 */
export async function setupForegroundMessaging(
  onMessageCallback: (payload: { title: string; body: string }) => void
): Promise<void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    onMessageCallback({
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
    });
  });
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

/**
 * Check if iOS Chrome (which doesn't support push)
 */
export function isIOSChrome(): boolean {
  return isIOS() && /CriOS/.test(navigator.userAgent);
}

/**
 * Get push notification support status message
 */
export function getPushSupportStatus(): { supported: boolean; message: string } {
  if (isIOSChrome()) {
    return {
      supported: false,
      message: 'Push notifications are not supported on iOS Chrome. Please use Safari and install the app to your home screen.',
    };
  }

  if (isIOS() && !isStandalone()) {
    return {
      supported: false,
      message: 'On iOS, you need to install this app to your home screen first. Tap the Share button, then "Add to Home Screen".',
    };
  }

  if (!areNotificationsSupported()) {
    return {
      supported: false,
      message: 'Push notifications are not supported in this browser.',
    };
  }

  return { supported: true, message: '' };
}
