/**
 * Upload Media - Add photos and videos to the tour gallery
 * Based on Stitch mockup: upload_media_&_tag_day
 * Integrated with Firebase Storage and Firestore
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as Haptics from '../lib/haptics';

interface SelectedMedia {
  uri: string;
  type: 'photo' | 'video';
  fileName: string;
  uploading: boolean;
  progress: number;
  uploaded: boolean;
  error?: string;
}

const DAY_OPTIONS = [
  { key: 'pre', label: 'Pre-Ride', day: 0 },
  { key: 'day1', label: 'Day 1', day: 1 },
  { key: 'day2', label: 'Day 2', day: 2 },
  { key: 'day3', label: 'Day 3', day: 3 },
  { key: 'day4', label: 'Day 4', day: 4 },
  { key: 'day5', label: 'Day 5', day: 5 },
  { key: 'day6', label: 'Day 6', day: 6 },
  { key: 'day7', label: 'Day 7', day: 7 },
  { key: 'day8', label: 'Day 8', day: 8 },
];

export default function UploadMediaPage() {
  const { user, registration } = useAuth();
  const { theme } = useTheme();

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('day1');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    Haptics.lightTap();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newMedia: SelectedMedia[] = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'photo',
        fileName: asset.fileName || `media_${Date.now()}`,
        uploading: false,
        progress: 0,
        uploaded: false,
      }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (media: SelectedMedia, index: number): Promise<string | null> => {
    try {
      // Update progress
      setSelectedMedia(prev => prev.map((m, i) =>
        i === index ? { ...m, uploading: true, progress: 0 } : m
      ));

      // Fetch the file
      const response = await fetch(media.uri);
      const blob = await response.blob();

      // Create storage reference
      const extension = media.type === 'video' ? 'mp4' : 'jpg';
      const fileName = `${user?.uid}_${Date.now()}_${index}.${extension}`;
      const storageRef = ref(storage, `gallery/bajarun2026/${fileName}`);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setSelectedMedia(prev => prev.map((m, i) =>
              i === index ? { ...m, progress } : m
            ));
          },
          (error) => {
            console.error('Upload error:', error);
            setSelectedMedia(prev => prev.map((m, i) =>
              i === index ? { ...m, uploading: false, error: 'Upload failed' } : m
            ));
            reject(error);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setSelectedMedia(prev => prev.map((m, i) =>
              i === index ? { ...m, uploading: false, uploaded: true, progress: 100 } : m
            ));
            resolve(downloadUrl);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      setSelectedMedia(prev => prev.map((m, i) =>
        i === index ? { ...m, uploading: false, error: 'Upload failed' } : m
      ));
      return null;
    }
  };

  const handleUpload = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media Selected', 'Please select at least one photo or video to upload.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to upload media.');
      return;
    }

    setUploading(true);

    try {
      const dayOption = DAY_OPTIONS.find(d => d.key === selectedDay);
      const uploaderName = registration?.nickname || registration?.fullName || user.displayName || 'Anonymous';
      let successCount = 0;

      console.log('Starting upload for', selectedMedia.length, 'files');

      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        if (media.uploaded) {
          successCount++;
          continue;
        }

        console.log('Uploading file', i + 1, ':', media.fileName);
        const downloadUrl = await uploadSingleFile(media, i);

        if (downloadUrl) {
          console.log('File uploaded to Storage, saving metadata to Firestore');
          // Save metadata to Firestore
          const docRef = await addDoc(collection(db, 'events', 'bajarun2026', 'media'), {
            uploadedBy: user.uid,
            uploaderName: uploaderName,
            uploaderPhotoUrl: registration?.headshotUrl || user.photoURL || null,
            type: media.type,
            url: downloadUrl,
            caption: caption || null,
            day: dayOption?.day || null,
            createdAt: serverTimestamp(),
            likes: 0,
            likedBy: [],
          });
          console.log('Media saved to Firestore with ID:', docRef.id);
          successCount++;
        }
      }

      console.log('Upload complete. Success count:', successCount);
      Haptics.success();
      Alert.alert(
        'Upload Complete',
        `Successfully uploaded ${successCount} ${successCount === 1 ? 'file' : 'files'} to the gallery.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error during upload:', error);
      Haptics.error();
      Alert.alert('Upload Error', 'Some files failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const totalProgress = selectedMedia.length > 0
    ? selectedMedia.reduce((acc, m) => acc + m.progress, 0) / selectedMedia.length
    : 0;

  const uploadedCount = selectedMedia.filter(m => m.uploaded).length;
  const uploadingCount = selectedMedia.filter(m => m.uploading).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <FontAwesome name="times" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Add Memories</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Add Media Button */}
        <TouchableOpacity
          style={[styles.addMediaCard, { backgroundColor: theme.card, borderColor: theme.accent + '50' }]}
          onPress={pickMedia}
        >
          <View style={[styles.addMediaIcon, { backgroundColor: theme.accent + '20' }]}>
            <FontAwesome name="camera" size={24} color={theme.accent} />
          </View>
          <View style={styles.addMediaText}>
            <Text style={[styles.addMediaTitle, { color: theme.textPrimary }]}>Add photos or videos</Text>
            <Text style={[styles.addMediaSubtitle, { color: theme.textMuted }]}>JPG, PNG, MP4</Text>
          </View>
        </TouchableOpacity>

        {/* Upload Progress */}
        {selectedMedia.length > 0 && (uploadingCount > 0 || uploadedCount > 0) && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
                {uploadingCount > 0 ? `Uploading (${uploadedCount}/${selectedMedia.length})` : 'Ready to upload'}
              </Text>
              <Text style={[styles.progressPercent, { color: theme.accent }]}>{Math.round(totalProgress)}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
              <View style={[styles.progressBar, { backgroundColor: theme.accent, width: `${totalProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Selected Media List */}
        {selectedMedia.length > 0 && (
          <View style={styles.mediaList}>
            {selectedMedia.map((media, index) => (
              <View
                key={index}
                style={[
                  styles.mediaItem,
                  {
                    backgroundColor: theme.card,
                    borderColor: media.uploading ? theme.accent + '30' : theme.cardBorder,
                  },
                ]}
              >
                {/* Status indicator */}
                {media.uploaded && <View style={[styles.statusIndicator, { backgroundColor: theme.success }]} />}
                {media.error && <View style={[styles.statusIndicator, { backgroundColor: theme.danger }]} />}

                {/* Thumbnail */}
                <View style={styles.mediaThumbnail}>
                  <Image source={{ uri: media.uri }} style={styles.thumbnailImage} />
                  {media.uploading && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                  {media.uploaded && (
                    <View style={styles.uploadedOverlay}>
                      <FontAwesome name="check" size={16} color="#ffffff" />
                    </View>
                  )}
                </View>

                {/* File info */}
                <View style={styles.mediaInfo}>
                  <Text style={[styles.mediaFileName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {media.fileName}
                  </Text>
                  {media.uploading && (
                    <View style={styles.itemProgressContainer}>
                      <View style={[styles.itemProgressTrack, { backgroundColor: theme.cardBorder }]}>
                        <View style={[styles.itemProgressBar, { backgroundColor: theme.accent, width: `${media.progress}%` }]} />
                      </View>
                      <Text style={[styles.itemProgressText, { color: theme.textMuted }]}>{Math.round(media.progress)}%</Text>
                    </View>
                  )}
                  {media.uploaded && (
                    <Text style={[styles.mediaStatus, { color: theme.success }]}>Uploaded</Text>
                  )}
                  {media.error && (
                    <Text style={[styles.mediaStatus, { color: theme.danger }]}>{media.error}</Text>
                  )}
                  {!media.uploading && !media.uploaded && !media.error && (
                    <Text style={[styles.mediaStatus, { color: theme.textMuted }]}>
                      {media.type === 'video' ? 'Video' : 'Photo'}
                    </Text>
                  )}
                </View>

                {/* Remove button */}
                {!media.uploading && !media.uploaded && (
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeMedia(index)}>
                    <FontAwesome name="times" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Day Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="calendar" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Which day was this?</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
            {DAY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: selectedDay === option.key ? theme.accent : theme.card,
                    borderColor: selectedDay === option.key ? theme.accent : theme.cardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionChanged();
                  setSelectedDay(option.key);
                }}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    { color: selectedDay === option.key ? '#ffffff' : theme.textSecondary },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="edit" size={18} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Add a caption</Text>
            <Text style={[styles.optionalLabel, { color: theme.textMuted }]}>(Optional)</Text>
          </View>

          <TextInput
            style={[
              styles.captionInput,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                color: theme.textPrimary,
              },
            ]}
            placeholder="Briefly describe this moment..."
            placeholderTextColor={theme.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
          <FontAwesome name="info-circle" size={16} color={theme.accent} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Media uploaded here will be shared with the group gallery. Make sure you have permission to post.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            {
              backgroundColor: selectedMedia.length > 0 && !uploading ? theme.accent : theme.cardBorder,
            },
          ]}
          onPress={handleUpload}
          disabled={selectedMedia.length === 0 || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <FontAwesome name="cloud-upload" size={18} color={selectedMedia.length > 0 ? '#ffffff' : theme.textMuted} />
              <Text
                style={[
                  styles.uploadButtonText,
                  { color: selectedMedia.length > 0 ? '#ffffff' : theme.textMuted },
                ]}
              >
                Upload Media
              </Text>
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
  closeButton: {
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
  addMediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  addMediaIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaText: {
    flex: 1,
  },
  addMediaTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addMediaSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  mediaList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  mediaThumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    flex: 1,
  },
  mediaFileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  itemProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  itemProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  itemProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  itemProgressText: {
    fontSize: 10,
    fontWeight: '600',
    minWidth: 30,
  },
  removeButton: {
    padding: spacing.sm,
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
    fontSize: 16,
    fontWeight: '700',
  },
  optionalLabel: {
    fontSize: 14,
  },
  daySelector: {
    flexDirection: 'row',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  dayChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
