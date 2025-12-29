/**
 * Notifications/Alerts page - Push notification feed and announcements.
 * Redesigned to match Stitch mockups with dark theme.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import {
  registerForPushNotifications,
  isPushSupported,
  areNotificationsEnabled,
  sendTestNotification,
} from '../../lib/notifications';

type FilterType = 'all' | 'urgent' | 'important' | 'info';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { announcements, syncing, refresh, isOnline } = useOfflineData(user?.uid || null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Check notification status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setNotificationsSupported(isPushSupported());

      if (user?.uid) {
        const enabled = await areNotificationsEnabled(user.uid);
        setNotificationsEnabled(enabled);
      }
      setCheckingStatus(false);
    };

    checkStatus();
  }, [user?.uid]);

  const handleEnableNotifications = async () => {
    if (!user?.uid) return;

    setEnabling(true);
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        setNotificationsEnabled(true);
      }
    } finally {
      setEnabling(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: theme.danger, icon: 'exclamation-circle', label: 'Urgent' };
      case 'medium':
        return { color: theme.warning, icon: 'exclamation-triangle', label: 'Important' };
      default:
        return { color: theme.info, icon: 'info-circle', label: 'Info' };
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return a.priority === 'high';
    if (filter === 'important') return a.priority === 'medium';
    return a.priority === 'low' || !a.priority;
  });

  const urgentCount = announcements.filter((a) => a.priority === 'high').length;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'important', label: 'Important' },
    { key: 'info', label: 'Info' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>
          TOUR ALERTS
        </Text>
        {!isOnline && (
          <View style={[styles.offlineBadge, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
            <FontAwesome name="wifi" size={10} color={theme.warning} />
            <Text style={[styles.offlineText, { color: theme.warning }]}>OFFLINE</Text>
          </View>
        )}
      </View>

      {/* Urgent Count Banner */}
      {urgentCount > 0 && (
        <View style={[styles.urgentBanner, { backgroundColor: theme.danger + '20' }]}>
          <FontAwesome name="exclamation-circle" size={18} color={theme.danger} />
          <Text style={[styles.urgentText, { color: theme.danger }]}>
            {urgentCount} New Urgent Alert{urgentCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Push Notification Banner */}
      {!checkingStatus && notificationsSupported && !notificationsEnabled && (
        <TouchableOpacity
          onPress={handleEnableNotifications}
          disabled={enabling}
          style={[styles.enableBanner, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
        >
          <View style={styles.enableContent}>
            <FontAwesome name="bell" size={18} color={theme.accent} />
            <View style={styles.enableTextContainer}>
              <Text style={[styles.enableTitle, { color: theme.textPrimary }]}>
                Enable Push Notifications
              </Text>
              <Text style={[styles.enableSubtitle, { color: theme.textSecondary }]}>
                Get notified of important tour updates
              </Text>
            </View>
          </View>
          {enabling ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <View style={[styles.enableButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.enableButtonText}>Enable</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Filter Chips */}
      <View style={[styles.filterContainer, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? theme.accent : 'transparent' },
                  !isActive && { borderWidth: 1, borderColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.filterText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Alerts List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={refresh} tintColor={theme.accent} />
        }
      >
        {filteredAnnouncements.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.success + '20' }]}>
              <FontAwesome name="check-circle" size={40} color={theme.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              You're all caught up!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {announcements.length === 0
                ? 'No announcements yet. Pull down to refresh.'
                : 'No alerts match this filter.'}
            </Text>
          </View>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const priorityConfig = getPriorityConfig(announcement.priority || 'low');

            return (
              <View
                key={announcement.id}
                style={[
                  styles.alertCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                {/* Priority Indicator */}
                <View style={[styles.priorityBar, { backgroundColor: priorityConfig.color }]} />

                <View style={styles.alertContent}>
                  {/* Header Row */}
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertIconContainer, { backgroundColor: priorityConfig.color + '20' }]}>
                      <FontAwesome name={priorityConfig.icon as any} size={16} color={priorityConfig.color} />
                    </View>
                    <View style={styles.alertTitleContainer}>
                      <Text style={[styles.alertTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {announcement.title}
                      </Text>
                      <Text style={[styles.alertTime, { color: theme.textMuted }]}>
                        {formatDate(announcement.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Body */}
                  <Text style={[styles.alertBody, { color: theme.textSecondary }]}>
                    {announcement.body}
                  </Text>

                  {/* Priority Badge */}
                  <View style={styles.alertFooter}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
                      <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                        {priorityConfig.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

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
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  urgentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  enableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  enableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  enableTextContainer: {
    flex: 1,
  },
  enableTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  enableSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  enableButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  enableButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  filterContainer: {
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  priorityBar: {
    width: 4,
  },
  alertContent: {
    flex: 1,
    padding: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    marginTop: 2,
  },
  alertBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  alertFooter: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
