/**
 * My Profile Details - Shows personal info, emergency contact, motorcycle & experience
 * Based on Stitch mockup: my_profile_details
 */

import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useOfflineData } from '../hooks/useOfflineData';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

export default function MyProfileDetailsPage() {
  const { user } = useAuth();
  const { userProfile } = useOfflineData(user?.uid || null);
  const { theme } = useTheme();

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={[styles.editText, { color: theme.accent }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.photoContainer, { borderColor: theme.accent + '30' }]}>
            {userProfile?.odPhotoUrl ? (
              <Image source={{ uri: userProfile.odPhotoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: theme.card }]}>
                <Text style={[styles.photoInitial, { color: theme.textMuted }]}>
                  {userProfile?.odFirstName?.[0] || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.editPhotoIcon, { backgroundColor: theme.accent }]}>
              <FontAwesome name="pencil" size={10} color="#ffffff" />
            </View>
          </View>

          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {userProfile ? `${userProfile.odFirstName} ${userProfile.odLastName}` : 'Loading...'}
          </Text>
          {userProfile?.odNickname && (
            <Text style={[styles.nickname, { color: theme.textMuted }]}>
              "{userProfile.odNickname}"
            </Text>
          )}
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="user" size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Personal Information</Text>
          </View>

          {/* Location */}
          {userProfile?.odCity && (
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.accent + '15' }]}>
                <FontAwesome name="map-marker" size={18} color={theme.accent} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>ADDRESS</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{userProfile.odCity}</Text>
              </View>
            </View>
          )}

          {/* Phone */}
          {userProfile?.odPhone && (
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.infoIcon, { backgroundColor: theme.success + '15' }]}>
                <FontAwesome name="phone" size={18} color={theme.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>MOBILE</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{userProfile.odPhone}</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
            </View>
          )}

          {/* Email */}
          {userProfile?.odEmail && (
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.infoIcon, { backgroundColor: '#8b5cf6' + '15' }]}>
                <FontAwesome name="envelope" size={16} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>EMAIL</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]} numberOfLines={1}>
                  {userProfile.odEmail}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Emergency & Medical Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="medkit" size={16} color={theme.danger} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Emergency & Medical</Text>
          </View>

          <View style={[styles.emergencyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Emergency Contact */}
            <View style={styles.emergencyRow}>
              <View style={styles.emergencyInfo}>
                <Text style={[styles.emergencyLabel, { color: theme.danger }]}>EMERGENCY CONTACT</Text>
                <Text style={[styles.emergencyName, { color: theme.textPrimary }]}>
                  {userProfile?.odEmergencyContactName || 'Not set'}
                </Text>
                {userProfile?.odEmergencyContactPhone && (
                  <Text style={[styles.emergencyPhone, { color: theme.textSecondary }]}>
                    {userProfile.odEmergencyContactPhone}
                  </Text>
                )}
              </View>
              {userProfile?.odEmergencyContactPhone && (
                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: theme.danger + '15' }]}
                  onPress={() => handleCall(userProfile.odEmergencyContactPhone!)}
                >
                  <FontAwesome name="phone" size={18} color={theme.danger} />
                </TouchableOpacity>
              )}
            </View>

            {/* Medical Conditions */}
            <View style={[styles.medicalRow, { borderTopColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>MEDICAL CONDITIONS / ALLERGIES</Text>
              <View style={styles.medicalContent}>
                <FontAwesome name="check-circle" size={14} color={theme.textMuted} />
                <Text style={[styles.medicalText, { color: theme.textSecondary }]}>
                  {userProfile?.odMedicalConditions || 'None listed'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Motorcycle & Experience Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="motorcycle" size={16} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Motorcycle & Experience</Text>
          </View>

          {/* Bike */}
          {userProfile?.odBike && (
            <View style={[styles.bikeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>CURRENT BIKE</Text>
                <Text style={[styles.bikeText, { color: theme.textPrimary }]}>{userProfile.odBike}</Text>
              </View>
              <FontAwesome name="motorcycle" size={28} color={theme.warning} style={{ opacity: 0.8 }} />
            </View>
          )}

          {/* Experience Grid */}
          <View style={styles.experienceGrid}>
            <View style={[styles.experienceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>YEARS RIDING</Text>
              <Text style={[styles.experienceValue, { color: theme.textPrimary }]}>
                {userProfile?.odYearsRiding || '-'}
              </Text>
            </View>
            <View style={[styles.experienceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>OFF-ROAD</Text>
              <Text style={[styles.experienceValue, { color: theme.textPrimary }]}>
                {userProfile?.odOffRoadExperience || '-'}
              </Text>
            </View>
            <View style={[styles.experienceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>REPAIR SKILL</Text>
              <Text style={[styles.experienceValue, { color: theme.textPrimary }]}>
                {userProfile?.odRepairExperience || '-'}
              </Text>
            </View>
            <View style={[styles.experienceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>BAJA EXP.</Text>
              <Text style={[styles.experienceValue, { color: theme.textPrimary }]}>
                {userProfile?.odBajaExperience || '-'}
              </Text>
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
  editButton: {
    padding: spacing.sm,
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 48,
    fontWeight: '600',
  },
  editPhotoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  nickname: {
    fontSize: 14,
    marginTop: 4,
  },
  // Sections
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
    fontWeight: '700',
  },
  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  // Emergency Card
  emergencyCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emergencyName: {
    fontSize: 18,
    fontWeight: '600',
  },
  emergencyPhone: {
    fontSize: 15,
    marginTop: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicalRow: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  medicalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  medicalText: {
    fontSize: 15,
  },
  // Bike Card
  bikeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  bikeText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  // Experience Grid
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  experienceCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  experienceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
});
