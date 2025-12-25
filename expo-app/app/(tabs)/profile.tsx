/**
 * Profile page - User's registration info and documents.
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import { openDocument, cacheAllDocuments, getDocumentCacheStatus } from '../../lib/documents';
import { useTheme } from '../../context/ThemeContext';

// All document types
const DOCUMENT_CONFIG = {
  driversLicense: { label: "Driver's License", emoji: '🪪' },
  passport: { label: 'Passport', emoji: '📘' },
  fmmCard: { label: 'FMM Card', emoji: '📄' },
  fmmPaymentReceipt: { label: 'FMM Receipt', emoji: '🧾' },
  mexicoInsurance: { label: 'Mexico Insurance', emoji: '🛡️' },
  americanInsurance: { label: 'US Insurance', emoji: '🚗' },
} as const;

type DocumentType = keyof typeof DOCUMENT_CONFIG;

export default function ProfilePage() {
  const { user, signIn, signOut, isAuthenticated, loading: authLoading, error: authError } = useAuth();
  const { userProfile, riderDocuments, loading } = useOfflineData(user?.uid || null);
  const [cacheStatus, setCacheStatus] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const { theme, isDark, themePreference, setThemePreference } = useTheme();

  // Cache documents and track status
  useEffect(() => {
    if (riderDocuments) {
      // Cache all documents in background
      cacheAllDocuments(riderDocuments).then(() => {
        getDocumentCacheStatus().then(setCacheStatus);
      });
    }
  }, [riderDocuments]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleViewDocument = async (docType: DocumentType) => {
    const doc = riderDocuments?.[docType];
    if (doc?.url) {
      try {
        setDownloading(docType);
        const success = await openDocument(docType, doc.url, doc.fileName);
        if (!success) {
          Alert.alert('Error', 'Unable to open document. Please try again.');
        }
        // Update cache status
        const status = await getDocumentCacheStatus();
        setCacheStatus(status);
      } catch (error) {
        Alert.alert('Error', 'Unable to open document');
      } finally {
        setDownloading(null);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-baja-dark">
        {/* Header */}
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">🏍️</Text>
          <Text className="text-white text-3xl font-bold text-center mb-2">
            Baja Run 2026
          </Text>
          <Text className="text-blue-200 text-center">
            BMW Adventure Tour
          </Text>
        </View>

        {/* Login Section */}
        <View className="bg-white rounded-t-3xl p-6 pb-12">
          <Text className="text-gray-900 text-xl font-semibold text-center mb-2">
            Welcome, Rider!
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            Sign in to access your tour information, roster, and sync your data.
          </Text>

          {authError && (
            <View className="bg-red-100 p-3 rounded-lg mb-4">
              <Text className="text-red-600 text-center">{authError}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={signIn}
            disabled={authLoading}
            className={`bg-white border-2 border-gray-200 rounded-xl py-4 px-6 flex-row items-center justify-center ${
              authLoading ? 'opacity-50' : ''
            }`}
          >
            {authLoading ? (
              <ActivityIndicator color="#1e3a5f" />
            ) : (
              <>
                <Text className="text-2xl mr-3">G</Text>
                <Text className="text-gray-700 font-semibold">
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs text-center mt-6">
            Use the same Google account you registered with.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        {/* Profile Card */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-baja-dark p-6 items-center">
            <View className="w-24 h-24 rounded-full bg-white mb-3 overflow-hidden">
              {userProfile?.odPhotoUrl ? (
                <Image
                  source={{ uri: userProfile.odPhotoUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-gray-200">
                  <Text className="text-4xl text-gray-400">
                    {userProfile?.odFirstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-bold">
              {userProfile
                ? `${userProfile.odFirstName} ${userProfile.odLastName}`
                : user?.displayName || 'Loading...'}
            </Text>
            {userProfile?.odNickname && (
              <Text className="text-blue-200">"{userProfile.odNickname}"</Text>
            )}
          </View>

          {loading ? (
            <View className="p-4">
              <Text className="text-gray-500 text-center">Loading profile...</Text>
            </View>
          ) : userProfile ? (
            <View className="p-4">
              {userProfile.odEmail && (
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500">Email</Text>
                  <Text className="text-gray-900">{userProfile.odEmail}</Text>
                </View>
              )}
              {userProfile.odPhone && (
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500">Phone</Text>
                  <Text className="text-gray-900">{userProfile.odPhone}</Text>
                </View>
              )}
              {userProfile.odBike && (
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-gray-500">Bike</Text>
                  <Text className="text-gray-900">{userProfile.odBike}</Text>
                </View>
              )}
              {userProfile.odEmergencyContactName && (
                <View className="py-2">
                  <Text className="text-gray-500 mb-1">Emergency Contact</Text>
                  <Text className="text-gray-900">{userProfile.odEmergencyContactName}</Text>
                  {userProfile.odEmergencyContactPhone && (
                    <Text className="text-blue-600">{userProfile.odEmergencyContactPhone}</Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-gray-500 text-center">
                No registration found. Please register on the main website.
              </Text>
            </View>
          )}
        </View>

        {/* Documents Section */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-gray-600 px-4 py-2 flex-row justify-between items-center">
            <Text className="text-white text-sm font-medium">📄 My Documents</Text>
            <Text className="text-gray-300 text-xs">Saved for offline</Text>
          </View>
          <View className="p-4">
            {riderDocuments ? (
              <View>
                {(Object.entries(DOCUMENT_CONFIG) as [DocumentType, typeof DOCUMENT_CONFIG[DocumentType]][]).map(([key, config]) => {
                  const doc = riderDocuments[key];
                  const hasDoc = !!doc?.url;
                  const isCached = cacheStatus[key];
                  const isDownloading = downloading === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => hasDoc && handleViewDocument(key)}
                      disabled={!hasDoc || isDownloading}
                      className={`flex-row justify-between items-center py-3 border-b border-gray-100 ${hasDoc ? 'active:bg-gray-50' : ''}`}
                    >
                      <View className="flex-row items-center flex-1">
                        <Text className="text-gray-900">
                          {config.emoji} {config.label}
                        </Text>
                        {hasDoc && isCached && (
                          <Text className="text-green-500 text-xs ml-2">● offline</Text>
                        )}
                      </View>
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                      ) : hasDoc ? (
                        <View className="flex-row items-center">
                          <Text className="text-green-600 mr-2">✓</Text>
                          <Text className="text-blue-600 text-sm">Open</Text>
                        </View>
                      ) : (
                        <Text className="text-gray-400">Not uploaded</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text className="text-gray-500 text-center">
                No documents uploaded yet.
              </Text>
            )}
            <Text className="text-gray-400 text-xs text-center mt-3">
              Upload documents on the website
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-gray-600 px-4 py-2">
            <Text className="text-white text-sm font-medium">⚙️ Settings</Text>
          </View>
          <View className="p-4">
            {/* Theme Toggle */}
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <FontAwesome
                  name={isDark ? "moon-o" : "sun-o"}
                  size={18}
                  color={isDark ? "#6366f1" : "#f59e0b"}
                />
                <Text className="text-gray-900 ml-3">Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => setThemePreference(isDark ? 'light' : 'dark')}
                trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
                thumbColor={'#ffffff'}
              />
            </View>
            {/* System Theme Option */}
            <TouchableOpacity
              onPress={() => setThemePreference('system')}
              className="flex-row justify-between items-center py-3"
            >
              <View className="flex-row items-center">
                <FontAwesome name="mobile" size={18} color="#64748b" />
                <Text className="text-gray-900 ml-3">Use System Theme</Text>
              </View>
              {themePreference === 'system' && (
                <FontAwesome name="check" size={16} color="#22c55e" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 rounded-xl py-4 items-center mb-4"
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text className="text-gray-400 text-center text-xs">
          Baja Run 2026 v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
