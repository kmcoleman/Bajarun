/**
 * Tours List - Browse available tours
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { spacing, borderRadius } from '../constants/theme';

interface Tour {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  registrationOpen: boolean;
  maxParticipants: number;
  currentParticipants?: number;
  depositAmount: number;
}

export default function ToursPage() {
  const { theme } = useTheme();
  const { registration, registrationLoading, hasRegistration } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toursRef = collection(db, 'tours');
    const q = query(toursRef, orderBy('startDate', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toursData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tour[];
      setTours(toursData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tours:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (tour: Tour) => {
    if (registration?.tourId === tour.id) {
      return { label: 'Registered', color: theme.success };
    }
    switch (tour.status) {
      case 'open':
        return { label: 'Open', color: theme.success };
      case 'upcoming':
        return { label: 'Coming Soon', color: theme.warning };
      case 'closed':
        return { label: 'Closed', color: theme.textMuted };
      case 'completed':
        return { label: 'Completed', color: theme.textMuted };
      default:
        return { label: tour.status, color: theme.textMuted };
    }
  };

  const handleTourPress = (tour: Tour) => {
    if (registration?.tourId === tour.id) {
      // Already registered - go back to main app
      router.back();
    } else if (tour.registrationOpen) {
      // Navigate to registration form
      router.push({ pathname: '/register-tour', params: { tourId: tour.id } });
    }
  };

  if (loading || registrationLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading tours...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Available Tours</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Message */}
        {!hasRegistration && (
          <View style={[styles.welcomeCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
            <FontAwesome name="motorcycle" size={24} color={theme.accent} />
            <View style={styles.welcomeText}>
              <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>Welcome!</Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Browse available tours and register to join the adventure.
              </Text>
            </View>
          </View>
        )}

        {/* Tours List */}
        {tours.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="calendar-o" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
              No tours available at this time.
            </Text>
          </View>
        ) : (
          tours.map((tour) => {
            const status = getStatusBadge(tour);
            const isRegistered = registration?.tourId === tour.id;

            return (
              <TouchableOpacity
                key={tour.id}
                style={[
                  styles.tourCard,
                  { backgroundColor: theme.card, borderColor: isRegistered ? theme.success : theme.cardBorder },
                ]}
                onPress={() => handleTourPress(tour)}
                disabled={!tour.registrationOpen && !isRegistered}
              >
                {/* Tour Image */}
                <View style={styles.imageContainer}>
                  {tour.imageUrl ? (
                    <Image source={{ uri: tour.imageUrl }} style={styles.tourImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: theme.cardBorder }]}>
                      <FontAwesome name="image" size={32} color={theme.textMuted} />
                    </View>
                  )}
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <Text style={styles.statusBadgeText}>{status.label}</Text>
                  </View>
                </View>

                {/* Tour Info */}
                <View style={styles.tourInfo}>
                  <Text style={[styles.tourName, { color: theme.textPrimary }]}>{tour.name}</Text>
                  <Text style={[styles.tourDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {tour.description}
                  </Text>

                  {/* Date & Details */}
                  <View style={styles.tourDetails}>
                    <View style={styles.detailRow}>
                      <FontAwesome name="calendar" size={14} color={theme.textMuted} />
                      <Text style={[styles.detailText, { color: theme.textMuted }]}>
                        {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <FontAwesome name="users" size={14} color={theme.textMuted} />
                      <Text style={[styles.detailText, { color: theme.textMuted }]}>
                        {tour.currentParticipants || 0} / {tour.maxParticipants} riders
                      </Text>
                    </View>
                    {tour.depositAmount > 0 && (
                      <View style={styles.detailRow}>
                        <FontAwesome name="credit-card" size={14} color={theme.textMuted} />
                        <Text style={[styles.detailText, { color: theme.textMuted }]}>
                          ${tour.depositAmount} deposit
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Button */}
                  {isRegistered ? (
                    <View style={[styles.registeredBanner, { backgroundColor: theme.success + '15' }]}>
                      <FontAwesome name="check-circle" size={16} color={theme.success} />
                      <Text style={[styles.registeredText, { color: theme.success }]}>You're registered!</Text>
                    </View>
                  ) : tour.registrationOpen ? (
                    <View style={[styles.actionButton, { backgroundColor: theme.accent }]}>
                      <Text style={styles.actionButtonText}>Register Now</Text>
                      <FontAwesome name="chevron-right" size={12} color="#ffffff" />
                    </View>
                  ) : (
                    <View style={[styles.closedBanner, { backgroundColor: theme.textMuted + '15' }]}>
                      <Text style={[styles.closedText, { color: theme.textMuted }]}>Registration Closed</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  // Welcome Card
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Tour Card
  tourCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  tourImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tourInfo: {
    padding: spacing.lg,
  },
  tourName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tourDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tourDetails: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 13,
  },
  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Registered Banner
  registeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  registeredText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Closed Banner
  closedBanner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  closedText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
