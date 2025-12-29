/**
 * Login screen - Beautiful full-screen login for NorCal Moto Adventure
 * Matches Stitch design mockups with theme support
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Linking,
  StatusBar,
  Platform,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

// Background image - two riders in Baja desert
const BACKGROUND_IMAGE = 'https://bajarun-2026.web.app/baja-hero.png';

export default function LoginScreen() {
  const { signIn, signInWithApple, signInWithEmail, signUpWithEmail, loading, error, isGoogleReady, isAppleAvailable, clearError, isAuthenticated, termsLoading, registrationLoading } = useAuth();
  const { theme, isDark } = useTheme();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show loading overlay when authenticated but still loading other states
  // This prevents the user from interacting while navigation is pending
  const isWaitingForNavigation = isAuthenticated && (termsLoading || registrationLoading);

  const handleAppleLogin = async () => {
    await signInWithApple();
  };

  const handleEmailLogin = () => {
    clearError();
    setShowEmailForm(true);
    setIsSignUp(false);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    // Prevent double-submit
    if (isSubmitting || isAuthenticated) return;

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      // Success - navigation will be handled by _layout.tsx
      // Keep isSubmitting true to show loading state until navigation
    } catch (err) {
      // Error is already handled in useAuth
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    clearError();
    setShowEmailForm(true);
    setIsSignUp(true);
  };

  const handleBackToMain = () => {
    clearError();
    setShowEmailForm(false);
    setEmail('');
    setPassword('');
  };

  // Combined loading state
  const isLoading = loading || isSubmitting || isWaitingForNavigation;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Loading Overlay - shown when authenticated and waiting for navigation */}
      {isWaitingForNavigation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Setting up your account...</Text>
        </View>
      )}

      {/* Background Image with Gradient Overlays */}
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient overlays for depth - matching mockup */}
        <LinearGradient
          colors={['rgba(12, 74, 110, 0.4)', 'rgba(15, 23, 42, 0.6)', 'rgba(15, 23, 42, 0.9)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="motorbike" size={36} color="#38bdf8" />
          </View>
          <Text style={styles.brandText}>
            NorCal <Text style={styles.brandAccent}>Moto</Text> Adventure
          </Text>
        </View>

        {/* Login Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginSection}
        >
          {showEmailForm ? (
            <>
              {/* Email Form Header */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isSignUp
                    ? 'Enter your email and create a password.'
                    : 'Enter your email and password to sign in.'}
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email/Password Form */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email address"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleEmailSubmit}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.emailButton, isLoading && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.emailButtonText}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Toggle Sign Up / Sign In */}
                <TouchableOpacity
                  onPress={() => {
                    clearError();
                    setIsSignUp(!isSignUp);
                  }}
                  style={styles.toggleButton}
                >
                  <Text style={styles.toggleText}>
                    {isSignUp
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Sign Up"}
                  </Text>
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                  onPress={handleBackToMain}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={18} color="#94a3b8" />
                  <Text style={styles.backText}>Back to login options</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Header Text */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Join the adventure!</Text>
                <Text style={styles.headerSubtitle}>
                  Login to access your tours and itineraries.
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Login Buttons */}
              <View style={styles.buttonContainer}>
                {/* Apple Login - iOS only, when available */}
                {Platform.OS === 'ios' && isAppleAvailable && (
                  <TouchableOpacity
                    onPress={handleAppleLogin}
                    disabled={isLoading}
                    activeOpacity={0.9}
                    style={[styles.whiteButton, isLoading && styles.buttonDisabled]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#1e293b" />
                    ) : (
                      <>
                        <Ionicons name="logo-apple" size={24} color="#1e293b" />
                        <Text style={styles.whiteButtonText}>Login with Apple</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Google Login */}
                <TouchableOpacity
                  onPress={signIn}
                  disabled={isLoading || !isGoogleReady}
                  activeOpacity={0.9}
                  style={[
                    styles.whiteButton,
                    (isLoading || !isGoogleReady) && styles.buttonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#1e293b" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={24} color="#1e293b" />
                      <Text style={styles.whiteButtonText}>Login with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Email Login */}
                <TouchableOpacity
                  onPress={handleEmailLogin}
                  activeOpacity={0.9}
                  style={styles.emailButton}
                >
                  <Ionicons name="mail" size={20} color="#ffffff" />
                  <Text style={styles.emailButtonText}>Login with Email</Text>
                </TouchableOpacity>
              </View>

              {/* Create Account */}
              <TouchableOpacity
                onPress={handleCreateAccount}
                activeOpacity={0.8}
                style={styles.createAccountButton}
              >
                <Text style={styles.createAccountText}>Create Account</Text>
              </TouchableOpacity>

              {/* Footer Text */}
              <Text style={styles.footerText}>
                This is the companion app for registrants of events hosted by NorCal Moto ADV, the premier motorcycle tour organizer specializing in ADV bike tours and weekend rides primarily in Northern California but also Baja California.
              </Text>

              {/* Footer Links */}
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://bajarun-2026.web.app/privacy')}>
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://bajarun-2026.web.app/terms')}>
                  <Text style={styles.footerLink}>Terms of Service</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: '#e0f2fe',
    fontWeight: '500',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  // Logo Section
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    // Shadow
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandAccent: {
    color: '#38bdf8',
  },
  // Login Section
  loginSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerContainer: {
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(224, 242, 254, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  // Error
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: '#fecaca',
    textAlign: 'center',
    fontSize: 14,
  },
  // Buttons
  buttonContainer: {
    gap: spacing.md,
  },
  whiteButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whiteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emailButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#0284c7',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    // Shadow
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  createAccountButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: spacing.lg,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0f2fe',
  },
  // Footer
  footerText: {
    marginTop: spacing.xl,
    fontSize: 10,
    lineHeight: 16,
    color: 'rgba(148, 163, 184, 0.8)',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  footerLinks: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['3xl'],
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  // Email Form Styles
  formContainer: {
    gap: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: spacing.md,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggleText: {
    color: '#e0f2fe',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  backText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
