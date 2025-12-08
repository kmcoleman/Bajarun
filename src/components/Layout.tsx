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
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Home,
  Map,
  MessageSquare,
  Users,
  HelpCircle,
  Menu,
  X,
  LogIn,
  LogOut,
  Bike,
  ClipboardList,
  User,
  Mail,
  Phone,
  Camera,
  Edit2,
  Check,
  Loader2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/itinerary', label: 'Itinerary', icon: Map },
  { path: '/discussion', label: 'Discussion', icon: MessageSquare },
  { path: '/participants', label: 'Participants', icon: Users },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
  { path: '/register', label: 'Register', icon: ClipboardList },
];

interface ProfileData {
  fullName: string;
  phone: string;
  headshotUrl: string | null;
  registrationId: string | null;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Format phone number
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

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
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-lg">BMW Baja Tour</div>
                <div className="text-slate-400 text-xs">March 2025</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
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
                        <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden z-50">
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

                              {/* Logout Button */}
                              <div className="p-3 border-t border-slate-700">
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Create Account / Sign In
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
              {navItems.map((item) => {
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

              {/* Mobile Auth */}
              <div className="pt-3 border-t border-slate-700 mt-3">
                {user ? (
                  <div className="space-y-2">
                    {/* Profile Button */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setProfileOpen(true);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                    >
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
                    </button>
                    {/* Logout Button */}
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
                ) : (
                  <button
                    onClick={() => {
                      handleSignIn();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-blue-600 text-white rounded-lg"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Create Account / Sign In</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
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
            <div className="text-slate-500 text-sm">
              March 19-27, 2026 • El Cajon to Death Valley
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
