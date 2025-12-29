/**
 * AlertsDropdown - Global alerts bell icon with expandable dropdown
 * Shows on all screens to provide quick access to tour alerts
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useOfflineData } from '../hooks/useOfflineData';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import * as Haptics from '../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DROPDOWN_WIDTH = Math.min(SCREEN_WIDTH - 32, 340);

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority?: string;
  createdAt: number;
}

export default function AlertsDropdown() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { announcements, refresh, syncing } = useOfflineData(user?.uid || null);
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Count unread/urgent alerts
  const urgentCount = (announcements as Announcement[]).filter((a) => a.priority === 'high').length;
  const totalCount = announcements.length;

  const openDropdown = () => {
    Haptics.lightTap();
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days === 0) {
      if (hours === 0) return 'Just now';
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'high':
        return { color: theme.danger, icon: 'exclamation-circle' };
      case 'medium':
        return { color: theme.warning, icon: 'exclamation-triangle' };
      default:
        return { color: theme.info, icon: 'info-circle' };
    }
  };

  return (
    <>
      {/* Bell Icon Button */}
      <TouchableOpacity style={styles.bellButton} onPress={openDropdown}>
        <FontAwesome name="bell-o" size={20} color={theme.textPrimary} />
        {totalCount > 0 && (
          <View style={[styles.badge, { backgroundColor: urgentCount > 0 ? theme.danger : theme.accent }]}>
            <Text style={styles.badgeText}>
              {totalCount > 9 ? '9+' : totalCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalOverlay}>
          {/* Background overlay - tap to close */}
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* Dropdown content */}
          <Animated.View
            style={[
              styles.dropdown,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.dropdownHeader, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.dropdownTitle, { color: theme.textPrimary }]}>
                Tour Alerts
              </Text>
              <View style={styles.headerRight}>
                {urgentCount > 0 && (
                  <View style={[styles.urgentBadge, { backgroundColor: theme.danger + '20' }]}>
                    <Text style={[styles.urgentText, { color: theme.danger }]}>
                      {urgentCount} urgent
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={refresh} disabled={syncing} style={styles.refreshButton}>
                  {syncing ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <FontAwesome name="refresh" size={14} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Alerts List - Scrollable */}
            <ScrollView
              style={styles.alertsList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.alertsListContent}
              nestedScrollEnabled={true}
              bounces={true}
            >
              {(announcements as Announcement[]).length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesome name="check-circle" size={24} color={theme.success} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No alerts yet
                  </Text>
                </View>
              ) : (
                (announcements as Announcement[]).map((alert: Announcement) => {
                  const priorityConfig = getPriorityConfig(alert.priority);
                  return (
                    <View
                      key={alert.id}
                      style={[styles.alertItem, { borderBottomColor: theme.cardBorder }]}
                    >
                      <View style={[styles.alertIcon, { backgroundColor: priorityConfig.color + '20' }]}>
                        <FontAwesome
                          name={priorityConfig.icon as any}
                          size={12}
                          color={priorityConfig.color}
                        />
                      </View>
                      <View style={styles.alertContent}>
                        <Text
                          style={[styles.alertTitle, { color: theme.textPrimary }]}
                          numberOfLines={1}
                        >
                          {alert.title}
                        </Text>
                        <Text
                          style={[styles.alertBody, { color: theme.textMuted }]}
                          numberOfLines={2}
                        >
                          {alert.body}
                        </Text>
                      </View>
                      <Text style={[styles.alertTime, { color: theme.textMuted }]}>
                        {formatDate(alert.createdAt)}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'flex-end',
    paddingTop: 100, // Position below header
    paddingHorizontal: 16,
  },
  dropdown: {
    width: DROPDOWN_WIDTH,
    maxHeight: 400,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  alertsList: {
    maxHeight: 320,
  },
  alertsListContent: {
    paddingBottom: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertBody: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  alertTime: {
    fontSize: 10,
  },
});
