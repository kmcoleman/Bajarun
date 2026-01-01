/**
 * Layout.tsx
 *
 * Main layout component with header navigation and mobile menu.
 * Includes authentication status, profile dropdown, and responsive design.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatPhoneNumber } from '../utils/formatters';
import {
  Home,
  Map,
  MessageSquare,
  Users,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Bike,
  User,
  Mail,
  Phone,
  Camera,
  Edit2,
  Check,
  Loader2,
  Bell,
  Megaphone,
  BedDouble,
  FileText,
  Clipboard,
  Receipt,
  Settings,
  Calendar,
  LifeBuoy
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// Admin UID for conditional rendering
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

// Public nav items - always visible
const publicNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/tours', label: 'Events', icon: Calendar },
  { path: '/itinerary', label: 'Itinerary', icon: Map },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/guide', label: 'Support', icon: LifeBuoy },
];

// Auth-only nav items - only visible when logged in
const authNavItems = [
  { path: '/participants', label: 'Participants', icon: Users },
  { path: '/discussion', label: 'Discussion', icon: MessageSquare },
  { path: '/logistics', label: 'Info', icon: Clipboard },
];

interface ProfileData {
  fullName: string;
  phone: string;
  headshotUrl: string | null;
  registrationId: string | null;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: Timestamp;
  createdBy: string;
}

// Pages that don't require terms acceptance
const PUBLIC_PAGES = ['/', '/login', '/agree', '/privacy', '/terms', '/support', '/faq', '/guide', '/itinerary', '/waitlist', '/tours', '/cache-help'];

export default function Layout({ children }: LayoutProps) {
  const { user, logout, loading, hasRegistration, termsAccepted, termsLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(new Set());
  const profileRef = useRef<HTMLDivElement>(null);
  const announcementsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to terms agreement if user hasn't accepted
  useEffect(() => {
    if (loading || termsLoading) return;
    if (!user) return; // Not logged in, no redirect needed

    const isPublicPage = PUBLIC_PAGES.includes(location.pathname);
    if (!termsAccepted && !isPublicPage) {
      // Pass the original URL (including search params) so user returns after accepting
      const originalUrl = location.pathname + location.search;
      navigate('/agree', { state: { from: originalUrl } });
    }
  }, [user, loading, termsAccepted, termsLoading, location.pathname, location.search, navigate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
        setEditing(false);
      }
      if (announcementsRef.current && !announcementsRef.current.contains(event.target as Node)) {
        setAnnouncementsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load read announcement IDs from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`readAnnouncements_${user.uid}`);
      if (stored) {
        setReadAnnouncementIds(new Set(JSON.parse(stored)));
      }
    }
  }, [user]);

  // Subscribe to announcements (only if authenticated)
  useEffect(() => {
    if (!user) {
      setAnnouncements([]);
      return;
    }

    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(data);
    }, (error) => {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    });

    return () => unsubscribe();
  }, [user]);

  // Mark announcement as read
  const markAsRead = (announcementId: string) => {
    if (!user) return;
    const newReadIds = new Set(readAnnouncementIds);
    newReadIds.add(announcementId);
    setReadAnnouncementIds(newReadIds);
    localStorage.setItem(`readAnnouncements_${user.uid}`, JSON.stringify([...newReadIds]));
  };

  // Mark all as read
  const markAllAsRead = () => {
    if (!user) return;
    const newReadIds = new Set(announcements.map(a => a.id));
    setReadAnnouncementIds(newReadIds);
    localStorage.setItem(`readAnnouncements_${user.uid}`, JSON.stringify([...newReadIds]));
  };

  // Count unread announcements
  const unreadCount = announcements.filter(a => !readAnnouncementIds.has(a.id)).length;

  // Fetch profile data when dropdown opens
  useEffect(() => {
    async function fetchProfile() {
      if (!user || !profileOpen || profileData) return;

      setLoadingProfile(true);
      try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setProfileData({
            fullName: docData.fullName || user.displayName || '',
            phone: docData.phone || '',
            headshotUrl: docData.headshotUrl || null,
            registrationId: snapshot.docs[0].id
          });
          setEditName(docData.fullName || user.displayName || '');
          setEditPhone(docData.phone || '');
        } else {
          // No registration yet, use auth data
          setProfileData({
            fullName: user.displayName || '',
            phone: '',
            headshotUrl: null,
            registrationId: null
          });
          setEditName(user.displayName || '');
          setEditPhone('');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [user, profileOpen, profileData]);

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!profileData?.registrationId) return;

    setSaving(true);
    try {
      const registrationRef = doc(db, 'registrations', profileData.registrationId);
      await updateDoc(registrationRef, {
        fullName: editName,
        phone: editPhone
      });
      setProfileData(prev => prev ? { ...prev, fullName: editName, phone: editPhone } : null);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profileData?.registrationId) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.uid}-${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `headshots/${fileName}`);

      await uploadBytes(storageRef, file);
      const headshotUrl = await getDownloadURL(storageRef);

      // Update Firestore
      const registrationRef = doc(db, 'registrations', profileData.registrationId);
      await updateDoc(registrationRef, { headshotUrl });

      setProfileData(prev => prev ? { ...prev, headshotUrl } : null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    setProfileOpen(!profileOpen);
    if (!profileOpen) {
      setEditing(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NorCal Moto Adventure"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <div className="text-white font-bold text-lg">NorCal Moto ADV</div>
                <div className="text-slate-400 text-xs">Baja 2026</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Public nav items - always visible */}
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {/* Auth-only nav items - Discussion & Participants (only for registered users) */}
              {user && hasRegistration && authNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Auth & Mobile Menu Button */}
            <div className="flex items-center gap-3">
              {/* Announcements Bell */}
              {user && announcements.length > 0 && (
                <div className="relative" ref={announcementsRef}>
                  <button
                    onClick={() => setAnnouncementsOpen(!announcementsOpen)}
                    className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Announcements Dropdown */}
                  {announcementsOpen && (
                    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden z-50">
                      {/* Header */}
                      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-5 w-5 text-blue-400" />
                          <h3 className="text-white font-semibold">Announcements</h3>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Announcements List */}
                      <div className="max-h-96 overflow-y-auto">
                        {announcements.length === 0 ? (
                          <div className="p-6 text-center text-slate-400">
                            No announcements yet
                          </div>
                        ) : (
                          announcements.map((announcement) => {
                            const isUnread = !readAnnouncementIds.has(announcement.id);
                            const priorityColors = {
                              normal: 'border-l-slate-500',
                              important: 'border-l-amber-500',
                              urgent: 'border-l-red-500'
                            };

                            return (
                              <div
                                key={announcement.id}
                                onClick={() => markAsRead(announcement.id)}
                                className={`p-4 border-b border-slate-700 last:border-0 cursor-pointer hover:bg-slate-700/50 transition-colors border-l-4 ${priorityColors[announcement.priority]} ${isUnread ? 'bg-slate-700/30' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className={`font-medium ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                        {announcement.title}
                                      </h4>
                                      {announcement.priority === 'urgent' && (
                                        <span className="px-1.5 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">
                                          Urgent
                                        </span>
                                      )}
                                      {announcement.priority === 'important' && (
                                        <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded">
                                          Important
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-sm ${isUnread ? 'text-slate-300' : 'text-slate-400'}`}>
                                      {announcement.message}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-2">
                                      {announcement.createdAt?.toDate().toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auth Button / Profile Dropdown */}
              {!loading && (
                <div className="hidden sm:block">
                  {user ? (
                    <div className="relative" ref={profileRef}>
                      {/* Profile Photo Button */}
                      <button
                        onClick={handleProfileClick}
                        className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                      >
                        <img
                          src={profileData?.headshotUrl || user.photoURL || '/default-avatar.png'}
                          alt={profileData?.fullName || user.displayName || 'User'}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Profile Dropdown */}
                      {profileOpen && (
                        <div className="absolute right-0 mt-2 w-80 max-h-[calc(100vh-5rem)] bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-y-auto overscroll-contain z-50">
                          {loadingProfile ? (
                            <div className="p-6 text-center">
                              <Loader2 className="h-6 w-6 text-blue-400 animate-spin mx-auto" />
                              <p className="text-slate-400 text-sm mt-2">Loading profile...</p>
                            </div>
                          ) : (
                            <>
                              {/* Profile Header with Photo */}
                              <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                                <div className="flex items-center gap-4">
                                  {/* Photo with upload option */}
                                  <div className="relative">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600">
                                      {uploadingPhoto ? (
                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                          <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                                        </div>
                                      ) : (
                                        <img
                                          src={profileData?.headshotUrl || user.photoURL || '/default-avatar.png'}
                                          alt="Profile"
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                    {profileData?.registrationId && (
                                      <>
                                        <input
                                          ref={fileInputRef}
                                          type="file"
                                          accept="image/*"
                                          onChange={handlePhotoUpload}
                                          className="hidden"
                                          id="profile-photo-upload"
                                        />
                                        <label
                                          htmlFor="profile-photo-upload"
                                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                                        >
                                          <Camera className="h-4 w-4 text-white" />
                                        </label>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold truncate">
                                      {profileData?.fullName || user.displayName || 'User'}
                                    </p>
                                    <p className="text-slate-400 text-sm truncate">{user.email}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Profile Info */}
                              <div className="p-4 space-y-3">
                                {editing ? (
                                  /* Edit Mode */
                                  <>
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">Name</label>
                                      <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">Phone</label>
                                      <input
                                        type="tel"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(formatPhoneNumber(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="(555) 123-4567"
                                      />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                      <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                                      >
                                        {saving ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4" />
                                        )}
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditing(false);
                                          setEditName(profileData?.fullName || '');
                                          setEditPhone(profileData?.phone || '');
                                        }}
                                        className="px-3 py-2 text-slate-300 hover:text-white text-sm transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  /* View Mode */
                                  <>
                                    <div className="flex items-center gap-3">
                                      <User className="h-4 w-4 text-slate-400" />
                                      <span className="text-slate-300 text-sm">
                                        {profileData?.fullName || 'Not set'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Mail className="h-4 w-4 text-slate-400" />
                                      <span className="text-slate-300 text-sm">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Phone className="h-4 w-4 text-slate-400" />
                                      <span className="text-slate-300 text-sm">
                                        {profileData?.phone || 'Not set'}
                                      </span>
                                    </div>
                                    {profileData?.registrationId && (
                                      <button
                                        onClick={() => setEditing(true)}
                                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                        Edit Profile
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Admin Section - Only for admin */}
                              {user?.uid === ADMIN_UID && (
                                <div className="px-4 pb-3 border-b border-slate-700">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Admin</p>
                                  <div className="space-y-1">
                                    <Link
                                      to="/admin"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    >
                                      <Settings className="h-4 w-4" />
                                      Dashboard
                                    </Link>
                                    <Link
                                      to="/admin/nightly-config"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    >
                                      <Calendar className="h-4 w-4" />
                                      Daily Config
                                    </Link>
                                    <Link
                                      to="/admin/email-templates"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    >
                                      <Mail className="h-4 w-4" />
                                      Email Templates
                                    </Link>
                                    {/* NEW EMAIL SYSTEM (isolated - delete this block to remove) */}
                                    <Link
                                      to="/admin/email-system"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-amber-400 hover:bg-slate-700 hover:text-amber-300 rounded-lg transition-colors"
                                    >
                                      <Mail className="h-4 w-4" />
                                      Email System (New)
                                    </Link>
                                    <Link
                                      to="/admin/room-assignments"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    >
                                      <BedDouble className="h-4 w-4" />
                                      Room Assignments
                                    </Link>
                                    <Link
                                      to="/admin/registrations"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    >
                                      <User className="h-4 w-4" />
                                      Enter Registrations
                                    </Link>
                                  </div>
                                </div>
                              )}

                              {/* My Trip Section */}
                              <div className="px-4 py-3 border-b border-slate-700">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">My Trip</p>
                                <div className="space-y-1">
                                  {profileData?.registrationId && (
                                    <Link
                                      to="/my-profile"
                                      onClick={() => setProfileOpen(false)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    >
                                      <User className="h-4 w-4" />
                                      My Profile
                                    </Link>
                                  )}
                                  <Link
                                    to="/my-selections"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                  >
                                    <BedDouble className="h-4 w-4" />
                                    My Ride
                                  </Link>
                                  <Link
                                    to="/my-documents"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                  >
                                    <FileText className="h-4 w-4" />
                                    My Documents
                                  </Link>
                                  <Link
                                    to="/my-ledger"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                  >
                                    <Receipt className="h-4 w-4" />
                                    My Ledger
                                  </Link>
                                </div>
                              </div>

                              {/* Sign Out */}
                              <div className="p-3">
                                <button
                                  onClick={() => {
                                    logout();
                                    setProfileOpen(false);
                                    setProfileData(null);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Sign Out
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <nav className="px-4 py-3 space-y-1">
              {/* Public nav items - always visible */}
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {/* Auth-only nav items - Discussion & Participants (only for registered users) */}
              {user && hasRegistration && authNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Auth Section */}
              <div className="pt-3 border-t border-slate-700 mt-3">
                {user ? (
                  <div className="space-y-1">
                    {/* Profile Header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <img
                        src={profileData?.headshotUrl || user.photoURL || '/default-avatar.png'}
                        alt={profileData?.fullName || user.displayName || 'User'}
                        className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
                      />
                      <div className="text-left">
                        <p className="text-white font-medium">
                          {profileData?.fullName || user.displayName || 'User'}
                        </p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>

                    {/* Admin Section - Only for admin */}
                    {user.uid === ADMIN_UID && (
                      <div className="pt-2 pb-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-1">Admin</p>
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Settings className="h-5 w-5" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/nightly-config"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Daily Config</span>
                        </Link>
                        <Link
                          to="/admin/email-templates"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Mail className="h-5 w-5" />
                          <span>Email Templates</span>
                        </Link>
                        {/* NEW EMAIL SYSTEM (isolated - delete this block to remove) */}
                        <Link
                          to="/admin/email-system"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Mail className="h-5 w-5" />
                          <span>Email System (New)</span>
                        </Link>
                        <Link
                          to="/admin/room-assignments"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <BedDouble className="h-5 w-5" />
                          <span>Room Assignments</span>
                        </Link>
                        <Link
                          to="/admin/registrations"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <User className="h-5 w-5" />
                          <span>Enter Registrations</span>
                        </Link>
                      </div>
                    )}

                    {/* My Trip Section */}
                    <div className="pt-2 pb-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-1">My Trip</p>
                      {profileData?.registrationId && (
                        <Link
                          to="/my-profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <User className="h-5 w-5" />
                          <span>My Profile</span>
                        </Link>
                      )}
                      <Link
                        to="/my-selections"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <BedDouble className="h-5 w-5" />
                        <span>My Ride</span>
                      </Link>
                      <Link
                        to="/my-documents"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span>My Documents</span>
                      </Link>
                      <Link
                        to="/my-ledger"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Receipt className="h-5 w-5" />
                        <span>My Ledger</span>
                      </Link>
                      {/* Announcements */}
                      {announcements.length > 0 && (
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setAnnouncementsOpen(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Bell className="h-5 w-5" />
                          <span>Announcements</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Sign Out */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                          setProfileData(null);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleSignIn();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Login
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Bike className="h-5 w-5" />
              <span>BMW Motorcycle Club - Baja Tour 2026</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/guide" className="text-slate-400 hover:text-white transition-colors">
                User Guide
              </Link>
              <Link to="/faq" className="text-slate-400 hover:text-white transition-colors">
                FAQ
              </Link>
              <span className="text-slate-500">March 19-27, 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
