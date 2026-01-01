/**
 * Report/Block Modal - For reporting content or blocking users
 * Implements Apple App Store requirements for UGC moderation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { REPORT_REASONS, useModeration } from '../hooks/useModeration';
import * as Haptics from '../lib/haptics';

interface ReportBlockModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'media' | 'post' | 'comment' | 'profile';
  contentId: string;
  contentOwnerId: string;
  contentOwnerName: string;
  contentSnapshot?: any;
}

type ModalMode = 'options' | 'report' | 'block' | 'success';

export default function ReportBlockModal({
  visible,
  onClose,
  contentType,
  contentId,
  contentOwnerId,
  contentOwnerName,
  contentSnapshot,
}: ReportBlockModalProps) {
  const { theme } = useTheme();
  const { reportContent, blockUser } = useModeration();

  const [mode, setMode] = useState<ModalMode>('options');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const resetAndClose = () => {
    setMode('options');
    setSelectedReason(null);
    setAdditionalInfo('');
    setSubmitting(false);
    setSuccessMessage('');
    onClose();
  };

  const handleReport = async () => {
    if (!selectedReason) return;

    setSubmitting(true);
    Haptics.lightTap();

    const reasonLabel = REPORT_REASONS.find(r => r.key === selectedReason)?.label || selectedReason;
    const success = await reportContent(
      contentType,
      contentId,
      contentOwnerId,
      reasonLabel,
      additionalInfo || undefined,
      contentSnapshot
    );

    setSubmitting(false);

    if (success) {
      Haptics.success();
      setSuccessMessage('Thank you for your report. Our team will review it within 24 hours.');
      setMode('success');
    }
  };

  const handleBlock = async () => {
    setSubmitting(true);
    Haptics.lightTap();

    const success = await blockUser(
      contentOwnerId,
      contentOwnerName,
      selectedReason ? REPORT_REASONS.find(r => r.key === selectedReason)?.label : undefined
    );

    setSubmitting(false);

    if (success) {
      Haptics.success();
      setSuccessMessage(`${contentOwnerName} has been blocked. You will no longer see their content.`);
      setMode('success');
    }
  };

  const handleBlockAndReport = async () => {
    if (!selectedReason) return;

    setSubmitting(true);
    Haptics.lightTap();

    const reasonLabel = REPORT_REASONS.find(r => r.key === selectedReason)?.label || selectedReason;

    // Report first
    await reportContent(
      contentType,
      contentId,
      contentOwnerId,
      reasonLabel,
      additionalInfo || undefined,
      contentSnapshot
    );

    // Then block
    const success = await blockUser(contentOwnerId, contentOwnerName, reasonLabel);

    setSubmitting(false);

    if (success) {
      Haptics.success();
      setSuccessMessage(`Content reported and ${contentOwnerName} has been blocked. Our team will review your report within 24 hours.`);
      setMode('success');
    }
  };

  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
        What would you like to do?
      </Text>
      <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
        Content by {contentOwnerName}
      </Text>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => {
          Haptics.selectionChanged();
          setMode('report');
        }}
      >
        <View style={[styles.optionIcon, { backgroundColor: theme.warning + '20' }]}>
          <FontAwesome name="flag" size={20} color={theme.warning} />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Report Content</Text>
          <Text style={[styles.optionDesc, { color: theme.textMuted }]}>
            Flag this content for review by our team
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => {
          Haptics.selectionChanged();
          setMode('block');
        }}
      >
        <View style={[styles.optionIcon, { backgroundColor: theme.danger + '20' }]}>
          <FontAwesome name="ban" size={20} color={theme.danger} />
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Block User</Text>
          <Text style={[styles.optionDesc, { color: theme.textMuted }]}>
            Hide all content from {contentOwnerName}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderReportForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Haptics.selectionChanged();
          setMode('options');
          setSelectedReason(null);
        }}
      >
        <FontAwesome name="arrow-left" size={16} color={theme.textMuted} />
        <Text style={[styles.backText, { color: theme.textMuted }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Report Content</Text>
      <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
        Why are you reporting this?
      </Text>

      {REPORT_REASONS.map((reason) => (
        <TouchableOpacity
          key={reason.key}
          style={[
            styles.reasonButton,
            {
              backgroundColor: selectedReason === reason.key ? theme.accent + '20' : theme.card,
              borderColor: selectedReason === reason.key ? theme.accent : theme.cardBorder,
            },
          ]}
          onPress={() => {
            Haptics.selectionChanged();
            setSelectedReason(reason.key);
          }}
        >
          <Text
            style={[
              styles.reasonText,
              { color: selectedReason === reason.key ? theme.accent : theme.textPrimary },
            ]}
          >
            {reason.label}
          </Text>
          {selectedReason === reason.key && (
            <FontAwesome name="check" size={16} color={theme.accent} />
          )}
        </TouchableOpacity>
      ))}

      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
        Additional details (optional)
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            color: theme.textPrimary,
          },
        ]}
        placeholder="Provide more context..."
        placeholderTextColor={theme.textMuted}
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: selectedReason ? theme.accent : theme.cardBorder,
              opacity: selectedReason ? 1 : 0.5,
            },
          ]}
          onPress={handleReport}
          disabled={!selectedReason || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.blockAndReportButton,
            {
              backgroundColor: theme.danger + '20',
              borderColor: theme.danger,
              opacity: selectedReason ? 1 : 0.5,
            },
          ]}
          onPress={handleBlockAndReport}
          disabled={!selectedReason || submitting}
        >
          <Text style={[styles.blockAndReportText, { color: theme.danger }]}>
            Report & Block User
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderBlockConfirm = () => (
    <View style={styles.blockContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Haptics.selectionChanged();
          setMode('options');
        }}
      >
        <FontAwesome name="arrow-left" size={16} color={theme.textMuted} />
        <Text style={[styles.backText, { color: theme.textMuted }]}>Back</Text>
      </TouchableOpacity>

      <View style={[styles.blockIcon, { backgroundColor: theme.danger + '20' }]}>
        <FontAwesome name="ban" size={32} color={theme.danger} />
      </View>

      <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Block {contentOwnerName}?</Text>
      <Text style={[styles.blockDescription, { color: theme.textMuted }]}>
        When you block someone:{'\n\n'}
        • You won't see their posts or media{'\n'}
        • They won't be notified that you blocked them{'\n'}
        • You can unblock them anytime in Settings
      </Text>

      <TouchableOpacity
        style={[styles.blockConfirmButton, { backgroundColor: theme.danger }]}
        onPress={handleBlock}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.blockConfirmText}>Block {contentOwnerName}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={resetAndClose}>
        <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.success + '20' }]}>
        <FontAwesome name="check" size={32} color={theme.success} />
      </View>

      <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Done</Text>
      <Text style={[styles.successMessage, { color: theme.textMuted }]}>{successMessage}</Text>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: theme.accent }]}
        onPress={resetAndClose}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={resetAndClose} />

        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />

          {mode === 'options' && renderOptions()}
          {mode === 'report' && renderReportForm()}
          {mode === 'block' && renderBlockConfirm()}
          {mode === 'success' && renderSuccess()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  formContainer: {
    maxHeight: 500,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 14,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  blockAndReportButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  blockAndReportText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blockContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  blockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  blockDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  blockConfirmButton: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  blockConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelText: {
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  doneButton: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
