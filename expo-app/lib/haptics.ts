/**
 * Haptic feedback utility for tactile responses
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Only run haptics on native platforms
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light tap - for button presses, selections, toggles
 */
export function lightTap() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Medium tap - for successful actions, confirmations
 */
export function mediumTap() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/**
 * Heavy tap - for important actions, deletions
 */
export function heavyTap() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/**
 * Selection changed - for picker changes, tab switches
 */
export function selectionChanged() {
  if (isNative) {
    Haptics.selectionAsync();
  }
}

/**
 * Success notification - for completed actions
 */
export function success() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/**
 * Warning notification - for caution states
 */
export function warning() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

/**
 * Error notification - for failures
 */
export function error() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
