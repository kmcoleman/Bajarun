/**
 * Tour Registration Form - Multi-step registration for a tour
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { spacing, borderRadius } from '../constants/theme';

interface FormData {
  // Step 1: Personal Info
  fullName: string;
  nickname: string;
  phone: string;
  city: string;
  state: string;
  // Step 2: Emergency Contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  // Step 3: Motorcycle & Experience
  bikeModel: string;
  bikeYear: string;
  yearsRiding: string;
  offRoadExperience: string;
  // Step 4: Preferences
  accommodationPreference: string;
  tshirtSize: string;
}

const INITIAL_FORM: FormData = {
  fullName: '',
  nickname: '',
  phone: '',
  city: '',
  state: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  bikeModel: '',
  bikeYear: '',
  yearsRiding: '1to5',
  offRoadExperience: 'beginner',
  accommodationPreference: 'either',
  tshirtSize: 'L',
};

const STEPS = [
  { id: 1, title: 'Personal Info', icon: 'user' },
  { id: 2, title: 'Emergency', icon: 'heart' },
  { id: 3, title: 'Motorcycle', icon: 'motorcycle' },
  { id: 4, title: 'Preferences', icon: 'sliders' },
];

const YEARS_RIDING_OPTIONS = [
  { value: 'less1', label: 'Less than 1 year' },
  { value: '1to5', label: '1-5 years' },
  { value: '5to10', label: '5-10 years' },
  { value: '10plus', label: '10+ years' },
];

const OFFROAD_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const ACCOMMODATION_OPTIONS = [
  { value: 'camping', label: 'Prefer Camping' },
  { value: 'hotels', label: 'Prefer Hotels' },
  { value: 'either', label: 'Either works' },
];

const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export default function RegisterTourPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [headshotUri, setHeadshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setHeadshotUri(result.assets[0].uri);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.fullName.trim()) {
          Alert.alert('Required', 'Please enter your full name');
          return false;
        }
        if (!formData.phone.trim()) {
          Alert.alert('Required', 'Please enter your phone number');
          return false;
        }
        if (!formData.city.trim() || !formData.state.trim()) {
          Alert.alert('Required', 'Please enter your city and state');
          return false;
        }
        return true;
      case 2:
        if (!formData.emergencyName.trim()) {
          Alert.alert('Required', 'Please enter an emergency contact name');
          return false;
        }
        if (!formData.emergencyPhone.trim()) {
          Alert.alert('Required', 'Please enter an emergency contact phone');
          return false;
        }
        return true;
      case 3:
        if (!formData.bikeModel.trim()) {
          Alert.alert('Required', 'Please enter your motorcycle model');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to register');
      return;
    }

    if (!validateStep(step)) return;

    setSubmitting(true);

    try {
      let headshotUrl: string | null = null;

      // Upload headshot if provided
      if (headshotUri) {
        const response = await fetch(headshotUri);
        const blob = await response.blob();
        const fileName = `${user.uid}-${Date.now()}.jpg`;
        const storageRef = ref(storage, `headshots/${fileName}`);
        await uploadBytes(storageRef, blob);
        headshotUrl = await getDownloadURL(storageRef);
      }

      // Create registration document
      await addDoc(collection(db, 'registrations'), {
        ...formData,
        tourId: tourId || 'bajarun2026',
        email: user.email,
        uid: user.uid,
        headshotUrl,
        depositRequired: 500,
        depositPaid: 0,
        amtCollected: 0,
        participateGroup: true,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Registration Complete!',
        'Thank you for registering. We\'ll be in touch with more details soon.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, index) => (
        <View key={s.id} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              {
                backgroundColor: step >= s.id ? theme.accent : theme.cardBorder,
              },
            ]}
          >
            <FontAwesome
              name={s.icon as any}
              size={12}
              color={step >= s.id ? '#ffffff' : theme.textMuted}
            />
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: step > s.id ? theme.accent : theme.cardBorder },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderOptionButton = (
    options: { value: string; label: string }[],
    field: keyof FormData,
    currentValue: string
  ) => (
    <View style={styles.optionGrid}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.optionButton,
            {
              backgroundColor: currentValue === option.value ? theme.accent + '20' : theme.card,
              borderColor: currentValue === option.value ? theme.accent : theme.cardBorder,
            },
          ]}
          onPress={() => updateField(field, option.value)}
        >
          <Text
            style={[
              styles.optionText,
              { color: currentValue === option.value ? theme.accent : theme.textPrimary },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Personal Information</Text>

      {/* Headshot */}
      <View style={styles.headshotSection}>
        <TouchableOpacity style={styles.headshotButton} onPress={pickImage}>
          {headshotUri ? (
            <Image source={{ uri: headshotUri }} style={styles.headshotImage} />
          ) : (
            <View style={[styles.headshotPlaceholder, { backgroundColor: theme.cardBorder }]}>
              <FontAwesome name="camera" size={24} color={theme.textMuted} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.headshotLabel, { color: theme.textMuted }]}>
          Add profile photo
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
          value={formData.fullName}
          onChangeText={(v) => updateField('fullName', v)}
          placeholder="John Smith"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nickname</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
          value={formData.nickname}
          onChangeText={(v) => updateField('nickname', v)}
          placeholder="What do friends call you?"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
          value={formData.phone}
          onChangeText={(v) => updateField('phone', formatPhone(v))}
          placeholder="(555) 123-4567"
          placeholderTextColor={theme.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>City *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            value={formData.city}
            onChangeText={(v) => updateField('city', v)}
            placeholder="San Francisco"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>State *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            value={formData.state}
            onChangeText={(v) => updateField('state', v.toUpperCase().slice(0, 2))}
            placeholder="CA"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Emergency Contact</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textMuted }]}>
        Someone we can contact in case of emergency
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Contact Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
          value={formData.emergencyName}
          onChangeText={(v) => updateField('emergencyName', v)}
          placeholder="Jane Smith"
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
          value={formData.emergencyPhone}
          onChangeText={(v) => updateField('emergencyPhone', formatPhone(v))}
          placeholder="(555) 123-4567"
          placeholderTextColor={theme.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Relationship</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
          value={formData.emergencyRelation}
          onChangeText={(v) => updateField('emergencyRelation', v)}
          placeholder="Spouse, Partner, Friend, etc."
          placeholderTextColor={theme.textMuted}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Motorcycle & Experience</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bike Model *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            value={formData.bikeModel}
            onChangeText={(v) => updateField('bikeModel', v)}
            placeholder="BMW R1250GS"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Year</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            value={formData.bikeYear}
            onChangeText={(v) => updateField('bikeYear', v.replace(/\D/g, '').slice(0, 4))}
            placeholder="2023"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Years Riding</Text>
        {renderOptionButton(YEARS_RIDING_OPTIONS, 'yearsRiding', formData.yearsRiding)}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Off-Road Experience</Text>
        {renderOptionButton(OFFROAD_OPTIONS, 'offRoadExperience', formData.offRoadExperience)}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Preferences</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Accommodation Preference</Text>
        {renderOptionButton(ACCOMMODATION_OPTIONS, 'accommodationPreference', formData.accommodationPreference)}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>T-Shirt Size</Text>
        <View style={styles.sizeGrid}>
          {TSHIRT_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                {
                  backgroundColor: formData.tshirtSize === size ? theme.accent : theme.card,
                  borderColor: formData.tshirtSize === size ? theme.accent : theme.cardBorder,
                },
              ]}
              onPress={() => updateField('tshirtSize', size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  { color: formData.tshirtSize === size ? '#ffffff' : theme.textPrimary },
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
        <FontAwesome name="info-circle" size={20} color={theme.accent} />
        <View style={styles.summaryText}>
          <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>Ready to Submit</Text>
          <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
            A $500 deposit will be required to confirm your spot.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Register for Tour</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <ScrollView ref={scrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          <View style={{ height: spacing['3xl'] }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
          {step > 1 ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={prevStep}
            >
              <FontAwesome name="chevron-left" size={14} color={theme.textPrimary} />
              <Text style={[styles.navButtonText, { color: theme.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 100 }} />
          )}

          {step < 4 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={nextStep}
            >
              <Text style={[styles.navButtonText, { color: '#ffffff' }]}>Next</Text>
              <FontAwesome name="chevron-right" size={14} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton, { backgroundColor: theme.success }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={[styles.navButtonText, { color: '#ffffff' }]}>Submit</Text>
                  <FontAwesome name="check" size={14} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  stepContent: {
    gap: spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: 14,
    marginTop: -spacing.sm,
  },
  headshotSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headshotButton: {
    marginBottom: spacing.sm,
  },
  headshotPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headshotImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  headshotLabel: {
    fontSize: 14,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  optionGrid: {
    gap: spacing.sm,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sizeButton: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 60,
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  primaryButton: {
    borderWidth: 0,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
