/**
 * Login screen - Beautiful full-screen login for NorCal Moto Adventure
 */

import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Background image - adventure motorcycle on scenic road
const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80';

export default function LoginScreen() {
  const { signIn, isAuthenticated, loading, error, isGoogleReady } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleAppleLogin = () => {
    // TODO: Implement Apple Sign-In
    console.log('Apple login not yet implemented');
  };

  const handleEmailLogin = () => {
    // TODO: Implement Email Sign-In
    console.log('Email login not yet implemented');
  };

  const handleCreateAccount = () => {
    // TODO: Navigate to registration or web signup
    console.log('Create account not yet implemented');
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />

      {/* Background Image with Overlay */}
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE }}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      >
        {/* Dark overlay - simulates gradient effect */}
        <View className="absolute inset-0 bg-slate-900/70" />
      </ImageBackground>

      {/* Content */}
      <View className="flex-1 justify-between p-6 pb-8">

        {/* Logo Section */}
        <View className="items-center pt-16">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-400/30 mb-3">
            <MaterialCommunityIcons name="motorbike" size={36} color="#38bdf8" />
          </View>
          <Text className="text-2xl font-bold tracking-tight text-white uppercase text-center">
            NorCal <Text className="text-sky-400">Moto</Text> Adventure
          </Text>
        </View>

        {/* Login Section */}
        <View className="w-full max-w-md mx-auto">
          {/* Header Text */}
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-white text-center mb-2">
              Join the adventures.
            </Text>
            <Text className="text-sky-100/80 text-sm font-medium tracking-wide text-center">
              Login to access your tours and itineraries.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-500/20 border border-red-400/30 p-3 rounded-xl mb-4">
              <Text className="text-red-200 text-center text-sm">{error}</Text>
            </View>
          )}

          {/* Login Buttons */}
          <View className="gap-3">
            {/* Apple Login */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={handleAppleLogin}
                activeOpacity={0.9}
                className="h-14 w-full flex-row items-center justify-center gap-3 rounded-xl bg-white"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              >
                <Ionicons name="logo-apple" size={24} color="#1e293b" />
                <Text className="text-base font-bold text-slate-900">Login with Apple</Text>
              </TouchableOpacity>
            )}

            {/* Google Login */}
            <TouchableOpacity
              onPress={signIn}
              disabled={loading || !isGoogleReady}
              activeOpacity={0.9}
              className={`h-14 w-full flex-row items-center justify-center gap-3 rounded-xl bg-white ${
                (loading || !isGoogleReady) ? 'opacity-50' : ''
              }`}
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              {loading ? (
                <ActivityIndicator color="#1e293b" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={24} color="#1e293b" />
                  <Text className="text-base font-bold text-slate-900">Login with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Email Login */}
            <TouchableOpacity
              onPress={handleEmailLogin}
              activeOpacity={0.9}
              className="h-14 w-full flex-row items-center justify-center gap-3 rounded-xl bg-sky-600 border border-sky-500/50"
              style={{ shadowColor: '#0c4a6e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }}
            >
              <Ionicons name="mail" size={20} color="#fff" />
              <Text className="text-base font-bold text-white">Login with Email</Text>
            </TouchableOpacity>
          </View>

          {/* Create Account */}
          <TouchableOpacity
            onPress={handleCreateAccount}
            activeOpacity={0.8}
            className="mt-4 h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-slate-800/60 border border-white/10"
          >
            <Text className="text-base font-bold text-sky-100">Create Account</Text>
          </TouchableOpacity>

          {/* Footer Text */}
          <Text className="mt-6 text-[10px] leading-relaxed text-center text-slate-400 opacity-80 px-2">
            This is the companion app for registrants of events hosted by Norcal Moto ADV, the premier motorcycle tour organizer specialising in ADV bike tours and weekend rides primarily in Northern California but also Baja California.
          </Text>

          {/* Footer Links */}
          <View className="mt-6 flex-row justify-center gap-6">
            <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}>
              <Text className="text-xs text-slate-500 font-medium">Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}>
              <Text className="text-xs text-slate-500 font-medium">Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
