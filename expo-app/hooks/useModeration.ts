/**
 * Moderation hook for reporting content and blocking users
 * Implements Apple App Store requirements for user-generated content
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_USERS_CACHE_KEY = 'blocked_users_cache';

export interface ContentReport {
  contentType: 'media' | 'post' | 'comment' | 'profile';
  contentId: string;
  contentOwnerId: string;
  reason: string;
  additionalInfo?: string;
  reportedAt: any;
  reportedBy: string;
  reporterEmail?: string;
  status: 'pending' | 'reviewed' | 'actioned';
  contentSnapshot?: any;
}

export function useModeration() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load blocked users on mount
  useEffect(() => {
    if (user?.uid) {
      loadBlockedUsers();
    } else {
      setBlockedUsers([]);
      setLoading(false);
    }
  }, [user?.uid]);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Try cache first
      const cached = await AsyncStorage.getItem(BLOCKED_USERS_CACHE_KEY);
      if (cached) {
        setBlockedUsers(JSON.parse(cached));
      }

      // Fetch from Firestore
      const blockedRef = collection(db, 'users', user.uid, 'blockedUsers');
      const snapshot = await getDocs(blockedRef);
      const blocked = snapshot.docs.map(doc => doc.id);

      setBlockedUsers(blocked);
      await AsyncStorage.setItem(BLOCKED_USERS_CACHE_KEY, JSON.stringify(blocked));
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const blockUser = useCallback(async (
    userId: string,
    userName: string,
    reason?: string
  ): Promise<boolean> => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to block users.');
      return false;
    }

    if (userId === user.uid) {
      Alert.alert('Error', 'You cannot block yourself.');
      return false;
    }

    try {
      // Add to blocked users subcollection
      const blockedRef = doc(db, 'users', user.uid, 'blockedUsers', userId);
      await setDoc(blockedRef, {
        blockedAt: serverTimestamp(),
        userName: userName,
        reason: reason || 'User blocked',
      });

      // Also create a report for admin visibility
      await addDoc(collection(db, 'contentReports'), {
        contentType: 'profile',
        contentId: userId,
        contentOwnerId: userId,
        reason: 'User blocked',
        additionalInfo: reason,
        reportedAt: serverTimestamp(),
        reportedBy: user.uid,
        reporterEmail: user.email,
        status: 'pending',
        isBlockReport: true,
      });

      // Update local state
      setBlockedUsers(prev => [...prev, userId]);
      await AsyncStorage.setItem(
        BLOCKED_USERS_CACHE_KEY,
        JSON.stringify([...blockedUsers, userId])
      );

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
      return false;
    }
  }, [user?.uid, user?.email, blockedUsers]);

  const unblockUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const blockedRef = doc(db, 'users', user.uid, 'blockedUsers', userId);
      await deleteDoc(blockedRef);

      // Update local state
      const newBlocked = blockedUsers.filter(id => id !== userId);
      setBlockedUsers(newBlocked);
      await AsyncStorage.setItem(BLOCKED_USERS_CACHE_KEY, JSON.stringify(newBlocked));

      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user. Please try again.');
      return false;
    }
  }, [user?.uid, blockedUsers]);

  const reportContent = useCallback(async (
    contentType: ContentReport['contentType'],
    contentId: string,
    contentOwnerId: string,
    reason: string,
    additionalInfo?: string,
    contentSnapshot?: any
  ): Promise<boolean> => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to report content.');
      return false;
    }

    try {
      // Create report (duplicate check removed - Firestore index not needed)
      const reportsRef = collection(db, 'contentReports');
      await addDoc(reportsRef, {
        contentType,
        contentId,
        contentOwnerId,
        reason,
        additionalInfo: additionalInfo || null,
        reportedAt: serverTimestamp(),
        reportedBy: user.uid,
        reporterEmail: user.email,
        status: 'pending',
        contentSnapshot: contentSnapshot || null,
      });

      return true;
    } catch (error) {
      console.error('Error reporting content:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      return false;
    }
  }, [user?.uid, user?.email]);

  const isBlocked = useCallback((userId: string): boolean => {
    return blockedUsers.includes(userId);
  }, [blockedUsers]);

  // Filter function to remove blocked users' content
  const filterBlockedContent = useCallback(<T extends { uploadedBy?: string; authorId?: string; userId?: string }>(
    items: T[]
  ): T[] => {
    if (blockedUsers.length === 0) return items;

    return items.filter(item => {
      const ownerId = item.uploadedBy || item.authorId || item.userId;
      return !ownerId || !blockedUsers.includes(ownerId);
    });
  }, [blockedUsers]);

  return {
    blockedUsers,
    loading,
    blockUser,
    unblockUser,
    reportContent,
    isBlocked,
    filterBlockedContent,
    refreshBlockedUsers: loadBlockedUsers,
  };
}

export const REPORT_REASONS = [
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'spam', label: 'Spam or misleading' },
  { key: 'violence', label: 'Violence or dangerous content' },
  { key: 'hate', label: 'Hate speech' },
  { key: 'privacy', label: 'Privacy violation' },
  { key: 'other', label: 'Other' },
];
