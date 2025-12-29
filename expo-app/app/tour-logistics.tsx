/**
 * Tour Logistics - FMM card, insurance, and requirements
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

const LOGISTICS_ITEMS = [
  {
    id: 'fmm',
    icon: 'id-card',
    iconColor: '#8b5cf6',
    title: 'FMM Card',
    subtitle: 'Mexican Tourist Permit',
    description: 'Required for all travelers entering Mexico. Apply online 30 days before departure.',
    actionLabel: 'Apply Online',
    actionUrl: 'https://www.inm.gob.mx/fmme/publico/en/solicitud.html',
  },
  {
    id: 'insurance',
    icon: 'shield',
    iconColor: '#10b981',
    title: 'Mexico Insurance',
    subtitle: 'Motorcycle Coverage',
    description: 'Mexican law requires local insurance. US policies are not valid. Recommended: Baja Bound.',
    actionLabel: 'Get Quote',
    actionUrl: 'https://www.bajabound.com',
  },
  {
    id: 'passport',
    icon: 'book',
    iconColor: '#0ea5e9',
    title: 'Valid Passport',
    subtitle: 'Entry Requirement',
    description: 'Must be valid for at least 6 months beyond your travel dates.',
    actionLabel: null,
    actionUrl: null,
  },
  {
    id: 'registration',
    icon: 'file-text',
    iconColor: '#f59e0b',
    title: 'Vehicle Registration',
    subtitle: 'Original Document',
    description: 'Bring your original motorcycle registration. Copies are not accepted at the border.',
    actionLabel: null,
    actionUrl: null,
  },
];

export default function TourLogisticsPage() {
  const { theme } = useTheme();

  const handleAction = (url: string | null) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tour Logistics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
          <FontAwesome name="info-circle" size={20} color={theme.accent} />
          <Text style={[styles.introText, { color: theme.textPrimary }]}>
            Complete these requirements before departure. Documents should be uploaded to your profile.
          </Text>
        </View>

        {/* Logistics Items */}
        {LOGISTICS_ITEMS.map((item) => (
          <View
            key={item.id}
            style={[styles.logisticsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
                <FontAwesome name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <View style={styles.cardTitleSection}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              {item.description}
            </Text>

            {item.actionLabel && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.accent }]}
                onPress={() => handleAction(item.actionUrl)}
              >
                <Text style={styles.actionButtonText}>{item.actionLabel}</Text>
                <FontAwesome name="external-link" size={12} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Important Dates */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Important Dates</Text>

          <View style={[styles.dateCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.dateRow}>
              <View style={[styles.dateIcon, { backgroundColor: theme.warning + '15' }]}>
                <FontAwesome name="calendar" size={14} color={theme.warning} />
              </View>
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>FMM Application Window</Text>
                <Text style={[styles.dateValue, { color: theme.textPrimary }]}>Feb 17 - Mar 19, 2026</Text>
              </View>
            </View>

            <View style={[styles.dateDivider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.dateRow}>
              <View style={[styles.dateIcon, { backgroundColor: theme.success + '15' }]}>
                <FontAwesome name="calendar-check-o" size={14} color={theme.success} />
              </View>
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Insurance Coverage Dates</Text>
                <Text style={[styles.dateValue, { color: theme.textPrimary }]}>Mar 19 - Mar 28, 2026</Text>
              </View>
            </View>
          </View>
        </View>

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
  backButton: {
    padding: spacing.sm,
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
  // Intro Card
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Logistics Card
  logisticsCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleSection: {
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Section
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  // Date Card
  dateCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  dateIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    marginLeft: spacing.md,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  dateDivider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
});
