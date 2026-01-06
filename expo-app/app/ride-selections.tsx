/**
 * My Ride Selections - Day-by-day accommodation, meals, and activities
 * Based on Stitch mockup: my_ride_selections
 * Integrated with Firestore
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type AccommodationType = 'hotel' | 'camping' | 'own';

interface NightConfig {
  date: string;
  nightSummary?: string;
  hotelAvailable: boolean;
  hotelName: string;
  hotelDescription?: string;
  hotelCost: number;
  campingAvailable: boolean;
  campingName?: string;
  campingDescription?: string;
  campingCost: number;
  dinnerAvailable: boolean;
  dinnerName?: string;
  dinnerDescription?: string;
  dinnerCost: number;
  breakfastAvailable: boolean;
  breakfastName?: string;
  breakfastDescription?: string;
  breakfastCost: number;
  optionalActivities?: { id: string; title: string; cost: number; description: string }[];
}

interface NightSelection {
  accommodation: AccommodationType | null;
  dinner: boolean;
  breakfast: boolean;
  prefersSingleRoom?: boolean;
  prefersFloorSleeping?: boolean;
  optionalActivitiesInterested?: string[];
}

const TRIP_NIGHTS = [
  { key: 'night-1', date: '2026-03-19', label: 'Night 1 - Mar 19' },
  { key: 'night-2', date: '2026-03-20', label: 'Night 2 - Mar 20' },
  { key: 'night-3', date: '2026-03-21', label: 'Night 3 - Mar 21' },
  { key: 'night-4', date: '2026-03-22', label: 'Night 4 - Mar 22' },
  { key: 'night-5', date: '2026-03-23', label: 'Night 5 - Mar 23' },
  { key: 'night-6', date: '2026-03-24', label: 'Night 6 - Mar 24' },
  { key: 'night-7', date: '2026-03-25', label: 'Night 7 - Mar 25' },
  { key: 'night-8', date: '2026-03-26', label: 'Night 8 - Mar 26' },
];

const emptyNightSelection: NightSelection = {
  accommodation: null,
  dinner: false,
  breakfast: false,
  prefersSingleRoom: false,
  prefersFloorSleeping: false,
  optionalActivitiesInterested: [],
};

export default function RideSelectionsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [nightConfigs, setNightConfigs] = useState<Record<string, NightConfig>>({});
  const [selections, setSelections] = useState<Record<string, NightSelection>>({});
  const [expandedNight, setExpandedNight] = useState<string | null>(null);

  // Fetch night configs and user selections from Firestore
  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;

      try {
        setLoading(true);

        // Fetch event pricing config
        const configRef = doc(db, 'eventConfig', 'pricing');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.nights) {
            setNightConfigs(data.nights);
          }
        }

        // Fetch user's selections
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.accommodationSelections) {
            setSelections(userData.accommodationSelections);
          }
        }

        // Auto-expand first incomplete night or first night
        const firstIncomplete = TRIP_NIGHTS.find(night => {
          const config = nightConfigs[night.key];
          const selection = selections[night.key];
          const hasOptions = config && (config.hotelAvailable || config.campingAvailable);
          return hasOptions && !selection?.accommodation;
        });
        setExpandedNight(firstIncomplete?.key || 'night-1');

      } catch (error) {
        console.error('Error fetching selections:', error);
        Alert.alert('Error', 'Failed to load your selections. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.uid]);

  // Count nights with selections
  const confirmedNights = Object.values(selections).filter(s => s.accommodation !== null).length;
  const totalNights = Object.keys(nightConfigs).length || TRIP_NIGHTS.length;
  const progressPercent = totalNights > 0 ? (confirmedNights / totalNights) * 100 : 0;

  // Calculate estimated total
  const calculateTotal = () => {
    let total = 0;
    TRIP_NIGHTS.forEach(night => {
      const config = nightConfigs[night.key];
      const selection = selections[night.key];
      if (!config || !selection) return;

      if (selection.accommodation === 'hotel' && config.hotelAvailable) {
        total += config.hotelCost;
      } else if (selection.accommodation === 'camping' && config.campingAvailable) {
        total += config.campingCost;
      }

      if (selection.dinner && config.dinnerAvailable) {
        total += config.dinnerCost;
      }
      if (selection.breakfast && config.breakfastAvailable) {
        total += config.breakfastCost;
      }

      // Sum optional activities
      if (config.optionalActivities && selection.optionalActivitiesInterested) {
        config.optionalActivities.forEach(activity => {
          if (selection.optionalActivitiesInterested?.includes(activity.id)) {
            total += activity.cost;
          }
        });
      }
    });
    return total;
  };

  const handleAccommodationChange = (nightKey: string, type: AccommodationType) => {
    setSelections(prev => ({
      ...prev,
      [nightKey]: {
        ...(prev[nightKey] || emptyNightSelection),
        accommodation: type,
      },
    }));
    setHasChanges(true);
  };

  const toggleMeal = (nightKey: string, meal: 'dinner' | 'breakfast') => {
    setSelections(prev => ({
      ...prev,
      [nightKey]: {
        ...(prev[nightKey] || emptyNightSelection),
        [meal]: !(prev[nightKey]?.[meal] ?? false),
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        accommodationSelections: selections,
        selectionsUpdatedAt: new Date(),
      }, { merge: true });

      setHasChanges(false);
      Alert.alert('Saved', 'Your ride selections have been saved.');
    } catch (error) {
      console.error('Error saving selections:', error);
      Alert.alert('Error', 'Failed to save selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAccommodationLabel = (type: AccommodationType | null) => {
    switch (type) {
      case 'hotel': return 'Hotel';
      case 'camping': return 'Camping';
      case 'own': return 'Own';
      default: return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Ride Selections</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading selections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Ride Selections</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>Tour Progress</Text>
            <Text style={[styles.progressCount, { color: theme.accent }]}>
              {confirmedNights}/{totalNights} Nights Confirmed
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
            <View style={[styles.progressBar, { backgroundColor: theme.accent, width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Empty State */}
        {Object.keys(nightConfigs).length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <FontAwesome name="info-circle" size={32} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Configurations Yet</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Accommodation options haven't been configured yet. Check back later.
            </Text>
          </View>
        )}

        {/* Night Cards */}
        {TRIP_NIGHTS.map((night, index) => {
          const config = nightConfigs[night.key];
          const isExpanded = expandedNight === night.key;
          const nightSelection = selections[night.key];
          const hasOptions = config && (config.hotelAvailable || config.campingAvailable);
          const hasSelection = nightSelection?.accommodation !== null && nightSelection?.accommodation !== undefined;

          return (
            <View
              key={night.key}
              style={[
                styles.dayCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isExpanded ? theme.accent : (hasSelection ? theme.success + '50' : theme.cardBorder),
                  borderWidth: isExpanded ? 2 : 1,
                },
              ]}
            >
              {/* Night Header */}
              <TouchableOpacity
                style={[styles.dayHeader, { backgroundColor: isExpanded ? theme.accent + '10' : 'transparent' }]}
                onPress={() => setExpandedNight(isExpanded ? null : night.key)}
              >
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayLabel, { color: isExpanded ? theme.accent : theme.textMuted }]}>
                    {night.label}
                  </Text>
                  <Text style={[styles.dayLocation, { color: theme.textPrimary }]}>
                    {config?.hotelName || 'Location TBD'}
                  </Text>
                </View>

                <View style={styles.dayStatus}>
                  {nightSelection?.accommodation && !isExpanded && (
                    <View style={styles.selectionChips}>
                      <View style={[styles.chip, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                        <Text style={[styles.chipText, { color: theme.textSecondary }]}>
                          {getAccommodationLabel(nightSelection.accommodation)}
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: hasSelection ? theme.success + '15' : (hasOptions ? theme.warning + '15' : theme.background) }]}>
                    {hasSelection && <FontAwesome name="check-circle" size={12} color={theme.success} />}
                    <Text style={[styles.statusText, { color: hasSelection ? theme.success : (hasOptions ? theme.warning : theme.textMuted) }]}>
                      {hasSelection ? 'Set' : (hasOptions ? 'Required' : 'N/A')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Expanded Content */}
              {isExpanded && (
                <View style={styles.dayContent}>
                  {!hasOptions ? (
                    <View style={styles.noOptionsContainer}>
                      <FontAwesome name="info-circle" size={24} color={theme.textMuted} />
                      <Text style={[styles.noOptionsText, { color: theme.textMuted }]}>
                        Accommodation options not yet configured for this night.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Night Summary */}
                      {config?.nightSummary && (
                        <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
                          <Text style={[styles.summaryText, { color: theme.textSecondary }]}>{config.nightSummary}</Text>
                        </View>
                      )}

                      {/* Accommodation */}
                      <View style={styles.selectionSection}>
                        <View style={styles.sectionHeader}>
                          <FontAwesome name="bed" size={16} color={theme.accent} />
                          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Accommodation</Text>
                        </View>

                        <View style={styles.optionsContainer}>
                          {/* Hotel Option */}
                          {config?.hotelAvailable && (
                            <TouchableOpacity
                              style={[
                                styles.optionCard,
                                { backgroundColor: theme.background, borderColor: nightSelection?.accommodation === 'hotel' ? theme.accent : theme.cardBorder },
                              ]}
                              onPress={() => handleAccommodationChange(night.key, 'hotel')}
                            >
                              <View style={[styles.optionIcon, { backgroundColor: nightSelection?.accommodation === 'hotel' ? theme.accent : theme.cardBorder }]}>
                                <FontAwesome name="building" size={16} color={nightSelection?.accommodation === 'hotel' ? '#ffffff' : theme.textMuted} />
                              </View>
                              <View style={styles.optionInfo}>
                                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Hotel</Text>
                                <Text style={[styles.optionDesc, { color: theme.textMuted }]}>{config.hotelName}</Text>
                              </View>
                              <Text style={[styles.optionPrice, { color: theme.accent }]}>${config.hotelCost}</Text>
                            </TouchableOpacity>
                          )}

                          {/* Camping Option */}
                          {config?.campingAvailable && (
                            <TouchableOpacity
                              style={[
                                styles.optionCard,
                                { backgroundColor: theme.background, borderColor: nightSelection?.accommodation === 'camping' ? theme.success : theme.cardBorder },
                              ]}
                              onPress={() => handleAccommodationChange(night.key, 'camping')}
                            >
                              <View style={[styles.optionIcon, { backgroundColor: nightSelection?.accommodation === 'camping' ? theme.success : theme.cardBorder }]}>
                                <FontAwesome name="tree" size={16} color={nightSelection?.accommodation === 'camping' ? '#ffffff' : theme.textMuted} />
                              </View>
                              <View style={styles.optionInfo}>
                                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Camping</Text>
                                <Text style={[styles.optionDesc, { color: theme.textMuted }]}>{config.campingName || 'Campground'}</Text>
                              </View>
                              <Text style={[styles.optionPrice, { color: theme.success }]}>${config.campingCost}</Text>
                            </TouchableOpacity>
                          )}

                          {/* Own Arrangement Option */}
                          <TouchableOpacity
                            style={[
                              styles.optionCard,
                              { backgroundColor: theme.background, borderColor: nightSelection?.accommodation === 'own' ? theme.textMuted : theme.cardBorder },
                            ]}
                            onPress={() => handleAccommodationChange(night.key, 'own')}
                          >
                            <View style={[styles.optionIcon, { backgroundColor: nightSelection?.accommodation === 'own' ? theme.textMuted : theme.cardBorder }]}>
                              <FontAwesome name="user-times" size={16} color={nightSelection?.accommodation === 'own' ? '#ffffff' : theme.textMuted} />
                            </View>
                            <View style={styles.optionInfo}>
                              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>I'll arrange separately</Text>
                              <Text style={[styles.optionDesc, { color: theme.textMuted }]}>Make my own arrangements</Text>
                            </View>
                            <Text style={[styles.optionPrice, { color: theme.textMuted }]}>$0</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Meals */}
                      {(config?.dinnerAvailable || config?.breakfastAvailable) && (
                        <>
                          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                          <View style={styles.selectionSection}>
                            <View style={styles.sectionHeader}>
                              <FontAwesome name="cutlery" size={14} color={theme.accent} />
                              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Group Meals</Text>
                            </View>

                            {config?.breakfastAvailable && (
                              <View style={styles.mealOption}>
                                <View>
                                  <Text style={[styles.mealTitle, { color: theme.textPrimary }]}>
                                    {config.breakfastName || 'Breakfast'}
                                  </Text>
                                  <Text style={[styles.mealDesc, { color: theme.textMuted }]}>+${config.breakfastCost}</Text>
                                </View>
                                <TouchableOpacity
                                  style={[
                                    styles.toggle,
                                    { backgroundColor: nightSelection?.breakfast ? theme.accent : theme.cardBorder },
                                  ]}
                                  onPress={() => toggleMeal(night.key, 'breakfast')}
                                >
                                  <View style={[
                                    styles.toggleKnob,
                                    nightSelection?.breakfast && styles.toggleKnobActive,
                                  ]} />
                                </TouchableOpacity>
                              </View>
                            )}

                            {config?.dinnerAvailable && (
                              <View style={styles.mealOption}>
                                <View>
                                  <Text style={[styles.mealTitle, { color: theme.textPrimary }]}>
                                    {config.dinnerName || 'Dinner'}
                                  </Text>
                                  <Text style={[styles.mealDesc, { color: theme.textMuted }]}>+${config.dinnerCost}</Text>
                                </View>
                                <TouchableOpacity
                                  style={[
                                    styles.toggle,
                                    { backgroundColor: nightSelection?.dinner ? theme.accent : theme.cardBorder },
                                  ]}
                                  onPress={() => toggleMeal(night.key, 'dinner')}
                                >
                                  <View style={[
                                    styles.toggleKnob,
                                    nightSelection?.dinner && styles.toggleKnobActive,
                                  ]} />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Save Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Estimated Extras</Text>
          <Text style={[styles.totalAmount, { color: theme.textPrimary }]}>${calculateTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: hasChanges ? theme.accent : theme.cardBorder },
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={[styles.saveButtonText, { color: hasChanges ? '#ffffff' : theme.textMuted }]}>
                {hasChanges ? 'Save Selections' : 'No Changes'}
              </Text>
              {hasChanges && <FontAwesome name="arrow-right" size={14} color="#ffffff" />}
            </>
          )}
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Progress
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  // Day Card
  dayCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dayLocation: {
    fontSize: 17,
    fontWeight: '700',
  },
  dayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectionChips: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.DEFAULT,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // Day Content
  dayContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  selectionSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Accommodation
  accommodationGrid: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  accommodationOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.DEFAULT,
    position: 'relative',
  },
  accommodationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accommodationPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  // Meals
  mealOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  mealDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // New styles for updated UI
  noOptionsContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  noOptionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
});
