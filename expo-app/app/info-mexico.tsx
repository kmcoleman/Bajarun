/**
 * Traveling in Mexico - Tips and essential info for riding in Mexico
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

interface Tip {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function TravelingInMexicoPage() {
  const { theme } = useTheme();

  const essentialTips: Tip[] = [
    {
      title: 'Gas Stations',
      description: 'Fill up at every opportunity. Stations can be 100+ miles apart in remote areas. Pemex is the main chain.',
      icon: 'tint',
      color: '#f59e0b',
    },
    {
      title: 'Water & Hydration',
      description: 'Carry at least 2-3 liters of water. The desert is unforgiving and dehydration happens fast.',
      icon: 'tint',
      color: '#3b82f6',
    },
    {
      title: 'Topes (Speed Bumps)',
      description: 'Watch for unmarked speed bumps, especially near towns. They can be steep and unexpected.',
      icon: 'warning',
      color: '#ef4444',
    },
    {
      title: 'Livestock',
      description: 'Cows, horses, and burros often wander onto roads, especially at dawn and dusk.',
      icon: 'warning',
      color: '#f59e0b',
    },
    {
      title: 'Cash is King',
      description: 'Carry Mexican pesos for smaller towns and markets. Many places don\'t accept cards.',
      icon: 'money',
      color: '#22c55e',
    },
    {
      title: 'Night Riding',
      description: 'Avoid riding at night. Poor road conditions, no lighting, and wandering livestock make it dangerous.',
      icon: 'moon-o',
      color: '#6366f1',
    },
  ];

  const roadConditionsTips: Tip[] = [
    {
      title: 'Road Quality',
      description: 'Road conditions vary dramatically. Expect potholes, washboard sections, and sand patches.',
      icon: 'road',
      color: theme.warning,
    },
    {
      title: 'Military Checkpoints',
      description: 'You may encounter military checkpoints. Be polite, have documents ready, and cooperate.',
      icon: 'shield',
      color: theme.info,
    },
    {
      title: 'GPS Navigation',
      description: 'Cell service is spotty. Download offline maps and use a dedicated GPS device.',
      icon: 'map-marker',
      color: theme.accent,
    },
  ];

  const cultureTips: Tip[] = [
    {
      title: 'Greetings',
      description: 'A friendly "Buenos días/tardes" goes a long way. Mexicans appreciate polite greetings.',
      icon: 'hand-peace-o',
      color: '#22c55e',
    },
    {
      title: 'Tipping',
      description: '10-15% is customary at restaurants. Tip gas station attendants 10-20 pesos.',
      icon: 'money',
      color: theme.warning,
    },
    {
      title: 'Photography',
      description: 'Ask permission before photographing people, especially in indigenous communities.',
      icon: 'camera',
      color: theme.info,
    },
  ];

  const renderTipCard = (tip: Tip, index: number, isLast: boolean) => (
    <View
      key={index}
      style={[
        styles.tipCard,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        !isLast && { marginBottom: spacing.sm },
      ]}
    >
      <View style={[styles.tipIcon, { backgroundColor: tip.color + '20' }]}>
        <FontAwesome name={tip.icon as any} size={20} color={tip.color} />
      </View>
      <View style={styles.tipContent}>
        <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>{tip.title}</Text>
        <Text style={[styles.tipDescription, { color: theme.textSecondary }]}>{tip.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Traveling in Mexico</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Essential Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="star" size={16} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Essential Tips</Text>
          </View>
          {essentialTips.map((tip, idx) => renderTipCard(tip, idx, idx === essentialTips.length - 1))}
        </View>

        {/* Road & Navigation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="road" size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Road & Navigation</Text>
          </View>
          {roadConditionsTips.map((tip, idx) => renderTipCard(tip, idx, idx === roadConditionsTips.length - 1))}
        </View>

        {/* Culture & Etiquette */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="users" size={16} color={theme.success} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Culture & Etiquette</Text>
          </View>
          {cultureTips.map((tip, idx) => renderTipCard(tip, idx, idx === cultureTips.length - 1))}
        </View>

        {/* Quick Reference Card */}
        <View style={[styles.referenceCard, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
          <Text style={[styles.referenceTitle, { color: theme.accent }]}>Quick Reference</Text>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: theme.textMuted }]}>Emergency:</Text>
            <Text style={[styles.referenceValue, { color: theme.textPrimary }]}>911</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: theme.textMuted }]}>Red Cross:</Text>
            <Text style={[styles.referenceValue, { color: theme.textPrimary }]}>065</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: theme.textMuted }]}>Green Angels:</Text>
            <Text style={[styles.referenceValue, { color: theme.textPrimary }]}>078</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={[styles.referenceLabel, { color: theme.textMuted }]}>Time Zone:</Text>
            <Text style={[styles.referenceValue, { color: theme.textPrimary }]}>Pacific (same as CA)</Text>
          </View>
        </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  referenceCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  referenceLabel: {
    fontSize: 14,
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
