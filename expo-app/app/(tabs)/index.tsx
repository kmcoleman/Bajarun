/**
 * Tour page - The main view showing all info for a selected day.
 * Redesigned to match Stitch mockups with dark theme.
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import { itineraryData as defaultItineraryData } from '../../data/itinerary';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import AlertsDropdown from '../../components/AlertsDropdown';

export default function TourPage() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { userSelections, eventConfig, loading, syncing, refresh } = useOfflineData(
    user?.uid || null
  );
  const [selectedDay, setSelectedDay] = useState(1);

  // Use hardcoded itinerary as base, merge with Firestore eventConfig
  const itineraryData = defaultItineraryData;

  const dayData = itineraryData.find((d) => d.day === selectedDay);
  const nightKey = `night-${selectedDay}`;
  const userNightSelection = userSelections?.nights?.[nightKey];
  const nightConfig = eventConfig?.[nightKey];

  // Merge Firestore data with hardcoded itinerary
  const mergedDayData = dayData ? {
    ...dayData,
    // Override with Firestore data if available
    startPoint: nightConfig?.routeConfig?.startName || dayData.startPoint,
    endPoint: nightConfig?.routeConfig?.endName || dayData.endPoint,
    miles: nightConfig?.routeConfig?.estimatedDistance || dayData.miles,
    ridingTime: nightConfig?.routeConfig?.estimatedTime
      ? `${nightConfig.routeConfig.estimatedTime} hours`
      : dayData.ridingTime,
    accommodation: nightConfig?.hotelName || nightConfig?.campingName || dayData.accommodation,
    // Use Firestore coordinates if available
    coordinates: nightConfig?.routeConfig?.startCoordinates && nightConfig?.routeConfig?.endCoordinates
      ? {
          start: [nightConfig.routeConfig.startCoordinates.lat, nightConfig.routeConfig.startCoordinates.lng] as [number, number],
          end: [nightConfig.routeConfig.endCoordinates.lat, nightConfig.routeConfig.endCoordinates.lng] as [number, number],
        }
      : dayData.coordinates,
  } : null;

  const openMaps = (url: string) => {
    Linking.openURL(url);
  };

  if (!mergedDayData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textMuted }}>Day not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>
          BAJA PENINSULA TOUR
        </Text>
        <AlertsDropdown />
      </View>

      {/* Day Selector */}
      <View style={[styles.daySelector, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
        >
          {itineraryData.map((day) => {
            const isSelected = selectedDay === day.day;
            return (
              <TouchableOpacity
                key={day.day}
                onPress={() => setSelectedDay(day.day)}
                style={[
                  styles.dayTab,
                  isSelected && { backgroundColor: theme.accent },
                  !isSelected && { backgroundColor: 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.dayTabText,
                    { color: isSelected ? '#ffffff' : theme.textSecondary },
                  ]}
                >
                  Day {day.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
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
        {/* Day Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.dayTitle, { color: theme.textPrimary }]}>
            {mergedDayData.title}
          </Text>
          <View style={styles.dateRow}>
            <FontAwesome name="calendar" size={14} color={theme.accent} />
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {mergedDayData.date}
            </Text>
          </View>
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Overview
          </Text>
          <Text style={[styles.overviewText, { color: theme.textSecondary }]}>
            {mergedDayData.description}
          </Text>
        </View>

        {/* Route Info Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Route Info
          </Text>

          <View style={styles.routeGrid}>
            <View style={styles.routeItem}>
              <Text style={[styles.routeLabel, { color: theme.textMuted }]}>
                START POINT
              </Text>
              <Text style={[styles.routeValue, { color: theme.textPrimary }]}>
                {mergedDayData.startPoint}
              </Text>
            </View>
            <View style={styles.routeItem}>
              <Text style={[styles.routeLabel, { color: theme.textMuted }]}>
                END POINT
              </Text>
              <Text style={[styles.routeValue, { color: theme.textPrimary }]}>
                {mergedDayData.endPoint}
              </Text>
            </View>
            <View style={styles.routeItem}>
              <Text style={[styles.routeLabel, { color: theme.textMuted }]}>
                DISTANCE
              </Text>
              <Text style={[styles.routeValue, { color: theme.textPrimary }]}>
                {mergedDayData.miles > 0 ? `${mergedDayData.miles} miles` : 'N/A'}
              </Text>
            </View>
            <View style={styles.routeItem}>
              <Text style={[styles.routeLabel, { color: theme.textMuted }]}>
                EST. TIME
              </Text>
              <Text style={[styles.routeValue, { color: theme.textPrimary }]}>
                {mergedDayData.ridingTime}
              </Text>
            </View>
          </View>

          {mergedDayData.miles > 0 && (
            <TouchableOpacity
              onPress={() => openMaps(
                `https://www.google.com/maps/dir/${mergedDayData.coordinates.start[0]},${mergedDayData.coordinates.start[1]}/${mergedDayData.coordinates.end[0]},${mergedDayData.coordinates.end[1]}`
              )}
              style={[styles.mapsButton, { backgroundColor: theme.accent }]}
            >
              <FontAwesome name="map-marker" size={16} color="#ffffff" />
              <Text style={styles.mapsButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Key Highlights */}
        {mergedDayData.pointsOfInterest.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Key Highlights
            </Text>
            <View style={styles.highlightsRow}>
              {mergedDayData.pointsOfInterest.slice(0, 4).map((poi, idx) => (
                <View
                  key={idx}
                  style={[styles.highlightChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                >
                  <Text style={[styles.highlightText, { color: theme.textSecondary }]}>
                    {poi}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Accommodation Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <FontAwesome name="bed" size={16} color={theme.warning} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary, marginLeft: spacing.sm }]}>
              Tonight's Stay
            </Text>
          </View>

          <Text style={[styles.accommodationName, { color: theme.textPrimary }]}>
            {mergedDayData.accommodation}
          </Text>

          {nightConfig?.hotelAddress && (
            <TouchableOpacity
              onPress={() => openMaps(
                nightConfig?.hotelMapsLink ||
                `https://maps.google.com/?q=${encodeURIComponent(nightConfig.hotelAddress!)}`
              )}
              style={styles.addressRow}
            >
              <FontAwesome name="map-marker" size={14} color={theme.accent} />
              <Text style={[styles.addressText, { color: theme.accent }]}>
                {nightConfig.hotelAddress}
              </Text>
            </TouchableOpacity>
          )}

          {nightConfig?.hotelPhone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${nightConfig.hotelPhone}`)}
              style={styles.phoneRow}
            >
              <FontAwesome name="phone" size={14} color={theme.success} />
              <Text style={[styles.phoneText, { color: theme.success }]}>
                {nightConfig.hotelPhone}
              </Text>
            </TouchableOpacity>
          )}

          {/* User's Selection */}
          {userNightSelection && (
            <View style={[styles.selectionBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.selectionLabel, { color: theme.textMuted }]}>
                YOUR SELECTION
              </Text>
              <Text style={[styles.selectionValue, { color: theme.textPrimary }]}>
                {userNightSelection.accommodation || 'Not selected'}
                {userNightSelection.assignedRoom && ` • Room ${userNightSelection.assignedRoom}`}
              </Text>
            </View>
          )}
        </View>

        {/* Route Files Card */}
        {nightConfig?.routeLinks && (nightConfig.routeLinks as Array<{ name: string; url: string; type?: string }>).length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.cardHeader}>
              <FontAwesome name="file" size={16} color={theme.info} />
              <Text style={[styles.cardTitle, { color: theme.textPrimary, marginLeft: spacing.sm }]}>
                Route Files
              </Text>
            </View>

            {(nightConfig.routeLinks as Array<{ name: string; url: string; type?: string }>).map((link, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => Linking.openURL(link.url)}
                style={[styles.fileRow, { borderBottomColor: theme.cardBorder }]}
              >
                <FontAwesome
                  name={link.type === 'gpx' ? 'map-marker' : link.type === 'pdf' ? 'file-pdf-o' : 'link'}
                  size={16}
                  color={theme.accent}
                />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.textPrimary }]}>{link.name}</Text>
                  <Text style={[styles.fileType, { color: theme.textMuted }]}>
                    {link.type?.toUpperCase() || 'LINK'}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
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
  daySelector: {
    borderBottomWidth: 1,
  },
  daySelectorContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dayTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  dayTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  routeItem: {
    width: '50%',
    marginBottom: spacing.md,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  mapsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  highlightChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  highlightText: {
    fontSize: 13,
  },
  accommodationName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  phoneText: {
    fontSize: 14,
  },
  selectionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  selectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileType: {
    fontSize: 11,
    marginTop: 2,
  },
});
