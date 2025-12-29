/**
 * Feedback & Review - Submit tour feedback and public reviews
 * Based on Stitch mockup: feedback_&_review
 * Integrated with Firestore
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as Haptics from '../lib/haptics';

const RATING_CATEGORIES = [
  { id: 'organization', label: 'Organization' },
  { id: 'communication', label: 'Communication' },
  { id: 'accommodations', label: 'Accommodations' },
  { id: 'routeMaps', label: 'Route Maps and Files' },
  { id: 'mobileApp', label: 'Mobile App' },
  { id: 'tourDirector', label: 'Tour Director' },
];

export default function FeedbackPage() {
  const { user, registration } = useAuth();
  const { theme } = useTheme();

  const [generalFeedback, setGeneralFeedback] = useState('');
  const [tourReview, setTourReview] = useState('');
  const [makePublic, setMakePublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Category ratings
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    organization: 0,
    communication: 0,
    accommodations: 0,
    routeMaps: 0,
    mobileApp: 0,
    tourDirector: 0,
  });

  // Poor rating explanations (for ratings <= 3)
  const [poorRatingDetails, setPoorRatingDetails] = useState<Record<string, string>>({});

  const setRating = (categoryId: string, rating: number) => {
    Haptics.lightTap();
    setCategoryRatings(prev => ({ ...prev, [categoryId]: rating }));

    // Clear poor rating details if rating goes above 3
    if (rating > 3 && poorRatingDetails[categoryId]) {
      setPoorRatingDetails(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
    }
  };

  const setPoorDetail = (categoryId: string, detail: string) => {
    setPoorRatingDetails(prev => ({ ...prev, [categoryId]: detail }));
  };

  // Check if any category has a poor rating (3 or less)
  const getCategoriesWithPoorRatings = () => {
    return RATING_CATEGORIES.filter(
      cat => categoryRatings[cat.id] > 0 && categoryRatings[cat.id] <= 3
    );
  };

  // Calculate average rating for overall score
  const getAverageRating = () => {
    const ratedCategories = Object.values(categoryRatings).filter(r => r > 0);
    if (ratedCategories.length === 0) return 0;
    return Math.round(ratedCategories.reduce((a, b) => a + b, 0) / ratedCategories.length);
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to submit feedback.');
      return;
    }

    if (!generalFeedback.trim() && !tourReview.trim() && getAverageRating() === 0) {
      Alert.alert('Missing Information', 'Please enter feedback, ratings, or a review.');
      return;
    }

    // Check if any category is rated
    const hasRatings = Object.values(categoryRatings).some(r => r > 0);

    // If there's a review but no ratings, require at least one rating
    if (tourReview.trim() && !hasRatings) {
      Alert.alert('Rating Required', 'Please rate at least one category for your tour review.');
      return;
    }

    setSubmitting(true);

    try {
      const feedbackData: any = {
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      // Add general feedback if provided
      if (generalFeedback.trim()) {
        feedbackData.generalFeedback = generalFeedback.trim();
        feedbackData.hasGeneralFeedback = true;
      }

      // Add category ratings
      if (hasRatings) {
        feedbackData.categoryRatings = categoryRatings;
        feedbackData.averageRating = getAverageRating();
        feedbackData.hasTourReview = true;

        // Add poor rating explanations if any
        const poorCategories = getCategoriesWithPoorRatings();
        if (poorCategories.length > 0) {
          feedbackData.poorRatingDetails = poorRatingDetails;
        }
      }

      // Add tour review if provided
      if (tourReview.trim()) {
        feedbackData.tourReview = tourReview.trim();
        feedbackData.isPublic = makePublic;

        if (makePublic) {
          // Store public display name
          const fullName = registration?.fullName || user.displayName || 'Anonymous';
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0];
          const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] + '.' : '';
          feedbackData.publicDisplayName = `${firstName} ${lastInitial}`.trim();
        }
      }

      await addDoc(collection(db, 'events', 'bajarun2026', 'feedback'), feedbackData);

      Haptics.success();
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Haptics.error();
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (categoryId: string, currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(categoryId, star)}
            style={styles.starButton}
          >
            <FontAwesome
              name={star <= currentRating ? 'star' : 'star-o'}
              size={28}
              color={star <= currentRating ? '#facc15' : theme.cardBorder}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const poorRatingCategories = getCategoriesWithPoorRatings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Feedback & Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Share Your Adventure</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
            Help us improve our service or tell others about the tour. Your voice matters on the trail.
          </Text>
        </View>

        {/* General Feedback Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="comment-o" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>General Feedback</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>App & Service Feedback</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Tell us about your experience with the app features, booking process, or customer support..."
              placeholderTextColor={theme.textMuted}
              value={generalFeedback}
              onChangeText={setGeneralFeedback}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.privacyNote}>
              <FontAwesome name="lock" size={12} color={theme.textMuted} />
              <Text style={[styles.privacyText, { color: theme.textMuted }]}>
                This feedback is private and sent directly to our team.
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* Tour Review Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="map" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Tour Review</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {/* Overall Question */}
            <Text style={[styles.ratingQuestion, { color: theme.textPrimary }]}>How was the Tour?</Text>
            <Text style={[styles.ratingSubtext, { color: theme.textMuted }]}>Rate the following:</Text>

            {/* Category Ratings */}
            <View style={styles.categoryRatingsContainer}>
              {RATING_CATEGORIES.map((category) => (
                <View key={category.id} style={styles.categoryRatingRow}>
                  <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>
                    {category.label}
                  </Text>
                  {renderStars(category.id, categoryRatings[category.id])}
                </View>
              ))}
            </View>

            {/* Poor Rating Details */}
            {poorRatingCategories.length > 0 && (
              <View style={styles.poorRatingSection}>
                <View style={[styles.poorRatingHeader, { backgroundColor: theme.warning + '20' }]}>
                  <FontAwesome name="exclamation-circle" size={16} color={theme.warning} />
                  <Text style={[styles.poorRatingHeaderText, { color: theme.warning }]}>
                    Please help us understand what went wrong
                  </Text>
                </View>

                {poorRatingCategories.map((category) => (
                  <View key={category.id} style={styles.poorRatingInputGroup}>
                    <Text style={[styles.poorRatingLabel, { color: theme.textSecondary }]}>
                      What could we improve with {category.label}?
                    </Text>
                    <TextInput
                      style={[
                        styles.poorRatingInput,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.cardBorder,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder={`Tell us more about your ${category.label.toLowerCase()} experience...`}
                      placeholderTextColor={theme.textMuted}
                      value={poorRatingDetails[category.id] || ''}
                      onChangeText={(text) => setPoorDetail(category.id, text)}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Review Text */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Write a Review</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.cardBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Share highlights from the trail. What was the best part? Any difficult sections?"
                placeholderTextColor={theme.textMuted}
                value={tourReview}
                onChangeText={setTourReview}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Privacy Toggle */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
              Haptics.lightTap();
              setMakePublic(!makePublic);
            }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: makePublic ? theme.accent : 'transparent',
                    borderColor: makePublic ? theme.accent : theme.cardBorder,
                  },
                ]}
              >
                {makePublic && <FontAwesome name="check" size={12} color="#ffffff" />}
              </View>
              <View style={styles.checkboxText}>
                <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
                  Make public with First name, last initial
                </Text>
                <Text style={[styles.checkboxHint, { color: theme.textMuted }]}>
                  Your review will be visible on the tour page.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.accent }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
              <FontAwesome name="send" size={16} color="#ffffff" />
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
    width: 40,
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
  heroSection: {
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.lg,
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
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 120,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  privacyText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  ratingQuestion: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ratingSubtext: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  categoryRatingsContainer: {
    marginBottom: spacing.lg,
  },
  categoryRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 4,
  },
  poorRatingSection: {
    marginBottom: spacing.lg,
  },
  poorRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  poorRatingHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  poorRatingInputGroup: {
    marginBottom: spacing.md,
  },
  poorRatingLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  poorRatingInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 80,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxHint: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
