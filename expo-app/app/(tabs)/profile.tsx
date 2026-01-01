/**
 * Profile page - User's registration info and documents.
 * Redesigned to match Stitch mockups with dark theme.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { openDocument, cacheAllDocuments, getDocumentCacheStatus } from '../../lib/documents';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import AlertsDropdown from '../../components/AlertsDropdown';
import {
  updateUserProfile,
  pickDocument,
  pickImage,
  uploadDocument,
  uploadProfilePhoto,
  deleteDocument,
} from '../../lib/profile';
import * as Haptics from '../../lib/haptics';

// All document types
const DOCUMENT_CONFIG = {
  driversLicense: { label: "Driver's License", icon: 'id-card' },
  passport: { label: 'Passport', icon: 'book' },
  fmmCard: { label: 'FMM Card', icon: 'file-text' },
  fmmPaymentReceipt: { label: 'FMM Receipt', icon: 'file' },
  mexicoInsurance: { label: 'Mexico Insurance', icon: 'shield' },
  americanInsurance: { label: 'US Insurance', icon: 'car' },
} as const;

type DocumentType = keyof typeof DOCUMENT_CONFIG;

export default function ProfilePage() {
  const { user, signOut, isAuthenticated, loading: authLoading } = useAuth();
  const { userProfile, riderDocuments, loading, refresh } = useOfflineData(user?.uid || null);
  const [cacheStatus, setCacheStatus] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { theme, isDark, themePreference, setThemePreference } = useTheme();

  // Edit mode states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Info menu expansion state
  const [infoExpanded, setInfoExpanded] = useState(false);

  // Account deletion state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Cache documents and track status
  useEffect(() => {
    if (riderDocuments) {
      cacheAllDocuments(riderDocuments).then(() => {
        getDocumentCacheStatus().then(setCacheStatus);
      });
    }
  }, [riderDocuments]);

  // Redirect to login screen when not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  // Initialize edit form values when modal opens
  const openEditModal = () => {
    Haptics.lightTap();
    setEditPhone(userProfile?.odPhone || '');
    setEditEmail(userProfile?.odEmail || '');
    setEditEmergencyName(userProfile?.odEmergencyContactName || '');
    setEditEmergencyPhone(userProfile?.odEmergencyContactPhone || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const success = await updateUserProfile(user.uid, {
        phone: editPhone,
        email: editEmail,
        emergencyName: editEmergencyName,
        emergencyPhone: editEmergencyPhone,
      });

      if (success) {
        Alert.alert('Success', 'Your profile has been updated.');
        setEditModalVisible(false);
        // Refresh data from server
        refresh();
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) return;

    setDeletingAccount(true);

    try {
      // Try to get Apple authorization code for token revocation
      let appleAuthorizationCode: string | undefined;

      // Check if user signed in with Apple
      const providerData = user.providerData || [];
      const isAppleUser = providerData.some(p => p.providerId === 'apple.com');

      if (isAppleUser) {
        try {
          // Re-authenticate with Apple to get fresh authorization code
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          appleAuthorizationCode = credential.authorizationCode || undefined;
        } catch (appleError) {
          // User cancelled or Apple auth failed - continue without revocation
          console.log('Apple re-auth failed, continuing without token revocation');
        }
      }

      // Call Cloud Function to delete account
      const deleteAccountFn = httpsCallable(functions, 'deleteAccount');
      await deleteAccountFn({
        appleAuthorizationCode,
      });

      // Sign out locally
      await signOut();

      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Account deletion error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to delete account. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setDeletingAccount(false);
      setDeleteModalVisible(false);
    }
  };

  const handleViewDocument = async (docType: DocumentType) => {
    const doc = riderDocuments?.[docType];
    if (doc?.url) {
      try {
        setDownloading(docType);
        const success = await openDocument(docType, doc.url, doc.fileName);
        if (!success) {
          Alert.alert('Error', 'Unable to open document. Please try again.');
        }
        const status = await getDocumentCacheStatus();
        setCacheStatus(status);
      } catch (error) {
        Alert.alert('Error', 'Unable to open document');
      } finally {
        setDownloading(null);
      }
    }
  };

  const handleDocumentOptions = (docType: DocumentType) => {
    const doc = riderDocuments?.[docType];
    if (!doc?.url) {
      handleUploadDocument(docType);
      return;
    }

    Alert.alert(
      DOCUMENT_CONFIG[docType].label,
      'What would you like to do?',
      [
        {
          text: 'View',
          onPress: () => handleViewDocument(docType),
        },
        {
          text: 'Replace',
          onPress: () => handleUploadDocument(docType),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteDocument(docType),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmDeleteDocument = (docType: DocumentType) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete your ${DOCUMENT_CONFIG[docType].label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteDocument(docType),
        },
      ]
    );
  };

  const handleDeleteDocument = async (docType: DocumentType) => {
    if (!user?.uid) return;

    const doc = riderDocuments?.[docType];
    if (!doc?.url) return;

    setDeleting(docType);
    try {
      const success = await deleteDocument(user.uid, docType, doc.url);
      if (success) {
        Alert.alert('Success', 'Document deleted.');
        refresh();
      } else {
        Alert.alert('Error', 'Failed to delete document. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete document. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadDocument = async (docType: DocumentType) => {
    if (!user?.uid) return;

    Alert.alert(
      'Upload Document',
      `Choose how to add your ${DOCUMENT_CONFIG[docType].label}`,
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const file = await pickImage(true);
            if (file) {
              await uploadDocumentFile(docType, file);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const file = await pickImage(false);
            if (file) {
              await uploadDocumentFile(docType, file);
            }
          },
        },
        {
          text: 'Choose File',
          onPress: async () => {
            const file = await pickDocument();
            if (file) {
              await uploadDocumentFile(docType, file);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadDocumentFile = async (
    docType: DocumentType,
    file: { uri: string; name: string; mimeType: string }
  ) => {
    if (!user?.uid) return;

    setUploading(docType);
    try {
      const result = await uploadDocument(
        user.uid,
        docType,
        file.uri,
        file.name,
        file.mimeType
      );

      if (result) {
        Alert.alert('Success', 'Document uploaded successfully.');
        refresh();
      } else {
        Alert.alert('Error', 'Failed to upload document. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!user?.uid) return;

    Alert.alert(
      'Update Profile Photo',
      'Choose how to add your photo',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const file = await pickImage(true);
            if (file) {
              await uploadPhoto(file);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const file = await pickImage(false);
            if (file) {
              await uploadPhoto(file);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadPhoto = async (file: { uri: string; name: string }) => {
    if (!user?.uid) return;

    setUploading('photo');
    try {
      const result = await uploadProfilePhoto(user.uid, file.uri, file.name);
      if (result) {
        Alert.alert('Success', 'Profile photo updated.');
        refresh();
      } else {
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const uploadedDocs = Object.entries(DOCUMENT_CONFIG).filter(
    ([key]) => riderDocuments?.[key as DocumentType]?.url
  ).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.textSecondary }]}>
          MY PROFILE
        </Text>
        <AlertsDropdown />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Photo */}
          <TouchableOpacity onPress={handleUploadPhoto} disabled={uploading === 'photo'}>
            <View style={[styles.photoContainer, { borderColor: theme.accent }]}>
              {uploading === 'photo' ? (
                <View style={[styles.photoPlaceholder, { backgroundColor: theme.background }]}>
                  <ActivityIndicator color={theme.accent} />
                </View>
              ) : userProfile?.odPhotoUrl ? (
                <Image
                  source={{ uri: userProfile.odPhotoUrl }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: theme.background }]}>
                  <Text style={[styles.photoInitial, { color: theme.textMuted }]}>
                    {userProfile?.odFirstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraIcon, { backgroundColor: theme.accent }]}>
                <FontAwesome name="camera" size={12} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {userProfile
              ? `${userProfile.odFirstName} ${userProfile.odLastName}`
              : user?.displayName || 'Loading...'}
          </Text>
          {userProfile?.odNickname && (
            <Text style={[styles.nickname, { color: theme.textSecondary }]}>
              "{userProfile.odNickname}"
            </Text>
          )}

          {/* Bike */}
          {userProfile?.odBike && (
            <View style={styles.bikeRow}>
              <FontAwesome name="motorcycle" size={14} color={theme.warning} />
              <Text style={[styles.bikeText, { color: theme.warning }]}>
                {userProfile.odBike}
              </Text>
            </View>
          )}

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[styles.editProfileButton, { borderColor: theme.accent }]}
            onPress={openEditModal}
            activeOpacity={0.6}
          >
            <FontAwesome name="pencil" size={14} color={theme.accent} />
            <Text style={[styles.editProfileText, { color: theme.accent }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* My Trip Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <FontAwesome name="suitcase" size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>My Trip</Text>
          </View>

          {/* My Profile Details */}
          <TouchableOpacity
            style={[styles.tripNavItem, { borderBottomColor: theme.cardBorder }]}
            onPress={() => {
              console.log('Navigating to my-profile-details');
              router.navigate('/my-profile-details');
            }}
          >
            <View style={[styles.tripNavIcon, { backgroundColor: theme.accent + '20' }]}>
              <FontAwesome name="user" size={16} color={theme.accent} />
            </View>
            <View style={styles.tripNavInfo}>
              <Text style={[styles.tripNavTitle, { color: theme.textPrimary }]}>My Profile</Text>
              <Text style={[styles.tripNavSubtitle, { color: theme.textMuted }]}>Personal info, emergency contact</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          {/* My Ride Selections */}
          <TouchableOpacity
            style={[styles.tripNavItem, { borderBottomColor: theme.cardBorder }]}
            onPress={() => {
              console.log('Navigating to ride-selections');
              router.navigate('/ride-selections');
            }}
          >
            <View style={[styles.tripNavIcon, { backgroundColor: theme.warning + '20' }]}>
              <FontAwesome name="bed" size={16} color={theme.warning} />
            </View>
            <View style={styles.tripNavInfo}>
              <Text style={[styles.tripNavTitle, { color: theme.textPrimary }]}>My Ride Selections</Text>
              <Text style={[styles.tripNavSubtitle, { color: theme.textMuted }]}>Accommodation & meals</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          {/* My Ledger */}
          <TouchableOpacity
            style={[styles.tripNavItem, { borderBottomColor: theme.cardBorder }]}
            onPress={() => {
              console.log('Navigating to my-ledger');
              router.navigate('/my-ledger');
            }}
          >
            <View style={[styles.tripNavIcon, { backgroundColor: theme.success + '20' }]}>
              <FontAwesome name="credit-card" size={16} color={theme.success} />
            </View>
            <View style={styles.tripNavInfo}>
              <Text style={[styles.tripNavTitle, { color: theme.textPrimary }]}>My Ledger</Text>
              <Text style={[styles.tripNavSubtitle, { color: theme.textMuted }]}>Balance & payments</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Tour Info - Expandable Menu */}
          <TouchableOpacity
            style={[styles.tripNavItem, { borderBottomColor: infoExpanded ? 'transparent' : theme.cardBorder }]}
            onPress={() => {
              Haptics.lightTap();
              setInfoExpanded(!infoExpanded);
            }}
          >
            <View style={[styles.tripNavIcon, { backgroundColor: theme.info + '20' }]}>
              <FontAwesome name="info-circle" size={16} color={theme.info} />
            </View>
            <View style={styles.tripNavInfo}>
              <Text style={[styles.tripNavTitle, { color: theme.textPrimary }]}>Tour Info</Text>
              <Text style={[styles.tripNavSubtitle, { color: theme.textMuted }]}>Emergency, checklist, Mexico tips</Text>
            </View>
            <FontAwesome
              name={infoExpanded ? 'chevron-down' : 'chevron-right'}
              size={14}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {/* Info Sub-items */}
          {infoExpanded && (
            <View style={[styles.subMenuContainer, { backgroundColor: theme.background }]}>
              {/* Emergency Contacts */}
              <TouchableOpacity
                style={[styles.subMenuItem, { borderBottomColor: theme.cardBorder }]}
                onPress={() => {
                  Haptics.lightTap();
                  router.navigate('/info-emergency');
                }}
              >
                <View style={[styles.subMenuIcon, { backgroundColor: '#ef4444' + '20' }]}>
                  <FontAwesome name="phone" size={14} color="#ef4444" />
                </View>
                <Text style={[styles.subMenuText, { color: theme.textPrimary }]}>Emergency Contacts</Text>
                <FontAwesome name="chevron-right" size={12} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Trip Checklist */}
              <TouchableOpacity
                style={[styles.subMenuItem, { borderBottomColor: theme.cardBorder }]}
                onPress={() => {
                  Haptics.lightTap();
                  router.navigate('/info-checklist');
                }}
              >
                <View style={[styles.subMenuIcon, { backgroundColor: '#22c55e' + '20' }]}>
                  <FontAwesome name="check-square-o" size={14} color="#22c55e" />
                </View>
                <Text style={[styles.subMenuText, { color: theme.textPrimary }]}>Trip Checklist</Text>
                <FontAwesome name="chevron-right" size={12} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Traveling in Mexico */}
              <TouchableOpacity
                style={[styles.subMenuItem, { borderBottomColor: theme.cardBorder }]}
                onPress={() => {
                  Haptics.lightTap();
                  router.navigate('/info-mexico');
                }}
              >
                <View style={[styles.subMenuIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                  <FontAwesome name="globe" size={14} color="#f59e0b" />
                </View>
                <Text style={[styles.subMenuText, { color: theme.textPrimary }]}>Traveling in Mexico</Text>
                <FontAwesome name="chevron-right" size={12} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Feedback */}
          <TouchableOpacity
            style={[styles.tripNavItem, { borderBottomColor: theme.cardBorder }]}
            onPress={() => {
              console.log('Navigating to feedback');
              router.navigate('/feedback');
            }}
          >
            <View style={[styles.tripNavIcon, { backgroundColor: '#f59e0b' + '20' }]}>
              <FontAwesome name="star" size={16} color="#f59e0b" />
            </View>
            <View style={styles.tripNavInfo}>
              <Text style={[styles.tripNavTitle, { color: theme.textPrimary }]}>Feedback & Review</Text>
              <Text style={[styles.tripNavSubtitle, { color: theme.textMuted }]}>Share your experience</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Merch Store */}
          <TouchableOpacity
            style={[styles.tripNavItem, { borderBottomColor: 'transparent' }]}
            onPress={() => {
              console.log('Navigating to store');
              router.navigate('/store');
            }}
          >
            <View style={[styles.tripNavIcon, { backgroundColor: '#8b5cf6' + '20' }]}>
              <FontAwesome name="shopping-bag" size={16} color="#8b5cf6" />
            </View>
            <View style={styles.tripNavInfo}>
              <Text style={[styles.tripNavTitle, { color: theme.textPrimary }]}>Merch Store</Text>
              <Text style={[styles.tripNavSubtitle, { color: theme.textMuted }]}>Gear, apparel & rentals</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Documents Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <FontAwesome name="folder-open" size={16} color={theme.warning} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>My Documents</Text>
            <View style={[styles.docBadge, { backgroundColor: theme.success + '20' }]}>
              <Text style={[styles.docBadgeText, { color: theme.success }]}>
                {uploadedDocs}/{Object.keys(DOCUMENT_CONFIG).length}
              </Text>
            </View>
          </View>

          {(Object.entries(DOCUMENT_CONFIG) as [DocumentType, typeof DOCUMENT_CONFIG[DocumentType]][]).map(([key, config], idx) => {
            const doc = riderDocuments?.[key];
            const hasDoc = !!doc?.url;
            const isCached = cacheStatus[key];
            const isDownloading = downloading === key;
            const isUploading = uploading === key;
            const isDeleting = deleting === key;
            const isBusy = isDownloading || isUploading || isDeleting;

            return (
              <View
                key={key}
                style={[
                  styles.docRow,
                  idx < Object.keys(DOCUMENT_CONFIG).length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
                ]}
              >
                <View style={[styles.docIcon, { backgroundColor: hasDoc ? theme.success + '20' : theme.background }]}>
                  <FontAwesome
                    name={config.icon as any}
                    size={16}
                    color={hasDoc ? theme.success : theme.textMuted}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={[styles.docName, { color: theme.textPrimary }]}>{config.label}</Text>
                  {hasDoc && isCached && (
                    <Text style={[styles.docStatus, { color: theme.success }]}>Saved offline</Text>
                  )}
                  {hasDoc && !isCached && (
                    <Text style={[styles.docStatus, { color: theme.textMuted }]}>Uploaded</Text>
                  )}
                </View>
                {isBusy ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : hasDoc ? (
                  <View style={styles.docActions}>
                    <TouchableOpacity
                      onPress={() => handleViewDocument(key)}
                      style={[styles.docActionButton, { backgroundColor: theme.accent }]}
                    >
                      <FontAwesome name="eye" size={12} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUploadDocument(key)}
                      style={[styles.docActionButton, { backgroundColor: theme.warning }]}
                    >
                      <FontAwesome name="refresh" size={12} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteDocument(key)}
                      style={[styles.docActionButton, { backgroundColor: theme.danger }]}
                    >
                      <FontAwesome name="trash" size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleUploadDocument(key)}
                    style={[styles.uploadButton, { backgroundColor: theme.accent }]}
                  >
                    <FontAwesome name="upload" size={12} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Settings Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <FontAwesome name="cog" size={16} color={theme.textSecondary} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Settings</Text>
          </View>

          {/* Theme Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.cardBorder }]}>
            <View style={styles.settingInfo}>
              <FontAwesome
                name={isDark ? 'moon-o' : 'sun-o'}
                size={18}
                color={isDark ? '#6366f1' : '#f59e0b'}
              />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => {
                Haptics.lightTap();
                setThemePreference(isDark ? 'light' : 'dark');
              }}
              trackColor={{ false: theme.cardBorder, true: theme.accent }}
              thumbColor={'#ffffff'}
            />
          </View>

          {/* System Theme Option */}
          <TouchableOpacity
            onPress={() => {
              Haptics.lightTap();
              setThemePreference('system');
            }}
            style={[styles.settingRow, { borderBottomColor: theme.cardBorder }]}
          >
            <View style={styles.settingInfo}>
              <FontAwesome name="mobile" size={18} color={theme.textMuted} />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>Use System Theme</Text>
            </View>
            {themePreference === 'system' && (
              <FontAwesome name="check" size={16} color={theme.success} />
            )}
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            onPress={() => {
              Haptics.lightTap();
              setDeleteModalVisible(true);
            }}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.settingInfo}>
              <FontAwesome name="trash" size={18} color={theme.danger} />
              <Text style={[styles.settingText, { color: theme.danger }]}>Delete Account</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutButton, { backgroundColor: theme.danger }]}
        >
          <FontAwesome name="sign-out" size={18} color="#ffffff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          Baja Run 2026 v1.0.0
        </Text>

        {/* Bottom spacing */}
        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={[styles.modalSave, { color: theme.accent }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <FontAwesome name="phone" size={16} color={theme.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: theme.textPrimary }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <FontAwesome name="envelope" size={16} color={theme.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: theme.textPrimary }]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Emergency Contact Section */}
            <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Emergency Contact</Text>

            {/* Emergency Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <FontAwesome name="user" size={16} color={theme.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: theme.textPrimary }]}
                  value={editEmergencyName}
                  onChangeText={setEditEmergencyName}
                  placeholder="Emergency contact name"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Emergency Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <FontAwesome name="phone" size={16} color={theme.textMuted} />
                <TextInput
                  style={[styles.modalInput, { color: theme.textPrimary }]}
                  value={editEmergencyPhone}
                  onChangeText={setEditEmergencyPhone}
                  placeholder="Emergency contact phone"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingAccount && setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.deleteModalIcon, { backgroundColor: theme.danger + '20' }]}>
              <FontAwesome name="exclamation-triangle" size={32} color={theme.danger} />
            </View>

            <Text style={[styles.deleteModalTitle, { color: theme.textPrimary }]}>
              Delete Account?
            </Text>

            <Text style={[styles.deleteModalText, { color: theme.textMuted }]}>
              This action is permanent and cannot be undone. All your data will be deleted, including:
            </Text>

            <View style={styles.deleteModalList}>
              <Text style={[styles.deleteModalListItem, { color: theme.textSecondary }]}>
                • Your registration and profile
              </Text>
              <Text style={[styles.deleteModalListItem, { color: theme.textSecondary }]}>
                • Tour selections and preferences
              </Text>
              <Text style={[styles.deleteModalListItem, { color: theme.textSecondary }]}>
                • Payment history and ledger
              </Text>
              <Text style={[styles.deleteModalListItem, { color: theme.textSecondary }]}>
                • Uploaded documents and photos
              </Text>
            </View>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalCancelButton, { borderColor: theme.cardBorder }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingAccount}
              >
                <Text style={[styles.deleteModalCancelText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalDeleteButton, { backgroundColor: theme.danger }]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteModalDeleteText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  editButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  profileCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 36,
    fontWeight: '600',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  nickname: {
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  bikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  bikeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // My Trip navigation styles
  tripNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  tripNavIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripNavInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tripNavTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  tripNavSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  subMenuContainer: {
    marginLeft: spacing.lg + 40, // Align with nav item content
    marginRight: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  subMenuIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  subMenuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  tourInfo: {
    padding: spacing.md,
  },
  tourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tourLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tourValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  emergencySection: {
    padding: spacing.md,
  },
  emergencyLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  emergencyName: {
    fontSize: 15,
    fontWeight: '500',
  },
  emergencyPhone: {
    fontSize: 14,
    marginTop: 4,
  },
  docBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  docBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  docName: {
    fontSize: 14,
    fontWeight: '500',
  },
  docStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  docMissing: {
    fontSize: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
  },
  docActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingText: {
    fontSize: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  // Delete Account Modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  deleteModalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  deleteModalList: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  deleteModalListItem: {
    fontSize: 13,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  deleteModalDeleteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  deleteModalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
