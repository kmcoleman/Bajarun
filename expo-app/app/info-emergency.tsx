/**
 * Emergency Contacts - Critical contact information for the trip
 */

import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import * as Haptics from '../lib/haptics';

export default function EmergencyContactsPage() {
  const { theme } = useTheme();

  const emergencyContacts = [
    { name: 'Support Truck', phone: '+1-555-SUPPORT', description: 'Mechanical assistance & gear', icon: 'truck', color: theme.warning },
    { name: 'Tour Leader', phone: '+1-555-LEADER', description: 'Trip coordination', icon: 'user', color: theme.accent },
    { name: 'Mexico Emergency (911)', phone: '911', description: 'Police, fire, ambulance', icon: 'phone', color: theme.danger },
    { name: 'US Embassy (Mexico City)', phone: '+52-55-5080-2000', description: 'US citizen services', icon: 'building', color: theme.info },
    { name: 'Mexican Red Cross', phone: '065', description: 'Medical emergencies', icon: 'plus-square', color: theme.danger },
    { name: 'Roadside Assistance', phone: '078', description: 'Green Angels (Angeles Verdes)', icon: 'car', color: '#22c55e' },
  ];

  const makeCall = (phone: string) => {
    Haptics.mediumTap();
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Emergency Contacts</Text>
        <View style={[styles.offlineBadge, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
          <FontAwesome name="check" size={10} color={theme.success} />
          <Text style={[styles.offlineText, { color: theme.success }]}>OFFLINE</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Important Notice */}
        <View style={[styles.noticeCard, { backgroundColor: theme.danger + '15', borderColor: theme.danger + '30' }]}>
          <FontAwesome name="exclamation-triangle" size={16} color={theme.danger} />
          <Text style={[styles.noticeText, { color: theme.textPrimary }]}>
            Save these contacts to your phone before crossing into Mexico
          </Text>
        </View>

        {/* Contacts List */}
        <View style={styles.section}>
          {emergencyContacts.map((contact, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => makeCall(contact.phone)}
              style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}>
                <FontAwesome name={contact.icon as any} size={20} color={contact.color} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.textPrimary }]}>
                  {contact.name}
                </Text>
                <Text style={[styles.contactDescription, { color: theme.textMuted }]}>
                  {contact.description}
                </Text>
                <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                  {contact.phone}
                </Text>
              </View>
              <View style={[styles.callButton, { backgroundColor: theme.success }]}>
                <FontAwesome name="phone" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
          ))}
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    gap: spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
