/**
 * Notifications page - Push notification feed and announcements.
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import {
  registerForPushNotifications,
  isPushSupported,
  areNotificationsEnabled,
  sendTestNotification,
} from '../../lib/notifications';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { announcements, syncing, refresh, isOnline } = useOfflineData(user?.uid || null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check notification status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setNotificationsSupported(isPushSupported());

      if (user?.uid) {
        const enabled = await areNotificationsEnabled(user.uid);
        setNotificationsEnabled(enabled);
      }
      setCheckingStatus(false);
    };

    checkStatus();
  }, [user?.uid]);

  const handleEnableNotifications = async () => {
    if (!user?.uid) return;

    setEnabling(true);
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        setNotificationsEnabled(true);
      }
    } finally {
      setEnabling(false);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Online status */}
      <View className={`px-4 py-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
        <Text className="text-white text-center text-sm">
          {isOnline ? '🟢 Online' : '🔴 Offline - showing cached data'}
        </Text>
      </View>

      {/* Push notification toggle */}
      {checkingStatus ? (
        <View className="bg-blue-50 border-b border-blue-200 p-4 flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text className="text-blue-700 ml-2">Checking notification status...</Text>
        </View>
      ) : notificationsSupported ? (
        <View className={`border-b p-4 ${notificationsEnabled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className={`text-sm font-medium ${notificationsEnabled ? 'text-green-900' : 'text-blue-900'}`}>
                Push Notifications
              </Text>
              <Text className={`text-xs ${notificationsEnabled ? 'text-green-700' : 'text-blue-700'}`}>
                {notificationsEnabled ? 'Notifications are enabled' : 'Get notified of important updates'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEnableNotifications}
              disabled={enabling}
              className={`px-4 py-2 rounded-lg ${
                notificationsEnabled
                  ? 'bg-green-600'
                  : 'bg-blue-600'
              } ${enabling ? 'opacity-50' : ''}`}
            >
              {enabling ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-sm font-medium">
                  {notificationsEnabled ? 'Re-register' : 'Enable'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Test notification button (only when enabled) */}
          {notificationsEnabled && (
            <TouchableOpacity
              onPress={handleTestNotification}
              className="mt-3 py-2"
            >
              <Text className="text-green-700 text-xs text-center underline">
                Send test notification
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="bg-yellow-50 border-b border-yellow-200 p-4">
          <Text className="text-sm text-yellow-800">
            Push notifications require a physical device. They won't work in the simulator.
          </Text>
        </View>
      )}

      {/* Header with count */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row justify-between items-center">
        <Text className="text-sm text-gray-500">
          {announcements.length} notification{announcements.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          disabled={syncing}
          className={`px-4 py-2 bg-blue-500 rounded-lg ${syncing ? 'opacity-50' : ''}`}
        >
          <Text className="text-white text-sm font-medium">
            {syncing ? 'Syncing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={refresh} />
        }
      >
        <View className="p-4">
          {announcements.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center">
              <Text className="text-gray-400 text-4xl mb-3">🔔</Text>
              <Text className="text-gray-500 text-center">
                No announcements yet.{'\n'}Pull down to refresh.
              </Text>
            </View>
          ) : (
            announcements.map((announcement) => (
              <View
                key={announcement.id}
                className={`bg-white rounded-xl shadow-sm mb-3 overflow-hidden border-l-4 ${
                  announcement.priority === 'high' ? 'border-red-500' : 'border-blue-500'
                }`}
              >
                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-gray-900 font-semibold flex-1">
                      {announcement.priority === 'high' && '🚨 '}
                      {announcement.title}
                    </Text>
                    <Text className="text-gray-400 text-xs ml-2">
                      {formatDate(announcement.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm">
                    {announcement.body}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
