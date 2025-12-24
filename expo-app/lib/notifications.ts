/**
 * Push notification setup for Expo.
 * Uses expo-notifications with APNs (iOS) and FCM (Android).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and register for push notifications.
 * Saves the token to Firestore for the Cloud Function to use.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: true,
        allowProvisional: false,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '4547c6e6-463a-471d-b9e8-dab16d069dfb',
    });
    const token = tokenData.data;

    console.log('Push token:', token);

    // Save token to Firestore (same collection as PWA)
    await setDoc(doc(db, 'fcmTokens', userId), {
      token,
      platform: Platform.OS,
      type: 'expo', // Differentiate from web FCM tokens
      updatedAt: serverTimestamp(),
    });

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Set up notification listeners for when notifications are received/tapped.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // When a notification is received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  // When user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    onNotificationTapped?.(response);
  });

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Schedule a local notification (for testing).
 */
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Baja Run 2026',
      body: 'Push notifications are working!',
      data: { test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

/**
 * Check if push notifications are supported on this device
 */
export function isPushSupported(): boolean {
  return Device.isDevice;
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<{
  granted: boolean;
  canAsk: boolean;
}> {
  const { status } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAsk: status === 'undetermined',
  };
}

/**
 * Check if notifications are enabled (permission granted AND token registered)
 */
export async function areNotificationsEnabled(userId: string): Promise<boolean> {
  const { granted } = await getNotificationPermissionStatus();
  if (!granted) return false;

  // Check if we have a token registered in Firestore
  try {
    const tokenDoc = await getDoc(doc(db, 'fcmTokens', userId));
    return tokenDoc.exists();
  } catch {
    return false;
  }
}
