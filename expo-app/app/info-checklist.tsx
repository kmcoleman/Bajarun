/**
 * Trip Checklist - Essential items for border crossing and travel
 *
 * Items are fetched from Firestore and cached locally for offline use.
 * User's checked state is stored locally.
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import * as Haptics from '../lib/haptics';

const CHECKLIST_KEY = '@baja_trip_checklist';
const CHECKLIST_ITEMS_KEY = '@baja_trip_checklist_items';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  order?: number;
}

// Default items - used as fallback if Firestore fetch fails and no cache exists
const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Documents
  { id: 'passport', label: 'Valid passport', category: 'Documents', order: 1 },
  { id: 'fmm', label: 'FMM tourist card', category: 'Documents', order: 2 },
  { id: 'vehicle_permit', label: 'Mexican vehicle permit (if going past Baja)', category: 'Documents', order: 3 },
  { id: 'mx_insurance', label: 'Mexican liability insurance', category: 'Documents', order: 4 },
  { id: 'registration', label: 'Vehicle registration', category: 'Documents', order: 5 },
  { id: 'license', label: "Driver's license", category: 'Documents', order: 6 },
  // Gear
  { id: 'helmet', label: 'Helmet', category: 'Gear', order: 1 },
  { id: 'riding_gear', label: 'Full riding gear (jacket, pants, boots, gloves)', category: 'Gear', order: 2 },
  { id: 'hydration', label: 'Hydration pack or water bottles', category: 'Gear', order: 3 },
  { id: 'toolkit', label: 'Basic toolkit', category: 'Gear', order: 4 },
  { id: 'tire_repair', label: 'Tire repair kit', category: 'Gear', order: 5 },
  { id: 'first_aid', label: 'First aid kit', category: 'Gear', order: 6 },
  // Electronics
  { id: 'gps', label: 'GPS device (Garmin recommended)', category: 'Electronics', order: 1 },
  { id: 'phone_charger', label: 'Phone charger', category: 'Electronics', order: 2 },
  { id: 'spot_inreach', label: 'SPOT or Garmin InReach', category: 'Electronics', order: 3 },
  // Money
  { id: 'pesos', label: 'Mexican pesos (cash)', category: 'Money', order: 1 },
  { id: 'usd', label: 'US dollars (cash backup)', category: 'Money', order: 2 },
  { id: 'cards', label: 'Credit/debit cards (notify bank)', category: 'Money', order: 3 },
];

// Category display order and icons
const CATEGORY_CONFIG: Record<string, { order: number; icon: string }> = {
  'Documents': { order: 1, icon: 'file-text-o' },
  'Gear': { order: 2, icon: 'suitcase' },
  'Electronics': { order: 3, icon: 'plug' },
  'Money': { order: 4, icon: 'money' },
};

export default function TripChecklistPage() {
  const { theme } = useTheme();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST_ITEMS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load checklist items from Firestore, with local cache fallback
  useEffect(() => {
    const loadItems = async () => {
      try {
        // First, try to load from local cache for instant display
        const cachedItems = await AsyncStorage.getItem(CHECKLIST_ITEMS_KEY);
        if (cachedItems) {
          const parsed = JSON.parse(cachedItems);
          setChecklistItems(parsed.items);
          setLastUpdated(new Date(parsed.updatedAt));
        }

        // Then fetch from Firestore for latest
        const docRef = doc(db, 'appConfig', 'tripChecklist');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.items && Array.isArray(data.items)) {
            setChecklistItems(data.items);
            setLastUpdated(data.updatedAt?.toDate() || new Date());

            // Cache locally for offline use
            await AsyncStorage.setItem(CHECKLIST_ITEMS_KEY, JSON.stringify({
              items: data.items,
              updatedAt: new Date().toISOString(),
            }));
          }
        }
      } catch (error) {
        console.log('Using cached/default checklist items:', error);
        // Already have cached or default items loaded
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  // Load user's checked state (separate from items)
  useEffect(() => {
    const loadChecked = async () => {
      try {
        const saved = await AsyncStorage.getItem(CHECKLIST_KEY);
        if (saved) {
          setChecked(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading checklist state:', error);
      }
    };
    loadChecked();
  }, []);

  // Save checked state
  const toggleItem = async (id: string) => {
    Haptics.lightTap();
    const newChecked = { ...checked, [id]: !checked[id] };
    setChecked(newChecked);
    try {
      await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(newChecked));
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  // Group by category and sort
  const categories = Array.from(new Set(checklistItems.map(item => item.category)))
    .sort((a, b) => (CATEGORY_CONFIG[a]?.order || 99) - (CATEGORY_CONFIG[b]?.order || 99));

  const itemsByCategory = categories.map(category => ({
    category,
    icon: CATEGORY_CONFIG[category]?.icon || 'list',
    items: checklistItems
      .filter(item => item.category === category)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
  }));

  const totalChecked = Object.values(checked).filter(Boolean).length;
  const totalItems = checklistItems.length;
  const progress = (totalChecked / totalItems) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Trip Checklist</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: theme.textPrimary }]}>
            {totalChecked} of {totalItems} items
          </Text>
          <Text style={[styles.progressPercent, { color: theme.success }]}>
            {Math.round(progress)}%
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
          <View style={[styles.progressBar, { backgroundColor: theme.success, width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {itemsByCategory.map((group) => (
          <View key={group.category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome
                name={
                  group.category === 'Documents' ? 'file-text-o' :
                  group.category === 'Gear' ? 'suitcase' :
                  group.category === 'Electronics' ? 'plug' : 'money'
                }
                size={16}
                color={theme.accent}
              />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {group.category}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={[
                    styles.checklistItem,
                    idx < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: checked[item.id] ? theme.success : 'transparent',
                        borderColor: checked[item.id] ? theme.success : theme.cardBorder,
                      },
                    ]}
                  >
                    {checked[item.id] && <FontAwesome name="check" size={12} color="#ffffff" />}
                  </View>
                  <Text
                    style={[
                      styles.checklistText,
                      { color: checked[item.id] ? theme.textMuted : theme.textPrimary },
                      checked[item.id] && styles.checkedText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Bottom spacing */}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checklistText: {
    fontSize: 15,
    flex: 1,
  },
  checkedText: {
    textDecorationLine: 'line-through',
  },
});
