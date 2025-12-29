import '../global.css';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { ThemeProvider } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Se1jvRu02BYXJOrVgBjYomdKj3hpTzJ0XeRGsa569EJtYbQTomzfbgp6XvF5BGFKN35vm3P5yPMRAXDZn44uEJ200RZ6VGam2';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Navigation component that handles auth-based routing
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading, hasRegistration, registrationLoading, termsAccepted, termsLoading } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Handle auth-based navigation
  useEffect(() => {
    if (loading || registrationLoading || termsLoading) return; // Wait for all state to load

    const onLoginPage = segments[0] === 'login';
    const onTermsPage = segments[0] === 'terms-agreement';
    const onToursPage = segments[0] === 'tours';
    const onRegisterPage = segments[0] === 'register-tour';

    if (!isAuthenticated && !onLoginPage) {
      // User is not signed in but trying to access protected routes
      router.replace('/login');
    } else if (isAuthenticated && !termsAccepted && !onTermsPage) {
      // User is authenticated but hasn't accepted terms - redirect to terms
      // This includes redirecting from the login page after signup
      router.replace('/terms-agreement');
    } else if (isAuthenticated && termsAccepted && onTermsPage) {
      // User has accepted terms but is on terms page - redirect appropriately
      if (hasRegistration) {
        router.replace('/(tabs)');
      } else {
        router.replace('/tours');
      }
    } else if (isAuthenticated && termsAccepted && onLoginPage) {
      // User is signed in and accepted terms but on login page
      if (hasRegistration) {
        // Has registration - go to main app
        router.replace('/(tabs)');
      } else {
        // No registration - go to tours page
        router.replace('/tours');
      }
    } else if (isAuthenticated && termsAccepted && !hasRegistration && !onToursPage && !onRegisterPage && !onLoginPage && !onTermsPage) {
      // User is authenticated and accepted terms but has no registration - redirect to tours
      router.replace('/tours');
    }
  }, [isAuthenticated, loading, hasRegistration, registrationLoading, termsAccepted, termsLoading, segments]);

  // Set up notification listeners
  useEffect(() => {
    // When notification received in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
    });

    // When user taps on notification - navigate to Alerts
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Navigate to the alerts/notifications tab
      router.push('/(tabs)/notifications');
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="terms-agreement" />
      <Stack.Screen name="tours" />
      <Stack.Screen name="register-tour" options={{ presentation: 'card' }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="my-profile-details" options={{ presentation: 'card' }} />
      <Stack.Screen name="my-ledger" options={{ presentation: 'card' }} />
      <Stack.Screen name="ride-selections" options={{ presentation: 'card' }} />
      <Stack.Screen name="tour-logistics" options={{ presentation: 'card' }} />
      <Stack.Screen name="upload-media" options={{ presentation: 'modal' }} />
      <Stack.Screen name="feedback" options={{ presentation: 'card' }} />
      <Stack.Screen name="info-emergency" options={{ presentation: 'card' }} />
      <Stack.Screen name="info-checklist" options={{ presentation: 'card' }} />
      <Stack.Screen name="info-mexico" options={{ presentation: 'card' }} />
      <Stack.Screen name="store" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </StripeProvider>
  );
}
