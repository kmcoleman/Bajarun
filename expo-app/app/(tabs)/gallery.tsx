/**
 * Photo/Video Gallery - Tour media shared by riders
 * Based on Stitch mockup: photo/video_gallery
 * Optimized with caching and FlatList pagination
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import AlertsDropdown from '../../components/AlertsDropdown';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import * as Haptics from '../../lib/haptics';
import * as FileSystem from 'expo-file-system';
import ImageViewing from 'react-native-image-viewing';
import { useModeration } from '../../hooks/useModeration';
import ReportBlockModal from '../../components/ReportBlockModal';

// Lazy load MediaLibrary to avoid crash if native module not available
let MediaLibrary: typeof import('expo-media-library') | null = null;
try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  console.log('MediaLibrary not available - save feature disabled');
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - COLUMN_GAP) / NUM_COLUMNS;

// Pagination settings
const PAGE_SIZE = 20;
const CACHE_KEY = 'gallery_cache_bajarun2026';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface MediaItem {
  id: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderPhotoUrl?: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  day?: number;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  duration?: number;
}

interface CachedData {
  items: MediaItem[];
  timestamp: number;
}

const FILTER_OPTIONS = ['All Media', 'Photos', 'Videos', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

export default function GalleryPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('All Media');
  const [hasMore, setHasMore] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedMediaForReport, setSelectedMediaForReport] = useState<MediaItem | null>(null);

  // Moderation hook for blocking/reporting
  const { filterBlockedContent, isBlocked } = useModeration();

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const isFirstLoad = useRef(true);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  // Refresh when screen is focused (but use cache if fresh)
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }
      // On subsequent focuses, check if cache is stale
      checkAndRefresh();
    }, [])
  );

  async function loadCachedData() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < CACHE_EXPIRY && data.items.length > 0) {
          // Convert date strings back to Date objects and deduplicate
          const seen = new Set<string>();
          const items = data.items
            .map(item => ({
              ...item,
              createdAt: new Date(item.createdAt),
            }))
            .filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
          setMediaItems(items);
          setLoading(false);
          console.log('Gallery: loaded', items.length, 'items from cache');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }

    // No cache or stale, fetch fresh
    fetchMedia(true);
  }

  async function checkAndRefresh() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedData = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < CACHE_EXPIRY) {
          // Cache is fresh, no need to refresh
          return;
        }
      }
    } catch (error) {
      console.error('Error checking cache:', error);
    }

    // Cache is stale, refresh in background
    fetchMedia(true);
  }

  async function saveToCache(items: MediaItem[]) {
    try {
      const data: CachedData = {
        items,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  async function fetchMedia(reset: boolean = false) {
    if (reset) {
      setLoading(true);
      lastDocRef.current = null;
      setHasMore(true);
    }

    try {
      const mediaRef = collection(db, 'events', 'bajarun2026', 'media');

      // Build query with pagination
      let q = query(
        mediaRef,
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDocRef.current) {
        q = query(
          mediaRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      console.log('Gallery: fetched', snapshot.size, 'media items', reset ? '(reset)' : '(more)');

      if (snapshot.empty) {
        if (reset) {
          setMediaItems([]);
        }
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Update last doc for pagination
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];

      // Check if there might be more
      setHasMore(snapshot.size === PAGE_SIZE);

      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uploadedBy: data.uploadedBy || '',
          uploaderName: data.uploaderName || 'Unknown',
          uploaderPhotoUrl: data.uploaderPhotoUrl,
          type: data.type || 'photo',
          url: data.url || '',
          thumbnailUrl: data.thumbnailUrl,
          caption: data.caption,
          day: data.day,
          createdAt: data.createdAt?.toDate() || new Date(),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          duration: data.duration,
        } as MediaItem;
      });

      if (reset) {
        setMediaItems(items);
        saveToCache(items);
      } else {
        setMediaItems(prev => {
          // Deduplicate by id
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewItems = items.filter(item => !existingIds.has(item.id));
          const newItems = [...prev, ...uniqueNewItems];
          saveToCache(newItems);
          return newItems;
        });
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchMedia(true);
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await fetchMedia(false);
  }

  async function handleLike(item: MediaItem) {
    if (!user?.uid) return;

    const isLiked = item.likedBy.includes(user.uid);
    Haptics.lightTap();

    // Optimistic update
    setMediaItems(prev => prev.map(m => {
      if (m.id === item.id) {
        return {
          ...m,
          likes: isLiked ? m.likes - 1 : m.likes + 1,
          likedBy: isLiked
            ? m.likedBy.filter(id => id !== user.uid)
            : [...m.likedBy, user.uid],
        };
      }
      return m;
    }));

    // Update Firestore
    try {
      const mediaRef = doc(db, 'events', 'bajarun2026', 'media', item.id);
      await updateDoc(mediaRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert optimistic update on error
      setMediaItems(prev => prev.map(m => {
        if (m.id === item.id) {
          return {
            ...m,
            likes: isLiked ? m.likes + 1 : m.likes - 1,
            likedBy: isLiked
              ? [...m.likedBy, user.uid]
              : m.likedBy.filter(id => id !== user.uid),
          };
        }
        return m;
      }));
    }
  }

  // Filter media based on active filter and blocked users
  const filteredMedia = useMemo(() => {
    // First filter out blocked users' content
    const unblockedMedia = filterBlockedContent(mediaItems);

    // Then apply the active filter
    return unblockedMedia.filter(item => {
      switch (activeFilter) {
        case 'Photos':
          return item.type === 'photo';
        case 'Videos':
          return item.type === 'video';
        case 'Day 1':
          return item.day === 1;
        case 'Day 2':
          return item.day === 2;
        case 'Day 3':
          return item.day === 3;
        case 'Day 4':
          return item.day === 4;
        case 'Day 5':
          return item.day === 5;
        default:
          return true;
      }
    });
  }, [mediaItems, activeFilter, filterBlockedContent]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return days === 1 ? 'Yesterday' : `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get only photos for the image viewer
  const photoItems = useMemo(() =>
    filteredMedia.filter(item => item.type === 'photo'),
    [filteredMedia]
  );

  const openImageViewer = useCallback((item: MediaItem) => {
    // Find index in photos array (not full filtered media)
    const index = photoItems.findIndex(m => m.id === item.id);
    if (index !== -1) {
      setViewerIndex(index);
      setViewerVisible(true);
      Haptics.lightTap();
    }
  }, [photoItems]);

  const saveCurrentImage = async () => {
    if (saving) return;

    // Check if MediaLibrary is available
    if (!MediaLibrary) {
      Alert.alert(
        'Rebuild Required',
        'Photo saving requires a new app build. Run: npx expo run:ios'
      );
      return;
    }

    const currentPhoto = photoItems[viewerIndex];
    if (!currentPhoto) return;

    try {
      setSaving(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save photos to your library.');
        return;
      }

      // Download image to local file
      const filename = `baja_${currentPhoto.id}_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(currentPhoto.url, fileUri);

      // Save to media library
      await MediaLibrary!.saveToLibraryAsync(downloadResult.uri);

      Haptics.success();
      Alert.alert('Saved!', 'Photo saved to your library.');

      // Clean up temp file
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    } catch (error) {
      console.error('Error saving image:', error);
      Haptics.error();
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const ImageViewerFooter = useCallback(({ imageIndex }: { imageIndex: number }) => {
    const photo = photoItems[imageIndex];
    return (
      <View style={styles.viewerFooter}>
        <View style={styles.viewerFooterInfo}>
          <Text style={styles.viewerFooterName}>{photo?.uploaderName || 'Unknown'}</Text>
          {photo?.caption && (
            <Text style={styles.viewerFooterCaption} numberOfLines={2}>{photo.caption}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveCurrentImage}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <FontAwesome name="download" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    );
  }, [photoItems, saving, saveCurrentImage]);

  const handleOpenReportModal = useCallback((item: MediaItem) => {
    setSelectedMediaForReport(item);
    setReportModalVisible(true);
    Haptics.lightTap();
  }, []);

  const renderMediaItem = useCallback(({ item, index }: { item: MediaItem; index: number }) => {
    const isLiked = user?.uid && item.likedBy.includes(user.uid);
    const isOwnContent = user?.uid === item.uploadedBy;
    // Vary aspect ratio for visual interest
    const aspectRatio = item.type === 'video' ? 16/9 : (index % 3 === 0 ? 3/4 : 1);

    return (
      <TouchableOpacity
        style={[styles.mediaCard, { backgroundColor: theme.card, width: ITEM_WIDTH }]}
        activeOpacity={0.9}
        onPress={() => item.type === 'photo' && openImageViewer(item)}
      >
        {/* Media Thumbnail - use thumbnailUrl if available for bandwidth savings */}
        <View style={{ aspectRatio }}>
          <Image
            source={{ uri: item.thumbnailUrl || item.url }}
            style={styles.mediaThumbnail}
            resizeMode="cover"
          />

          {/* Video Play Button */}
          {item.type === 'video' && (
            <>
              <View style={styles.videoOverlay}>
                <View style={styles.playButton}>
                  <FontAwesome name="play" size={16} color="#ffffff" />
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(item.duration || 0)}</Text>
              </View>
            </>
          )}

          {/* Photo indicator */}
          {item.type === 'photo' && (
            <View style={styles.typeIndicator}>
              <FontAwesome name="camera" size={12} color="#ffffff" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.mediaContent}>
          {/* User info */}
          <View style={styles.userRow}>
            {item.uploaderPhotoUrl ? (
              <Image source={{ uri: item.uploaderPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>{getInitials(item.uploaderName)}</Text>
              </View>
            )}
            <Text style={[styles.uploaderName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.uploaderName}
            </Text>
          </View>

          {/* Caption */}
          {item.caption && (
            <Text style={[styles.caption, { color: theme.textMuted }]} numberOfLines={2}>
              {item.caption}
            </Text>
          )}

          {/* Footer */}
          <View style={styles.mediaFooter}>
            <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item)}>
              <FontAwesome
                name={isLiked ? 'heart' : 'heart-o'}
                size={14}
                color={isLiked ? theme.danger : theme.textMuted}
              />
              <Text style={[styles.likeCount, { color: isLiked ? theme.danger : theme.textMuted }]}>
                {item.likes}
              </Text>
            </TouchableOpacity>
            <View style={styles.footerRight}>
              <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                {formatTimeAgo(item.createdAt)}
              </Text>
              {!isOwnContent && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => handleOpenReportModal(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="ellipsis-h" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [user?.uid, theme, handleLike, handleOpenReportModal]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <FontAwesome name="camera" size={32} color={theme.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Media Yet</Text>
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>
        Be the first to share a photo or video from the trip!
      </Text>
    </View>
  );

  // For masonry layout, we need to split into columns
  const leftColumn = useMemo(() => filteredMedia.filter((_, i) => i % 2 === 0), [filteredMedia]);
  const rightColumn = useMemo(() => filteredMedia.filter((_, i) => i % 2 === 1), [filteredMedia]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.tourName, { color: theme.accent }]}>Baja Run 2026</Text>
          <Text style={[styles.tourDetails, { color: theme.textMuted }]}>Mar 19 - Mar 27</Text>
        </View>
        <AlertsDropdown />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === filter ? theme.accent : theme.card,
                borderColor: activeFilter === filter ? theme.accent : theme.cardBorder,
              },
            ]}
            onPress={() => {
              Haptics.selectionChanged();
              setActiveFilter(filter);
            }}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === filter ? '#ffffff' : theme.textSecondary },
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading gallery...</Text>
        </View>
      ) : (
        <FlatList
          data={[{ key: 'masonry' }]}
          renderItem={() => (
            filteredMedia.length === 0 ? (
              renderEmpty()
            ) : (
              <View style={styles.masonryContainer}>
                <View style={styles.masonryColumn}>
                  {leftColumn.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {renderMediaItem({ item, index: idx * 2 })}
                    </React.Fragment>
                  ))}
                </View>
                <View style={styles.masonryColumn}>
                  {rightColumn.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {renderMediaItem({ item, index: idx * 2 + 1 })}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )
          )}
          keyExtractor={() => 'masonry'}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.accent} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => {
          Haptics.mediumTap();
          router.push('/upload-media');
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Full-screen Image Viewer */}
      <ImageViewing
        images={photoItems.map(item => ({ uri: item.url }))}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        onImageIndexChange={setViewerIndex}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        FooterComponent={ImageViewerFooter}
      />

      {/* Report/Block Modal */}
      {selectedMediaForReport && (
        <ReportBlockModal
          visible={reportModalVisible}
          onClose={() => {
            setReportModalVisible(false);
            setSelectedMediaForReport(null);
          }}
          contentType="media"
          contentId={selectedMediaForReport.id}
          contentOwnerId={selectedMediaForReport.uploadedBy}
          contentOwnerName={selectedMediaForReport.uploaderName}
          contentSnapshot={{
            url: selectedMediaForReport.url,
            caption: selectedMediaForReport.caption,
            type: selectedMediaForReport.type,
          }}
        />
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  tourName: {
    fontSize: 20,
    fontWeight: '700',
  },
  tourDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  filterContainer: {
    maxHeight: 48,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },
  masonryColumn: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  mediaCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  typeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.full,
    padding: 6,
  },
  mediaContent: {
    padding: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  uploaderName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  caption: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  mediaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    padding: 4,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 10,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  viewerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing['3xl'],
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewerFooterInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  viewerFooterName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewerFooterCaption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
