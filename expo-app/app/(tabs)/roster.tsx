/**
 * Roster page - Shows all tour participants with contact info.
 * Redesigned to match Stitch mockups with dark theme.
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import AlertsDropdown from '../../components/AlertsDropdown';

export default function RosterPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { roster, syncing, refresh } = useOfflineData(user?.uid || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoster = roster.filter((participant) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${participant.odFirstName} ${participant.odLastName}`.toLowerCase();
    const nickname = participant.odNickname?.toLowerCase() || '';
    const bike = participant.odBike?.toLowerCase() || '';
    return fullName.includes(query) || nickname.includes(query) || bike.includes(query);
  });

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const sendText = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const sendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>
            RIDER ROSTER
          </Text>
          <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.countText}>{roster.length} Riders</Text>
          </View>
        </View>
        <AlertsDropdown />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
          <FontAwesome name="search" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search riders..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.background }]}>
          <FontAwesome name="sliders" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Roster List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={refresh}
            tintColor={theme.accent}
          />
        }
      >
        {filteredRoster.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <FontAwesome name="users" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'No riders found' : 'No roster data yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
              {searchQuery ? 'Try a different search term' : 'Pull down to refresh'}
            </Text>
          </View>
        ) : (
          filteredRoster.map((participant) => (
            <View
              key={participant.odId}
              style={[styles.riderCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              {/* Main Content Row */}
              <View style={styles.cardContent}>
                {/* Photo */}
                <View style={[styles.photoContainer, { backgroundColor: theme.background }]}>
                  {participant.odPhotoUrl ? (
                    <Image
                      source={{ uri: participant.odPhotoUrl }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[styles.photoPlaceholder, { color: theme.textMuted }]}>
                      {participant.odFirstName?.[0] || '?'}
                    </Text>
                  )}
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                  <Text style={[styles.riderName, { color: theme.textPrimary }]}>
                    {participant.odFirstName} {participant.odLastName}
                  </Text>
                  {participant.odNickname && (
                    <Text style={[styles.nickname, { color: theme.textSecondary }]}>
                      "{participant.odNickname}"
                    </Text>
                  )}
                  {participant.odBike && (
                    <View style={styles.bikeRow}>
                      <FontAwesome name="motorcycle" size={12} color={theme.warning} />
                      <Text style={[styles.bikeText, { color: theme.warning }]}>
                        {participant.odBike}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Message Icon */}
                {participant.odPhone && (
                  <TouchableOpacity
                    onPress={() => sendText(participant.odPhone!)}
                    style={[styles.messageButton, { backgroundColor: theme.accent }]}
                  >
                    <FontAwesome name="comment" size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Contact Row */}
              {(participant.odEmail || participant.odPhone) && (
                <View style={[styles.contactRow, { borderTopColor: theme.cardBorder }]}>
                  {participant.odEmail && (
                    <TouchableOpacity
                      onPress={() => sendEmail(participant.odEmail!)}
                      style={styles.contactItem}
                    >
                      <FontAwesome name="envelope" size={14} color={theme.accent} />
                      <Text style={[styles.contactText, { color: theme.accent }]} numberOfLines={1}>
                        {participant.odEmail}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {participant.odPhone && (
                    <TouchableOpacity
                      onPress={() => makeCall(participant.odPhone!)}
                      style={styles.callButton}
                    >
                      <FontAwesome name="phone" size={14} color={theme.success} />
                      <Text style={[styles.callText, { color: theme.success }]}>Call</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  riderCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  photoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    fontSize: 22,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  nickname: {
    fontSize: 14,
    marginTop: 2,
  },
  bikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bikeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  contactText: {
    fontSize: 13,
    flex: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  callText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
