/**
 * Login screen - Google Sign-In for tour participants.
 */

import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function LoginScreen() {
  const { signIn, isAuthenticated, loading, error, isGoogleReady } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

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
          Sign in to access your tour information, roster, and more.
        </Text>

        {error && (
          <View className="bg-red-100 p-3 rounded-lg mb-4">
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={signIn}
          disabled={loading || !isGoogleReady}
          className={`bg-white border-2 border-gray-200 rounded-xl py-4 px-6 flex-row items-center justify-center ${
            (loading || !isGoogleReady) ? 'opacity-50' : ''
          }`}
        >
          {loading ? (
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
