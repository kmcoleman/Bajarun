/**
 * Info page - General trip reference information.
 * Redesigned to match Stitch mockups with dark theme.
 */

import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';

export default function InfoPage() {
  const { theme } = useTheme();

  const emergencyContacts = [
    { name: 'Support Truck', phone: '+1-555-SUPPORT', icon: 'truck', color: theme.warning },
    { name: 'Tour Leader', phone: '+1-555-LEADER', icon: 'user', color: theme.accent },
    { name: 'Mexico Emergency (911)', phone: '911', icon: 'phone', color: theme.danger },
    { name: 'US Embassy (Mexico City)', phone: '+52-55-5080-2000', icon: 'building', color: theme.info },
    { name: 'Mexican Red Cross', phone: '065', icon: 'plus-square', color: theme.danger },
  ];

  const spanishPhrases = [
    { english: 'Help!', spanish: '¡Ayuda!' },
    { english: 'I need a mechanic', spanish: 'Necesito un mecánico' },
    { english: 'Where is the gas station?', spanish: '¿Dónde está la gasolinera?' },
    { english: 'I have a flat tire', spanish: 'Tengo una llanta ponchada' },
    { english: 'My motorcycle broke down', spanish: 'Mi moto se descompuso' },
    { english: 'I need a doctor', spanish: 'Necesito un médico' },
    { english: 'How much does it cost?', spanish: '¿Cuánto cuesta?' },
    { english: 'Thank you', spanish: 'Gracias' },
  ];

  const bajaTips = [
    { title: 'Gas Stations', tip: 'Fill up at every opportunity. Stations can be 100+ miles apart in remote areas.', icon: 'tint' },
    { title: 'Water', tip: 'Carry at least 2 liters. The desert is unforgiving.', icon: 'tint' },
    { title: 'Speed', tip: 'Watch for topes (speed bumps), livestock, and road debris.', icon: 'warning' },
    { title: 'Money', tip: 'Carry pesos for smaller towns. Many places don\'t accept cards.', icon: 'money' },
  ];

  const checklist = [
    'Valid passport',
    'Mexican vehicle permit (if required)',
    'FMM tourist card',
    'Mexican liability insurance',
    'Vehicle registration',
    "Driver's license",
    'Proof of citizenship',
  ];

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>
          GENERAL INFO
        </Text>
        <View style={[styles.offlineBadge, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
          <FontAwesome name="wifi" size={10} color={theme.success} />
          <Text style={[styles.offlineText, { color: theme.success }]}>OFFLINE READY</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="ambulance" size={16} color={theme.danger} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Emergency Contacts
            </Text>
          </View>

          {emergencyContacts.map((contact, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => makeCall(contact.phone)}
              style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}>
                <FontAwesome name={contact.icon as any} size={18} color={contact.color} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.textPrimary }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                  {contact.phone}
                </Text>
              </View>
              <View style={[styles.callButton, { backgroundColor: theme.success }]}>
                <FontAwesome name="phone" size={14} color="#ffffff" />
                <Text style={styles.callButtonText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Border Crossing Checklist */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="check-square-o" size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Border Crossing Checklist
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {checklist.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.checklistItem,
                  idx < checklist.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.checkbox, { borderColor: theme.success, backgroundColor: theme.success + '20' }]}>
                  <FontAwesome name="check" size={10} color={theme.success} />
                </View>
                <Text style={[styles.checklistText, { color: theme.textPrimary }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Riding Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="road" size={16} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Riding in Mexico
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsRow}
          >
            {bajaTips.map((tip, idx) => (
              <View
                key={idx}
                style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={[styles.tipIcon, { backgroundColor: theme.warning + '20' }]}>
                  <FontAwesome name={tip.icon as any} size={20} color={theme.warning} />
                </View>
                <Text style={[styles.tipTitle, { color: theme.textPrimary }]}>
                  {tip.title}
                </Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  {tip.tip}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Spanish Phrases */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="language" size={16} color={theme.info} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Spanish Phrases
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {spanishPhrases.map((phrase, idx) => (
              <View
                key={idx}
                style={[
                  styles.phraseItem,
                  idx < spanishPhrases.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.englishText, { color: theme.textPrimary }]}>
                  {phrase.english}
                </Text>
                <Text style={[styles.spanishText, { color: theme.accent }]}>
                  {phrase.spanish}
                </Text>
              </View>
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '600',
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checklistText: {
    fontSize: 15,
    flex: 1,
  },
  tipsRow: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  tipCard: {
    width: 200,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  phraseItem: {
    padding: spacing.md,
  },
  englishText: {
    fontSize: 15,
    fontWeight: '500',
  },
  spanishText: {
    fontSize: 14,
    marginTop: 4,
  },
});
