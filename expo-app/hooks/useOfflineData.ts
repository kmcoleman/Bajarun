/**
 * Hook for accessing offline-capable data.
 * Syncs from Firestore when online and returns cached data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  syncAllData,
  getCachedRoster,
  getCachedEventConfig,
  getCachedUserSelections,
  getCachedUserProfile,
  getCachedAnnouncements,
  getCachedRiderDocuments,
  Participant,
  UserSelections,
  Announcement,
  EventConfig,
  RiderDocuments,
} from '../lib/sync';

interface OfflineDataState {
  roster: Participant[];
  eventConfig: EventConfig | null;
  userSelections: UserSelections | null;
  userProfile: Participant | null;
  announcements: Announcement[];
  riderDocuments: RiderDocuments | null;
  loading: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
}

export function useOfflineData(userId: string | null) {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<OfflineDataState>({
    roster: [],
    eventConfig: null,
    userSelections: null,
    userProfile: null,
    announcements: [],
    riderDocuments: null,
    loading: true,
    syncing: false,
    lastSyncAt: null,
    error: null,
  });

  // Load cached data from AsyncStorage
  const loadCachedData = useCallback(async () => {
    try {
      const [roster, eventConfig, userSelections, userProfile, announcements, riderDocuments] =
        await Promise.all([
          getCachedRoster(),
          getCachedEventConfig(),
          getCachedUserSelections(),
          getCachedUserProfile(),
          getCachedAnnouncements(),
          getCachedRiderDocuments(),
        ]);

      setState((prev) => ({
        ...prev,
        roster,
        eventConfig,
        userSelections,
        userProfile,
        announcements,
        riderDocuments,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading cached data:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load cached data',
      }));
    }
  }, []);

  // Sync data from Firestore
  const sync = useCallback(
    async (force = false) => {
      if (!userId || !isOnline) return;

      setState((prev) => ({ ...prev, syncing: true, error: null }));

      try {
        await syncAllData(userId, force);
        await loadCachedData();
        setState((prev) => ({
          ...prev,
          syncing: false,
          lastSyncAt: Date.now(),
        }));
      } catch (error) {
        console.error('Sync error:', error);
        setState((prev) => ({
          ...prev,
          syncing: false,
          error: 'Failed to sync data',
        }));
      }
    },
    [userId, isOnline, loadCachedData]
  );

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // Sync when user is authenticated and online
  useEffect(() => {
    if (userId && isOnline) {
      sync();
    }
  }, [userId, isOnline, sync]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return sync(true);
  }, [sync]);

  return {
    ...state,
    refresh,
    isOnline,
  };
}
