/**
 * Terms Agreement Screen
 * Users must scroll and accept Privacy Policy and Terms of Service
 * Content is fetched dynamically from Firebase Storage
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { spacing, borderRadius } from '../constants/theme';

export default function TermsAgreementPage() {
  const { theme } = useTheme();
  const { user, acceptTerms, termsConfig } = useAuth();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Dynamic content from Storage
  const [privacyContent, setPrivacyContent] = useState<string | null>(null);
  const [termsContent, setTermsContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  // Fetch markdown content from Storage
  useEffect(() => {
    if (!termsConfig) return;

    const fetchContent = async () => {
      setContentLoading(true);
      setContentError(null);

      try {
        const [privacyRes, termsRes] = await Promise.all([
          fetch(termsConfig.privacyUrl),
          fetch(termsConfig.termsUrl)
        ]);

        if (!privacyRes.ok || !termsRes.ok) {
          throw new Error('Failed to load legal documents');
        }

        const [privacy, terms] = await Promise.all([
          privacyRes.text(),
          termsRes.text()
        ]);

        setPrivacyContent(privacy);
        setTermsContent(terms);
      } catch (err) {
        console.error('Error fetching legal content:', err);
        setContentError('Failed to load legal documents. Please try again.');
      } finally {
        setContentLoading(false);
      }
    };

    fetchContent();
  }, [termsConfig]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!isChecked || !hasScrolledToBottom) return;

    setIsSubmitting(true);
    try {
      await acceptTerms();
      // Navigation will happen automatically via _layout.tsx
    } catch (error) {
      console.error('Error accepting terms:', error);
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || contentLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading terms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (contentError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{contentError}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={() => {
              setContentLoading(true);
              setContentError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Markdown styles
  const markdownStyles = {
    body: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    heading1: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700' as const,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    heading2: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600' as const,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    heading3: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600' as const,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    paragraph: {
      marginBottom: spacing.sm,
    },
    list_item: {
      marginBottom: spacing.xs,
    },
    bullet_list: {
      marginBottom: spacing.sm,
    },
    strong: {
      color: theme.textPrimary,
      fontWeight: '600' as const,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Terms & Privacy</Text>
      </View>

      {/* Welcome */}
      <View style={[styles.welcomeSection, { backgroundColor: theme.card }]}>
        <FontAwesome name="motorcycle" size={32} color={theme.accent} />
        <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
          Welcome to NorCal Moto Adventure
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
          Please review and accept our Privacy Policy and Terms of Service to continue.
        </Text>
      </View>

      {/* Scrollable Terms */}
      <View style={[styles.termsContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Privacy Policy */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="shield" size={18} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Privacy Policy</Text>
            </View>
            <Markdown style={markdownStyles}>{privacyContent || ''}</Markdown>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Terms of Service */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="file-text-o" size={18} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Terms of Service</Text>
            </View>
            <Markdown style={markdownStyles}>{termsContent || ''}</Markdown>

            {/* End marker */}
            <View style={styles.endMarker}>
              <Text style={[styles.endMarkerText, { color: theme.textMuted }]}>— End of Terms —</Text>
            </View>
          </View>
        </ScrollView>

        {/* Scroll indicator */}
        {!hasScrolledToBottom && (
          <View style={[styles.scrollIndicator, { backgroundColor: theme.warning + '20', borderTopColor: theme.cardBorder }]}>
            <FontAwesome name="chevron-down" size={14} color={theme.warning} />
            <Text style={[styles.scrollIndicatorText, { color: theme.warning }]}>
              Please scroll down to read all terms
            </Text>
            <FontAwesome name="chevron-down" size={14} color={theme.warning} />
          </View>
        )}
      </View>

      {/* Acceptance Section */}
      <View style={[styles.acceptanceSection, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkboxRow, !hasScrolledToBottom && styles.checkboxDisabled]}
          onPress={() => hasScrolledToBottom && setIsChecked(!isChecked)}
          disabled={!hasScrolledToBottom}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: hasScrolledToBottom ? theme.accent : theme.textMuted },
              isChecked && { backgroundColor: theme.accent },
            ]}
          >
            {isChecked && <FontAwesome name="check" size={14} color="#ffffff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: hasScrolledToBottom ? theme.textSecondary : theme.textMuted }]}>
            I have read and agree to the Privacy Policy and Terms of Service. I understand and accept
            the risks associated with motorcycle touring.
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isChecked && hasScrolledToBottom ? theme.accent : theme.cardBorder,
            },
          ]}
          onPress={handleAccept}
          disabled={!isChecked || !hasScrolledToBottom || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <FontAwesome name="check-circle" size={18} color={isChecked && hasScrolledToBottom ? '#ffffff' : theme.textMuted} />
              <Text
                style={[
                  styles.submitButtonText,
                  { color: isChecked && hasScrolledToBottom ? '#ffffff' : theme.textMuted },
                ]}
              >
                Accept & Continue
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!hasScrolledToBottom && (
          <Text style={[styles.helperText, { color: theme.textMuted }]}>
            Please scroll to the bottom of the terms to enable acceptance
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  welcomeSection: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  termsContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
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
    fontSize: 18,
    fontWeight: '700',
  },
  effectiveDate: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  endMarker: {
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },
  endMarkerText: {
    fontSize: 12,
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  scrollIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  acceptanceSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
