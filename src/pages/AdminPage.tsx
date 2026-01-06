/**
 * AdminPage.tsx
 *
 * Admin dashboard for Baja Tour organizers.
 * Shows registration stats and allows viewing participant details.
 * Protected by UID check - only accessible by authorized admin.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { db, functions } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, addDoc, setDoc, serverTimestamp, orderBy, query, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  Users,
  DollarSign,
  Hotel,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  Bike,
  AlertTriangle,
  Shield,
  Save,
  Send,
  Eye,
  AlertCircle,
  Megaphone,
  Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
  Tent,
  UserX,
  UtensilsCrossed,
  Coffee,
  UserRound,
  Compass,
  BedDouble,
  Receipt,
  Plus,
  CreditCard,
  Banknote,
  FileText,
  Menu,
  Home,
  Wrench,
  Calendar,
  UserCog,
  ClipboardList,
  Upload
} from 'lucide-react';
import type { NightConfig, UserSelections, OptionalActivity, PaymentMethod } from '../types/eventConfig';
import { TRIP_NIGHTS } from '../types/eventConfig';
import EmailComposer from '../components/EmailComposer';

// Admin UID - only this user can access the admin page
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface Registration {
  id: string;
  uid: string;
  fullName: string;
  nickname: string;
  tagline: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  medicalConditions: string;
  bikeModel: string;
  bikeYear: string;
  yearsRiding: string;
  offRoadExperience: string;
  bajaTourExperience: string;
  repairExperience: string;
  spanishLevel: string;
  passportValid: boolean;
  hasPillion: boolean;
  accommodationPreference: string;
  flexibleAccommodations: boolean;
  okSharingSameGender: boolean;
  okLessIdeal: boolean;
  okGroupMeals: boolean;
  okHotelCost: boolean;
  participateGroup: boolean | null;
  tshirtSize: string;
  hasGarminInreach: boolean;
  hasToolkit: boolean;
  skillMechanical: boolean;
  skillMedical: boolean;
  skillPhotography: boolean;
  skillOther: boolean;
  skillOtherText: string;
  anythingElse: string;
  headshotUrl: string | null;
  depositPaid: number;
  depositRequired: number;
  amtCollected: number;
  createdAt: any;
  latitude?: number;
  longitude?: number;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Registration | null>(null);
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [savingDeposit, setSavingDeposit] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState<'registrations' | 'email' | 'announcements' | 'emailList' | 'accommodations' | 'ledger' | 'roster' | 'profileViewer' | 'waitlist' | 'jsonUpload'>('registrations');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['registration', 'accommodations', 'communication', 'financial', 'tools']));

  // Profile viewer state
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  // Announcement state
  interface Announcement {
    id: string;
    title: string;
    message: string;
    priority: 'normal' | 'important' | 'urgent';
    createdAt: Timestamp;
    createdBy: string;
  }
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Record Deposit Modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositModalPerson, setDepositModalPerson] = useState<Registration | null>(null);
  const [depositModalAmount, setDepositModalAmount] = useState<string>('');
  const [recordingDeposit, setRecordingDeposit] = useState(false);

  // Accommodation view state
  interface UserAccommodationData {
    odUserId: string;
    odName: string;
    odEmail: string | null;
    odHeadshotUrl: string | null;
    selections: UserSelections;
    preferredRoommate: string | null;
    dietaryRestrictions: string | null;
  }
  const [userAccommodations, setUserAccommodations] = useState<UserAccommodationData[]>([]);
  const [nightConfigs, setNightConfigs] = useState<{ [key: string]: NightConfig }>({});
  const [expandedNights, setExpandedNights] = useState<Set<string>>(new Set());
  const [loadingAccommodations, setLoadingAccommodations] = useState(false);

  // Ledger state
  interface LedgerCharge {
    id: string;
    type: 'accommodation' | 'meal' | 'fee' | 'adjustment';
    description: string;
    amount: number;
    date: Date;
    postedBy: string;
    nightKey?: string;
  }
  interface LedgerPayment {
    id: string;
    amount: number;
    date: Date;
    method: PaymentMethod;
    recordedBy: string;
    note?: string;
  }
  const [selectedLedgerUserId, setSelectedLedgerUserId] = useState<string | null>(null);
  const [ledgerCharges, setLedgerCharges] = useState<LedgerCharge[]>([]);
  const [ledgerPayments, setLedgerPayments] = useState<LedgerPayment[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expandedLedgerSections, setExpandedLedgerSections] = useState<Set<string>>(new Set(['estimates', 'charges', 'payments']));

  // Geocoding state
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState({ done: 0, total: 0 });

  // Waitlist state
  interface WaitlistEntry {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    bikeModel: string;
    bikeYear: string;
    hasPillion: boolean;
    flexibleAccommodations: boolean;
    heardAbout: string;
    notes: string;
    status: 'pending' | 'contacted' | 'promoted' | 'declined';
    createdAt: any;
    eventId?: string;
    eventName?: string;
    listType?: 'waitlist' | 'interest';
  }
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);

  // JSON Upload state
  const [jsonCollection, setJsonCollection] = useState('tours');
  const [jsonDocId, setJsonDocId] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [uploadingJson, setUploadingJson] = useState(false);
  const [jsonResult, setJsonResult] = useState<string | null>(null);

  // All riders ledger totals
  const [allRidersTotals, setAllRidersTotals] = useState<{
    totalPayments: number;
    totalPostedCharges: number;
    totalEstimatedCharges: number;
    loaded: boolean;
  }>({ totalPayments: 0, totalPostedCharges: 0, totalEstimatedCharges: 0, loaded: false });

  // Charge modal state
  const [newChargeType, setNewChargeType] = useState<'accommodation' | 'meal' | 'fee' | 'adjustment'>('fee');
  const [newChargeDescription, setNewChargeDescription] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');
  const [newChargeNightKey, setNewChargeNightKey] = useState('');
  const [savingCharge, setSavingCharge] = useState(false);

  // Payment modal state
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('venmo');
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Check if current user is admin
  const isAdmin = user?.uid === ADMIN_UID;

  // Fetch all registrations
  useEffect(() => {
    async function fetchRegistrations() {
      if (!isAdmin) return;

      try {
        const registrationsRef = collection(db, 'registrations');
        const snapshot = await getDocs(registrationsRef);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Registration[];

        // Sort by creation date (newest first)
        data.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setRegistrations(data);
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchRegistrations();
    }
  }, [isAdmin, authLoading]);

  // Fetch announcements
  useEffect(() => {
    if (!isAdmin) return;

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
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch waitlist entries when tab is selected
  useEffect(() => {
    async function fetchWaitlist() {
      if (!isAdmin || activeTab !== 'waitlist') return;
      if (waitlistEntries.length > 0) return; // Already loaded

      setLoadingWaitlist(true);
      try {
        const waitlistRef = collection(db, 'waitlist');
        const q = query(waitlistRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WaitlistEntry[];
        setWaitlistEntries(entries);
      } catch (error) {
        console.error('Error fetching waitlist:', error);
      } finally {
        setLoadingWaitlist(false);
      }
    }

    fetchWaitlist();
  }, [isAdmin, activeTab, waitlistEntries.length]);

  // Fetch accommodations data when tab is selected (needed for Rider Prefs, Ledger, and Roster)
  useEffect(() => {
    async function fetchAccommodations() {
      if (!isAdmin || (activeTab !== 'accommodations' && activeTab !== 'ledger' && activeTab !== 'roster' && activeTab !== 'profileViewer')) return;
      if (userAccommodations.length > 0) return; // Already loaded

      setLoadingAccommodations(true);
      try {
        // Fetch night configs
        const configSnap = await getDocs(query(collection(db, 'eventConfig')));
        const pricingDoc = configSnap.docs.find(d => d.id === 'pricing');
        if (pricingDoc?.exists()) {
          const data = pricingDoc.data();
          if (data.nights) {
            setNightConfigs(data.nights);
          }
        }

        // Fetch all users from users collection that have email AND displayName
        // Include their accommodation selections if available
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const accommodationData: UserAccommodationData[] = [];

        usersSnap.forEach((userDoc) => {
          const userData = userDoc.data();
          // Include users who have email and displayName (or accommodationSelections)
          const hasIdentity = userData.email && userData.displayName;
          const hasSelections = userData.accommodationSelections && Object.keys(userData.accommodationSelections).length > 0;

          if (hasIdentity || hasSelections) {
            // Find matching registration for photo only (not required for name)
            const reg = registrations.find(r => r.uid === userDoc.id);
            accommodationData.push({
              odUserId: userDoc.id,
              odName: userData.displayName || reg?.fullName || userData.email || 'Unknown',
              odEmail: userData.email || null,
              odHeadshotUrl: reg?.headshotUrl || userData.photoURL || null,
              selections: userData.accommodationSelections || {},
              preferredRoommate: userData.preferredRoommate || null,
              dietaryRestrictions: userData.dietaryRestrictions || null
            });
          }
        });

        // Sort by name
        accommodationData.sort((a, b) => a.odName.localeCompare(b.odName));

        setUserAccommodations(accommodationData);
      } catch (error) {
        console.error('Error fetching accommodations:', error);
      } finally {
        setLoadingAccommodations(false);
      }
    }

    fetchAccommodations();
  }, [isAdmin, activeTab, registrations]);

  // Toggle night expansion
  const toggleNight = (nightKey: string) => {
    setExpandedNights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nightKey)) {
        newSet.delete(nightKey);
      } else {
        newSet.add(nightKey);
      }
      return newSet;
    });
  };

  // Get accommodation counts for a night
  const getAccommodationCounts = (nightKey: string) => {
    let hotel = 0, camping = 0, own = 0, none = 0;
    userAccommodations.forEach(user => {
      const selection = user.selections[nightKey];
      if (!selection?.accommodation) {
        none++;
      } else if (selection.accommodation === 'hotel') {
        hotel++;
      } else if (selection.accommodation === 'camping') {
        camping++;
      } else if (selection.accommodation === 'own') {
        own++;
      }
    });
    return { hotel, camping, own, none, total: userAccommodations.length };
  };

  // Get sorted users for a night (hotel first, then camping, then own)
  const getSortedUsersForNight = (nightKey: string) => {
    return [...userAccommodations].sort((a, b) => {
      const aAccom = a.selections[nightKey]?.accommodation || 'zzz';
      const bAccom = b.selections[nightKey]?.accommodation || 'zzz';
      const order = { hotel: 1, camping: 2, own: 3, zzz: 4 };
      return (order[aAccom as keyof typeof order] || 4) - (order[bAccom as keyof typeof order] || 4);
    });
  };

  // Get roommate name by ID (check both id and uid for compatibility)
  const getRoommateName = (odUserId: string | null) => {
    if (!odUserId) return null;
    const reg = registrations.find(r => r.id === odUserId || r.uid === odUserId);
    return reg?.fullName || null;
  };

  // Load ledger data when rider selected
  useEffect(() => {
    async function loadLedger() {
      if (!selectedLedgerUserId || !isAdmin) return;

      setLoadingLedger(true);
      try {
        // Load charges
        const chargesRef = collection(db, 'ledger', selectedLedgerUserId, 'charges');
        const chargesSnap = await getDocs(query(chargesRef, orderBy('date', 'desc')));
        const charges: LedgerCharge[] = chargesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        })) as LedgerCharge[];
        setLedgerCharges(charges);

        // Load payments
        const paymentsRef = collection(db, 'ledger', selectedLedgerUserId, 'payments');
        const paymentsSnap = await getDocs(query(paymentsRef, orderBy('date', 'desc')));
        const payments: LedgerPayment[] = paymentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        })) as LedgerPayment[];
        setLedgerPayments(payments);
      } catch (error) {
        console.error('Error loading ledger:', error);
      } finally {
        setLoadingLedger(false);
      }
    }

    loadLedger();
  }, [selectedLedgerUserId, isAdmin]);

  // Load all riders totals when ledger tab is active
  useEffect(() => {
    async function loadAllRidersTotals() {
      if (!isAdmin || activeTab !== 'ledger') return;
      if (allRidersTotals.loaded) return; // Already loaded

      try {
        let totalPayments = 0;
        let totalPostedCharges = 0;

        // Load all ledger data for all users
        for (const reg of registrations) {
          // Load charges for this user
          const chargesRef = collection(db, 'ledger', reg.uid, 'charges');
          const chargesSnap = await getDocs(chargesRef);
          chargesSnap.forEach(doc => {
            totalPostedCharges += doc.data().amount || 0;
          });

          // Load payments for this user
          const paymentsRef = collection(db, 'ledger', reg.uid, 'payments');
          const paymentsSnap = await getDocs(paymentsRef);
          paymentsSnap.forEach(doc => {
            totalPayments += doc.data().amount || 0;
          });
        }

        // Calculate total estimated charges from all users' selections
        let totalEstimatedCharges = 0;
        for (const userData of userAccommodations) {
          TRIP_NIGHTS.forEach(night => {
            const selection = userData.selections[night.key];
            const config = nightConfigs[night.key];
            if (!selection || !config) return;

            // Accommodation
            if (selection.accommodation === 'hotel' && config.hotelAvailable) {
              let hotelCost = config.hotelCost || 0;
              if (selection.prefersSingleRoom && config.singleRoomAvailable) {
                hotelCost = hotelCost * 2;
              }
              totalEstimatedCharges += hotelCost;
            } else if (selection.accommodation === 'camping' && config.campingAvailable) {
              totalEstimatedCharges += config.campingCost || 0;
            }

            // Dinner
            if (selection.dinner && config.dinnerAvailable) {
              totalEstimatedCharges += config.dinnerCost || 0;
            }

            // Breakfast
            if (selection.breakfast && config.breakfastAvailable) {
              totalEstimatedCharges += config.breakfastCost || 0;
            }

            // Optional activities
            if (selection.optionalActivitiesInterested && config.optionalActivities) {
              selection.optionalActivitiesInterested.forEach(actId => {
                const activity = config.optionalActivities.find(a => a.id === actId);
                if (activity) {
                  totalEstimatedCharges += activity.cost || 0;
                }
              });
            }
          });
        }

        setAllRidersTotals({
          totalPayments,
          totalPostedCharges,
          totalEstimatedCharges,
          loaded: true
        });
      } catch (error) {
        console.error('Error loading all riders totals:', error);
      }
    }

    loadAllRidersTotals();
  }, [isAdmin, activeTab, registrations, userAccommodations, nightConfigs, allRidersTotals.loaded]);

  // Calculate estimated charges from selections
  const calculateEstimatedCharges = (userId: string): { description: string; amount: number; nightKey?: string }[] => {
    const userData = userAccommodations.find(u => u.odUserId === userId);
    if (!userData) return [];

    const estimates: { description: string; amount: number; nightKey?: string }[] = [];

    TRIP_NIGHTS.forEach(night => {
      const selection = userData.selections[night.key];
      const config = nightConfigs[night.key];
      if (!selection || !config) return;

      // Accommodation
      if (selection.accommodation === 'hotel' && config.hotelAvailable) {
        let hotelCost = config.hotelCost || 0;
        if (selection.prefersSingleRoom && config.singleRoomAvailable) {
          hotelCost = hotelCost * 2; // Single room is double
        }
        if (hotelCost > 0) {
          estimates.push({
            description: `${night.label} - Hotel${selection.prefersSingleRoom ? ' (Single)' : ''}`,
            amount: hotelCost,
            nightKey: night.key
          });
        }
      } else if (selection.accommodation === 'camping' && config.campingAvailable) {
        if (config.campingCost > 0) {
          estimates.push({
            description: `${night.label} - Camping`,
            amount: config.campingCost,
            nightKey: night.key
          });
        }
      }

      // Dinner
      if (selection.dinner && config.dinnerAvailable && config.dinnerCost > 0) {
        estimates.push({
          description: `${night.label} - Dinner`,
          amount: config.dinnerCost,
          nightKey: night.key
        });
      }

      // Breakfast
      if (selection.breakfast && config.breakfastAvailable && config.breakfastCost > 0) {
        estimates.push({
          description: `${night.label} - Breakfast`,
          amount: config.breakfastCost,
          nightKey: night.key
        });
      }

      // Optional activities
      if (selection.optionalActivitiesInterested && config.optionalActivities) {
        selection.optionalActivitiesInterested.forEach(actId => {
          const activity = config.optionalActivities.find(a => a.id === actId);
          if (activity && activity.cost > 0) {
            estimates.push({
              description: `${night.label} - ${activity.title}`,
              amount: activity.cost,
              nightKey: night.key
            });
          }
        });
      }
    });

    return estimates;
  };

  // Save a new charge
  const handleSaveCharge = async () => {
    if (!selectedLedgerUserId || !user || !newChargeDescription.trim() || !newChargeAmount) return;

    setSavingCharge(true);
    try {
      const chargeData = {
        type: newChargeType,
        description: newChargeDescription.trim(),
        amount: parseFloat(newChargeAmount),
        date: serverTimestamp(),
        postedBy: user.uid,
        ...(newChargeNightKey && { nightKey: newChargeNightKey })
      };

      await addDoc(collection(db, 'ledger', selectedLedgerUserId, 'charges'), chargeData);

      // Reload ledger by re-fetching
      const chargesRef = collection(db, 'ledger', selectedLedgerUserId, 'charges');
      const chargesSnap = await getDocs(query(chargesRef, orderBy('date', 'desc')));
      const charges: LedgerCharge[] = chargesSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate() || new Date()
      })) as LedgerCharge[];
      setLedgerCharges(charges);

      // Reset all riders totals to trigger reload
      setAllRidersTotals(prev => ({ ...prev, loaded: false }));

      // Reset form
      setNewChargeType('fee');
      setNewChargeDescription('');
      setNewChargeAmount('');
      setNewChargeNightKey('');
      setShowChargeModal(false);
    } catch (error) {
      console.error('Error saving charge:', error);
      alert('Failed to save charge');
    } finally {
      setSavingCharge(false);
    }
  };

  // Save a new payment
  const handleSavePayment = async () => {
    if (!selectedLedgerUserId || !user || !newPaymentAmount) return;

    setSavingPayment(true);
    try {
      const paymentData = {
        amount: parseFloat(newPaymentAmount),
        date: serverTimestamp(),
        method: newPaymentMethod,
        recordedBy: user.uid,
        ...(newPaymentNote.trim() && { note: newPaymentNote.trim() })
      };

      await addDoc(collection(db, 'ledger', selectedLedgerUserId, 'payments'), paymentData);

      // Reload ledger by re-fetching
      const paymentsRef = collection(db, 'ledger', selectedLedgerUserId, 'payments');
      const paymentsSnap = await getDocs(query(paymentsRef, orderBy('date', 'desc')));
      const payments: LedgerPayment[] = paymentsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate() || new Date()
      })) as LedgerPayment[];
      setLedgerPayments(payments);

      // Reset all riders totals to trigger reload
      setAllRidersTotals(prev => ({ ...prev, loaded: false }));

      // Reset form
      setNewPaymentAmount('');
      setNewPaymentMethod('venmo');
      setNewPaymentNote('');
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to save payment');
    } finally {
      setSavingPayment(false);
    }
  };

  // Delete a charge
  const handleDeleteCharge = async (chargeId: string) => {
    if (!selectedLedgerUserId || !confirm('Delete this charge?')) return;

    try {
      await deleteDoc(doc(db, 'ledger', selectedLedgerUserId, 'charges', chargeId));
      setLedgerCharges(prev => prev.filter(c => c.id !== chargeId));
    } catch (error) {
      console.error('Error deleting charge:', error);
      alert('Failed to delete charge');
    }
  };

  // Delete a payment
  const handleDeletePayment = async (paymentId: string) => {
    if (!selectedLedgerUserId || !confirm('Delete this payment?')) return;

    try {
      await deleteDoc(doc(db, 'ledger', selectedLedgerUserId, 'payments', paymentId));
      setLedgerPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    }
  };

  // Post announcement and send push notifications
  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim() || !user) return;

    setPostingAnnouncement(true);
    try {
      // Call Cloud Function to save announcement AND send push notifications
      const sendPushNotificationFn = httpsCallable(functions, 'sendPushNotification');
      const result = await sendPushNotificationFn({
        title: announcementTitle.trim(),
        body: announcementMessage.trim(),
        priority: announcementPriority === 'urgent' ? 'high' : 'normal',
      });

      const data = result.data as { sent: number; failed: number; announcementId: string };

      // Show success message with delivery stats
      alert(`Announcement posted!\nDelivered to ${data.sent} device(s)${data.failed > 0 ? `, ${data.failed} failed` : ''}`);

      // Clear form
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementPriority('normal');
    } catch (error) {
      console.error('Error posting announcement:', error);
      alert('Failed to post announcement. Please try again.');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement.');
    }
  };

  // Update waitlist entry status
  const handleUpdateWaitlistStatus = async (entryId: string, newStatus: WaitlistEntry['status']) => {
    try {
      await updateDoc(doc(db, 'waitlist', entryId), { status: newStatus });
      setWaitlistEntries(prev => prev.map(entry =>
        entry.id === entryId ? { ...entry, status: newStatus } : entry
      ));
    } catch (error) {
      console.error('Error updating waitlist status:', error);
      alert('Failed to update status.');
    }
  };

  // Delete waitlist entry
  const handleDeleteWaitlistEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this waitlist entry?')) return;

    try {
      await deleteDoc(doc(db, 'waitlist', entryId));
      setWaitlistEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting waitlist entry:', error);
      alert('Failed to delete entry.');
    }
  };

  // Upload JSON to Firestore
  const handleJsonUpload = async () => {
    if (!jsonCollection || !jsonData) {
      setJsonResult('Error: Please fill in collection and JSON data');
      return;
    }

    setUploadingJson(true);
    setJsonResult(null);

    try {
      // Parse JSON
      let data = JSON.parse(jsonData);

      // Convert date strings to Firestore Timestamps
      const convertDates = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string') {
          // Check if it looks like a date
          if (/^\d{4}-\d{2}-\d{2}/.test(obj)) {
            return Timestamp.fromDate(new Date(obj));
          }
          return obj;
        }
        if (Array.isArray(obj)) {
          return obj.map(convertDates);
        }
        if (typeof obj === 'object') {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            result[key] = convertDates(value);
          }
          return result;
        }
        return obj;
      };

      // Upload to Firestore - handle subcollection paths like "events/bajarun2026/roomInventory"
      const pathSegments = jsonCollection.split('/').filter(s => s.trim());

      const getDocRef = (docId: string) => {
        if (pathSegments.length === 1) {
          // Simple collection: e.g., "tours"
          return doc(db, pathSegments[0], docId);
        } else if (pathSegments.length === 3) {
          // Subcollection: e.g., "events/bajarun2026/roomInventory"
          return doc(db, pathSegments[0], pathSegments[1], pathSegments[2], docId);
        } else if (pathSegments.length === 5) {
          // Nested subcollection: e.g., "events/bajarun2026/roomInventory/room1/beds"
          return doc(db, pathSegments[0], pathSegments[1], pathSegments[2], pathSegments[3], pathSegments[4], docId);
        } else {
          throw new Error('Invalid collection path. Use "collection" or "collection/doc/subcollection"');
        }
      };

      // Check if it's a batch upload (array with id fields)
      if (Array.isArray(data) && data.length > 0 && data.every(item => item.id)) {
        // Batch upload - use each item's id field as document ID
        let successCount = 0;
        const errors: string[] = [];
        const createdDocs: string[] = [];

        console.log(`[Batch Upload] Starting upload of ${data.length} documents to "${jsonCollection}"`);

        for (const item of data) {
          const itemId = item.id;
          const itemData = convertDates({ ...item });
          // Don't store the id as a field since it's the document ID
          delete itemData.id;

          try {
            const docRef = getDocRef(itemId);
            console.log(`[Batch Upload] Writing doc: ${docRef.path}`);
            await setDoc(docRef, itemData);
            createdDocs.push(docRef.path);
            successCount++;
            console.log(`[Batch Upload] ✓ Created: ${docRef.path}`);
          } catch (err: any) {
            console.error(`[Batch Upload] ✗ Failed ${itemId}:`, err);
            errors.push(`${itemId}: ${err.message}`);
          }
        }

        if (errors.length > 0) {
          setJsonResult(`Uploaded ${successCount}/${data.length} documents. Errors: ${errors.join(', ')}`);
        } else {
          setJsonResult(`Success! Uploaded ${successCount} documents to "${jsonCollection}"\n\nDoc paths:\n${createdDocs.join('\n')}`);
        }
        setJsonData('');
      } else {
        // Single document upload - require document ID
        if (!jsonDocId) {
          setJsonResult('Error: Document ID required for single document upload');
          setUploadingJson(false);
          return;
        }

        data = convertDates(data);
        const docRef = getDocRef(jsonDocId);
        await setDoc(docRef, data);
        setJsonResult(`Success! Document "${jsonDocId}" created in "${jsonCollection}"`);
        setJsonDocId('');
        setJsonData('');
      }
    } catch (error: any) {
      console.error('Error uploading JSON:', error);
      setJsonResult(`Error: ${error.message}`);
    } finally {
      setUploadingJson(false);
    }
  };

  // Open deposit modal for a registration
  const openDepositModal = (reg: Registration, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the person
    const requiredAmount = getRequiredDeposit(reg);
    setDepositModalPerson(reg);
    setDepositModalAmount(String(requiredAmount));
    setShowDepositModal(true);
  };

  // Record deposit (save to amtCollected field)
  const handleRecordDeposit = async () => {
    if (!depositModalPerson) return;

    setRecordingDeposit(true);
    try {
      const amount = parseFloat(depositModalAmount) || 0;
      const registrationRef = doc(db, 'registrations', depositModalPerson.id);
      await updateDoc(registrationRef, { amtCollected: amount });

      // Update local state
      setRegistrations(prev =>
        prev.map(r => r.id === depositModalPerson.id ? { ...r, amtCollected: amount } : r)
      );

      // Update selected person if it's the same one
      if (selectedPerson?.id === depositModalPerson.id) {
        setSelectedPerson(prev => prev ? { ...prev, amtCollected: amount } : null);
      }

      setShowDepositModal(false);
      setDepositModalPerson(null);
    } catch (error) {
      console.error('Error recording deposit:', error);
      alert('Failed to record deposit');
    } finally {
      setRecordingDeposit(false);
    }
  };

  // Save deposit amount (from detail panel edit)
  const handleSaveDeposit = async () => {
    if (!selectedPerson) return;

    setSavingDeposit(true);
    try {
      const amount = parseFloat(depositAmount) || 0;
      const registrationRef = doc(db, 'registrations', selectedPerson.id);
      await updateDoc(registrationRef, { amtCollected: amount });

      // Update local state
      setRegistrations(prev =>
        prev.map(r => r.id === selectedPerson.id ? { ...r, amtCollected: amount } : r)
      );
      setSelectedPerson(prev => prev ? { ...prev, amtCollected: amount } : null);
      setEditingDeposit(false);
    } catch (error) {
      console.error('Error saving deposit:', error);
      alert('Failed to save deposit amount');
    } finally {
      setSavingDeposit(false);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalRegistrations = registrations.length;
  const groupParticipants = registrations.filter(r => r.participateGroup === true).length;
  const independentRiders = registrations.filter(r => r.participateGroup === false).length;
  const undecided = registrations.filter(r => r.participateGroup === null).length;
  // Helper function to get required deposit
  // Uses stored depositRequired if available, otherwise calculates from current rates
  // This ensures existing registrations keep their original quoted price
  const getRequiredDeposit = (reg: Registration) => {
    // Use stored value if it exists
    if (reg.depositRequired && reg.depositRequired > 0) {
      return reg.depositRequired;
    }
    // Fallback: calculate from current rates (for old registrations)
    const base = reg.participateGroup ? 500 : 100;
    return reg.hasPillion ? base * 2 : base;
  };

  // Geocode all participants and save coordinates to their records
  const geocodeAllParticipants = async () => {
    const toGeocode = registrations.filter(r => r.zipCode && !r.latitude);
    if (toGeocode.length === 0) {
      alert('All participants already have coordinates saved!');
      return;
    }

    setGeocoding(true);
    setGeocodeProgress({ done: 0, total: toGeocode.length });

    for (let i = 0; i < toGeocode.length; i++) {
      const reg = toGeocode[i];
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(reg.zipCode)}&country=US&format=json&limit=1`,
          {
            headers: { 'User-Agent': 'BajaTour2026Website' },
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const latitude = parseFloat(data[0].lat);
            const longitude = parseFloat(data[0].lon);

            // Save to Firestore
            const registrationRef = doc(db, 'registrations', reg.id);
            await updateDoc(registrationRef, { latitude, longitude });
            console.log(`Geocoded ${reg.fullName}: ${latitude}, ${longitude}`);
          }
        }

        // Respect rate limits - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1100)); // Nominatim allows 1 req/sec
      } catch (error) {
        console.error(`Failed to geocode ${reg.fullName}:`, error);
      }

      setGeocodeProgress({ done: i + 1, total: toGeocode.length });
    }

    setGeocoding(false);
    alert('Geocoding complete! Refresh the page to see updated data.');
  };

  const totalDepositCollected = registrations.reduce((sum, r) => sum + (r.amtCollected || 0), 0);
  const totalDepositExpected = registrations.reduce((sum, r) => {
    const required = getRequiredDeposit(r);
    return sum + required;
  }, 0);
  const preferCamping = registrations.filter(r => r.accommodationPreference === 'camping').length;
  const preferHotels = registrations.filter(r => r.accommodationPreference === 'hotels').length;
  const preferEither = registrations.filter(r => r.accommodationPreference === 'either').length;

  // Helper to format experience labels
  const formatExperience = (value: string) => {
    const labels: Record<string, string> = {
      'less1': 'Less than 1 year',
      '1to5': '1-5 years',
      '5to10': '5-10 years',
      '10plus': '10+ years',
      'none': 'None',
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced',
      'no': 'Never',
      'once': 'Once',
      'twice': 'Twice',
      'many': 'Many times',
      'basic': 'Basic',
      'comfortable': 'Comfortable',
      'macgyver': 'MacGyver level',
      'gringo': 'Gringo (none)',
      'read': 'Can read signs',
      'simple': 'Simple conversation',
      'fluent': 'Fluent'
    };
    return labels[value] || value;
  };

  // Toggle group expansion
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  // Navigation items grouped by category
  const navGroups = [
    {
      id: 'registration',
      label: 'Registration',
      icon: Users,
      items: [
        { id: 'registrations', label: 'All Registrations', icon: Users, type: 'tab' as const },
        { id: 'waitlist', label: `Waitlist${waitlistEntries.length > 0 ? ` (${waitlistEntries.length})` : ''}`, icon: ClipboardList, type: 'tab' as const },
        { id: 'profileViewer', label: 'Profile Viewer', icon: Eye, type: 'tab' as const },
        { id: '/admin/registration-cleanup', label: 'Registration Cleanup', icon: Wrench, type: 'link' as const },
      ]
    },
    {
      id: 'accommodations',
      label: 'Accommodations',
      icon: BedDouble,
      items: [
        { id: '/admin/room-assignments', label: 'Room Assignments', icon: BedDouble, type: 'link' as const },
        { id: '/admin/room-selections', label: 'Room Selections', icon: Hotel, type: 'link' as const },
        { id: 'accommodations', label: 'Rider Preferences', icon: UserCog, type: 'tab' as const },
        { id: '/admin/rider-preferences', label: 'Edit Preferences', icon: Settings, type: 'link' as const },
        { id: '/admin/nightly-config', label: 'Nightly Config', icon: Calendar, type: 'link' as const },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: Mail,
      items: [
        { id: '/admin/tour-update-email', label: 'Tour Update Email', icon: Send, type: 'link' as const },
        { id: '/admin/email-templates', label: 'Email Templates', icon: FileText, type: 'link' as const },
        { id: 'email', label: 'Compose Email', icon: Mail, type: 'tab' as const },
        { id: 'announcements', label: 'Announcements', icon: Megaphone, type: 'tab' as const },
        { id: 'emailList', label: 'Email List', icon: ClipboardList, type: 'tab' as const },
      ]
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: DollarSign,
      items: [
        { id: 'ledger', label: 'Ledger', icon: Receipt, type: 'tab' as const },
        { id: '/admin/post-charge', label: 'Post Charge', icon: CreditCard, type: 'link' as const },
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: Wrench,
      items: [
        { id: 'roster', label: 'Roster', icon: FileText, type: 'tab' as const },
        { id: 'jsonUpload', label: 'JSON Upload', icon: Upload, type: 'tab' as const },
      ]
    },
  ];

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
        <p className="text-xs text-slate-400">Baja Tour 2026</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map(group => (
          <div key={group.id} className="mb-1">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <group.icon className="h-4 w-4 text-slate-400" />
                <span>{group.label}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`} />
            </button>

            {/* Group Items */}
            {expandedGroups.has(group.id) && (
              <div className="ml-4 mt-1 space-y-0.5">
                {group.items.map(item => (
                  item.type === 'link' ? (
                    <Link
                      key={item.id}
                      to={item.id}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Back to Site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-800 border-r border-slate-700
        transform transition-transform duration-200 ease-in-out
        lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-slate-400 text-sm">Total Signups</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalRegistrations}</div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-slate-400 text-sm">Group Plan</span>
            </div>
            <div className="text-3xl font-bold text-white">{groupParticipants}</div>
            <div className="text-xs text-slate-500 mt-1">
              {independentRiders} independent, {undecided} undecided
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span className="text-slate-400 text-sm">Deposits</span>
            </div>
            <div className="text-3xl font-bold text-white">${totalDepositCollected}</div>
            <div className="text-xs text-slate-500 mt-1">
              of ${totalDepositExpected} expected
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Hotel className="h-5 w-5 text-purple-400" />
              <span className="text-slate-400 text-sm">Accommodation</span>
            </div>
            <div className="text-sm text-white space-y-1 mt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Camping:</span>
                <span>{preferCamping}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hotels:</span>
                <span>{preferHotels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Either:</span>
                <span>{preferEither}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'registrations' && (
          /* Registrations Tab */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Registration List */}
          <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Registrations</h2>
                <button
                  onClick={geocodeAllParticipants}
                  disabled={geocoding}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  title="Geocode zip codes for map display"
                >
                  {geocoding ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {geocodeProgress.done}/{geocodeProgress.total}
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      Geocode
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {registrations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No registrations yet
                </div>
              ) : (
                registrations.map((reg) => {
                  const requiredDeposit = getRequiredDeposit(reg);
                  const depositStatus = (reg.amtCollected || 0) >= requiredDeposit;

                  return (
                    <button
                      key={reg.id}
                      onClick={() => {
                        setSelectedPerson(reg);
                        setDepositAmount(String(reg.amtCollected || 0));
                        setEditingDeposit(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700 text-left ${
                        selectedPerson?.id === reg.id ? 'bg-slate-700/50' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden flex-shrink-0">
                        {reg.headshotUrl ? (
                          <img
                            src={reg.headshotUrl}
                            alt={reg.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            {reg.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{reg.fullName}</div>
                        <div className="text-sm text-slate-400 truncate">
                          {reg.city}, {reg.state}
                        </div>
                      </div>

                      {/* Status indicators and Record Deposit button */}
                      <div className="flex items-center gap-2">
                        {depositStatus ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <button
                            onClick={(e) => openDepositModal(reg, e)}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          >
                            Record Deposit
                          </button>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {selectedPerson ? (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-600 overflow-hidden">
                      {selectedPerson.headshotUrl ? (
                        <img
                          src={selectedPerson.headshotUrl}
                          alt={selectedPerson.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-slate-400">
                          {selectedPerson.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedPerson.fullName}</h2>
                      {selectedPerson.nickname && (
                        <p className="text-slate-400">"{selectedPerson.nickname}"</p>
                      )}
                      {selectedPerson.tagline && (
                        <p className="text-sm text-slate-500 italic">{selectedPerson.tagline}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPerson(null)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Deposit Status */}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        Deposit Status
                      </h3>
                      {!editingDeposit && (
                        <button
                          onClick={() => setEditingDeposit(true)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingDeposit ? (
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                        />
                        <button
                          onClick={handleSaveDeposit}
                          disabled={savingDeposit}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                        >
                          {savingDeposit ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeposit(false);
                            setDepositAmount(String(selectedPerson.amtCollected || 0));
                          }}
                          className="px-4 py-2 text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Required</div>
                          <div className="text-white font-semibold">
                            ${getRequiredDeposit(selectedPerson)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Collected</div>
                          <div className="text-white font-semibold">
                            ${selectedPerson.amtCollected || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Balance</div>
                          <div className={`font-semibold ${
                            (selectedPerson.amtCollected || 0) >= getRequiredDeposit(selectedPerson)
                              ? 'text-green-400'
                              : 'text-amber-400'
                          }`}>
                            ${Math.max(0, getRequiredDeposit(selectedPerson) - (selectedPerson.amtCollected || 0))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <a href={`mailto:${selectedPerson.email}`} className="text-blue-400 hover:text-blue-300">
                          {selectedPerson.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${selectedPerson.phone}`} className="text-blue-400 hover:text-blue-300">
                          {selectedPerson.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">
                          {selectedPerson.city}, {selectedPerson.state} {selectedPerson.zipCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Emergency Contact
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Name:</span>
                        <span className="text-white">{selectedPerson.emergencyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <a href={`tel:${selectedPerson.emergencyPhone}`} className="text-blue-400 hover:text-blue-300">
                          {selectedPerson.emergencyPhone}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Relationship:</span>
                        <span className="text-white">{selectedPerson.emergencyRelation}</span>
                      </div>
                      {selectedPerson.medicalConditions && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="text-slate-400 mb-1">Medical Conditions:</div>
                          <div className="text-amber-300">{selectedPerson.medicalConditions}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Motorcycle & Experience */}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Bike className="h-4 w-4 text-blue-400" />
                      Motorcycle & Experience
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Motorcycle</div>
                        <div className="text-white">{selectedPerson.bikeYear} {selectedPerson.bikeModel}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Years Riding</div>
                        <div className="text-white">{formatExperience(selectedPerson.yearsRiding)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Off-Road Experience</div>
                        <div className="text-white">{formatExperience(selectedPerson.offRoadExperience)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Baja Tours</div>
                        <div className="text-white">{formatExperience(selectedPerson.bajaTourExperience)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Repair Skills</div>
                        <div className="text-white">{formatExperience(selectedPerson.repairExperience)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Spanish Level</div>
                        <div className="text-white">{formatExperience(selectedPerson.spanishLevel)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-purple-400" />
                      Preferences
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Group Plan</div>
                        <div className={`font-semibold ${
                          selectedPerson.participateGroup === true ? 'text-green-400' :
                          selectedPerson.participateGroup === false ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {selectedPerson.participateGroup === true ? 'Yes' :
                           selectedPerson.participateGroup === false ? 'No' : 'Undecided'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Accommodation</div>
                        <div className="text-white capitalize">{selectedPerson.accommodationPreference}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Has Pillion</div>
                        <div className="text-white">{selectedPerson.hasPillion ? 'Yes' : 'No'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">T-Shirt Size</div>
                        <div className="text-white">{selectedPerson.tshirtSize || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Passport Valid</div>
                        <div className={selectedPerson.passportValid ? 'text-green-400' : 'text-red-400'}>
                          {selectedPerson.passportValid ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Garmin InReach</div>
                        <div className="text-white">{selectedPerson.hasGarminInreach ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    {/* Flexibility checkboxes */}
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {selectedPerson.flexibleAccommodations ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-500" />
                        )}
                        <span className="text-slate-300">Flexible with accommodations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPerson.okSharingSameGender ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-500" />
                        )}
                        <span className="text-slate-300">OK sharing with same gender</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPerson.okGroupMeals ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-500" />
                        )}
                        <span className="text-slate-300">OK with group meals</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Skills to Share</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPerson.skillMechanical && (
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                          Mechanical
                        </span>
                      )}
                      {selectedPerson.skillMedical && (
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                          Medical
                        </span>
                      )}
                      {selectedPerson.skillPhotography && (
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                          Photography
                        </span>
                      )}
                      {selectedPerson.skillOther && selectedPerson.skillOtherText && (
                        <span className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm">
                          {selectedPerson.skillOtherText}
                        </span>
                      )}
                      {!selectedPerson.skillMechanical && !selectedPerson.skillMedical &&
                       !selectedPerson.skillPhotography && !selectedPerson.skillOther && (
                        <span className="text-slate-500">None specified</span>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {selectedPerson.anythingElse && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3">Additional Notes</h3>
                      <p className="text-slate-300 whitespace-pre-line">{selectedPerson.anythingElse}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 p-8">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a registration to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'email' && (
          /* Email Tab - Using EmailComposer component */
          <EmailComposer registrations={registrations} />
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Create Announcement */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-400" />
                Post New Announcement
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message *</label>
                  <textarea
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Write your announcement..."
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      announcementPriority === 'normal'
                        ? 'bg-slate-600/20 border-slate-500 text-white'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="priority"
                        checked={announcementPriority === 'normal'}
                        onChange={() => setAnnouncementPriority('normal')}
                        className="sr-only"
                      />
                      Normal
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      announcementPriority === 'important'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="priority"
                        checked={announcementPriority === 'important'}
                        onChange={() => setAnnouncementPriority('important')}
                        className="sr-only"
                      />
                      Important
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      announcementPriority === 'urgent'
                        ? 'bg-red-600/20 border-red-500 text-red-300'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}>
                      <input
                        type="radio"
                        name="priority"
                        checked={announcementPriority === 'urgent'}
                        onChange={() => setAnnouncementPriority('urgent')}
                        className="sr-only"
                      />
                      Urgent
                    </label>
                  </div>
                </div>

                <button
                  onClick={handlePostAnnouncement}
                  disabled={postingAnnouncement || !announcementTitle.trim() || !announcementMessage.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {postingAnnouncement ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </div>

            {/* Existing Announcements */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Active Announcements ({announcements.length})
              </h3>

              {announcements.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No announcements yet</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => {
                    const priorityColors = {
                      normal: 'border-l-slate-500',
                      important: 'border-l-amber-500',
                      urgent: 'border-l-red-500'
                    };
                    const priorityBadge = {
                      normal: null,
                      important: <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded">Important</span>,
                      urgent: <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded">Urgent</span>
                    };

                    return (
                      <div
                        key={announcement.id}
                        className={`p-4 bg-slate-900/50 rounded-lg border-l-4 ${priorityColors[announcement.priority]}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium">{announcement.title}</h4>
                              {priorityBadge[announcement.priority]}
                            </div>
                            <p className="text-slate-400 text-sm">{announcement.message}</p>
                            <p className="text-slate-500 text-xs mt-2">
                              Posted {announcement.createdAt?.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded transition-colors"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email List Tab */}
        {activeTab === 'emailList' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-400" />
                All Registrant Emails ({registrations.length})
              </h3>
              <button
                onClick={() => {
                  const emails = registrations.map(r => r.email).join(', ');
                  navigator.clipboard.writeText(emails);
                  alert('Emails copied to clipboard!');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Copy All Emails
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-4">
              Click the button above to copy all emails, or select and copy from the box below:
            </p>

            <textarea
              readOnly
              value={registrations.map(r => r.email).join(', ')}
              rows={6}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />

            <div className="mt-6">
              <h4 className="text-white font-medium mb-3">Individual Emails:</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                  >
                    <div>
                      <span className="text-white">{reg.fullName}</span>
                      <span className="text-slate-500 mx-2">—</span>
                      <span className="text-blue-400">{reg.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Accommodations Tab */}
        {activeTab === 'accommodations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-blue-400" />
                Accommodation Selections ({userAccommodations.length} responses)
              </h3>
            </div>

            {loadingAccommodations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              </div>
            ) : userAccommodations.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <BedDouble className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No accommodation selections recorded yet</p>
              </div>
            ) : (
              /* Night Cards */
              <div className="space-y-3">
                {TRIP_NIGHTS.map((nightInfo) => {
                  const nightKey = nightInfo.key;
                  const config = nightConfigs[nightKey];
                  const counts = getAccommodationCounts(nightKey);
                  const isExpanded = expandedNights.has(nightKey);
                  const sortedUsers = getSortedUsersForNight(nightKey);

                  return (
                    <div
                      key={nightKey}
                      className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                    >
                      {/* Header - Clickable */}
                      <button
                        onClick={() => toggleNight(nightKey)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <h4 className="text-white font-semibold">
                              {nightInfo.label}
                            </h4>
                            <p className="text-sm text-slate-400">
                              {config?.hotelName || nightInfo.location || 'TBD'}
                            </p>
                          </div>
                        </div>

                        {/* Counts Summary */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/20 rounded">
                              <Hotel className="h-4 w-4 text-blue-400" />
                              <span className="text-blue-300">{counts.hotel}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-600/20 rounded">
                              <Tent className="h-4 w-4 text-green-400" />
                              <span className="text-green-300">{counts.camping}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-600/20 rounded">
                              <UserX className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-300">{counts.own}</span>
                            </div>
                            {counts.none > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-600/20 rounded">
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                                <span className="text-amber-300">{counts.none}</span>
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-slate-700">
                          {/* Legend */}
                          <div className="px-4 py-2 bg-slate-900/50 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Hotel className="h-3 w-3 text-blue-400" /> Hotel
                            </span>
                            <span className="flex items-center gap-1">
                              <Tent className="h-3 w-3 text-green-400" /> Camping
                            </span>
                            <span className="flex items-center gap-1">
                              <UserX className="h-3 w-3 text-slate-400" /> On Your Own
                            </span>
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-3 w-3 text-purple-400" /> Single Room
                            </span>
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="h-3 w-3 text-amber-400" /> Dinner
                            </span>
                            <span className="flex items-center gap-1">
                              <Coffee className="h-3 w-3 text-amber-400" /> Breakfast
                            </span>
                            <span className="flex items-center gap-1">
                              <Compass className="h-3 w-3 text-cyan-400" /> Activity
                            </span>
                          </div>

                          {/* User List */}
                          <div className="divide-y divide-slate-700">
                            {sortedUsers.map((userData) => {
                              const selection = userData.selections[nightKey];
                              const accommodation = selection?.accommodation;

                              const accomIcon = accommodation === 'hotel' ? (
                                <Hotel className="h-4 w-4 text-blue-400" />
                              ) : accommodation === 'camping' ? (
                                <Tent className="h-4 w-4 text-green-400" />
                              ) : accommodation === 'own' ? (
                                <UserX className="h-4 w-4 text-slate-400" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                              );

                              const accomLabel = accommodation === 'hotel' ? 'Hotel' :
                                accommodation === 'camping' ? 'Camping' :
                                accommodation === 'own' ? 'On Your Own' : 'Not Selected';

                              return (
                                <div
                                  key={userData.odUserId}
                                  className="p-4 hover:bg-slate-700/30 transition-colors"
                                >
                                  <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden flex-shrink-0">
                                      {userData.odHeadshotUrl ? (
                                        <img
                                          src={userData.odHeadshotUrl}
                                          alt={userData.odName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                          {userData.odName?.charAt(0) || '?'}
                                        </div>
                                      )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-white font-medium">{userData.odName}</span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-700 rounded text-xs">
                                          {accomIcon}
                                          <span className="text-slate-300">{accomLabel}</span>
                                        </span>
                                      </div>
                                      {userData.odEmail && (
                                        <p className="text-xs text-slate-400 mb-2">{userData.odEmail}</p>
                                      )}

                                      {/* Selection Details */}
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        {/* Single Room */}
                                        {selection?.prefersSingleRoom && (
                                          <span className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 rounded text-purple-300">
                                            <BedDouble className="h-3 w-3" />
                                            Single Room
                                          </span>
                                        )}

                                        {/* Floor Sleeping */}
                                        {selection?.prefersFloorSleeping && (
                                          <span className="flex items-center gap-1 px-2 py-1 bg-slate-600/30 rounded text-slate-300">
                                            Floor Sleeping OK
                                          </span>
                                        )}

                                        {/* Dinner */}
                                        {selection?.dinner && (
                                          <span className="flex items-center gap-1 px-2 py-1 bg-amber-600/20 rounded text-amber-300">
                                            <UtensilsCrossed className="h-3 w-3" />
                                            Dinner
                                          </span>
                                        )}

                                        {/* Breakfast */}
                                        {selection?.breakfast && (
                                          <span className="flex items-center gap-1 px-2 py-1 bg-amber-600/20 rounded text-amber-300">
                                            <Coffee className="h-3 w-3" />
                                            Breakfast
                                          </span>
                                        )}

                                        {/* Activities */}
                                        {selection?.optionalActivitiesInterested && selection.optionalActivitiesInterested.length > 0 && (
                                          selection.optionalActivitiesInterested.map((actId: string) => {
                                            const activity = config?.optionalActivities?.find((a: OptionalActivity) => a.id === actId);
                                            return (
                                              <span
                                                key={actId}
                                                className="flex items-center gap-1 px-2 py-1 bg-cyan-600/20 rounded text-cyan-300"
                                              >
                                                <Compass className="h-3 w-3" />
                                                {activity?.title || actId}
                                              </span>
                                            );
                                          })
                                        )}
                                      </div>

                                      {/* Roommate & Dietary */}
                                      {(userData.preferredRoommate || userData.dietaryRestrictions) && (
                                        <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400 space-y-1">
                                          {userData.preferredRoommate && (
                                            <div className="flex items-center gap-1">
                                              <UserRound className="h-3 w-3" />
                                              <span>Prefers: {getRoommateName(userData.preferredRoommate) || userData.preferredRoommate}</span>
                                            </div>
                                          )}
                                          {userData.dietaryRestrictions && (
                                            <div className="flex items-start gap-1">
                                              <UtensilsCrossed className="h-3 w-3 mt-0.5" />
                                              <span>Diet: {userData.dietaryRestrictions}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            {/* All Riders Summary */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-600 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                All Riders Summary
              </h3>
              {!allRidersTotals.loaded ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading totals...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-1">Total Payments</div>
                    <div className="text-2xl font-bold text-green-400">
                      ${allRidersTotals.totalPayments.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-1">Estimated Charges</div>
                    <div className="text-2xl font-bold text-white">
                      ${allRidersTotals.totalEstimatedCharges.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-1">Posted Charges</div>
                    <div className="text-2xl font-bold text-amber-400">
                      ${allRidersTotals.totalPostedCharges.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-1">
                      {allRidersTotals.totalPayments >= allRidersTotals.totalEstimatedCharges ? 'Balance (Credit)' : 'Balance Due'}
                    </div>
                    <div className={`text-2xl font-bold ${
                      allRidersTotals.totalPayments >= allRidersTotals.totalEstimatedCharges
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      ${Math.abs(allRidersTotals.totalEstimatedCharges - allRidersTotals.totalPayments).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rider Selector */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-400" />
                Rider Ledger
              </h3>
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedLedgerUserId || ''}
                  onChange={(e) => setSelectedLedgerUserId(e.target.value || null)}
                  className="flex-1 min-w-[250px] px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a rider...</option>
                  {registrations.map((reg) => (
                    <option key={reg.uid} value={reg.uid}>
                      {reg.fullName}
                    </option>
                  ))}
                </select>
                {selectedLedgerUserId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowChargeModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Post Charge
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Record Payment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Statement Content */}
            {selectedLedgerUserId && (
              <>
                {loadingLedger ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Estimated Charges Section */}
                    {(() => {
                      const estimates = calculateEstimatedCharges(selectedLedgerUserId);
                      const totalEstimate = estimates.reduce((sum, e) => sum + e.amount, 0);
                      const isExpanded = expandedLedgerSections.has('estimates');

                      return (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                          <button
                            onClick={() => setExpandedLedgerSections(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has('estimates')) newSet.delete('estimates');
                              else newSet.add('estimates');
                              return newSet;
                            })}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-slate-400" />
                              <span className="text-white font-semibold">Estimated Charges</span>
                              <span className="text-slate-400 text-sm">({estimates.length} items)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-semibold">${totalEstimate.toFixed(2)}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-slate-700">
                              {estimates.length === 0 ? (
                                <p className="text-slate-400 text-sm pt-4">
                                  No selections recorded. Rider needs to complete their accommodation preferences.
                                </p>
                              ) : (
                                <div className="space-y-2 pt-4">
                                  {estimates.map((est, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-700/50">
                                      <span className="text-slate-300">{est.description}</span>
                                      <span className="text-slate-300">${est.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Posted Charges Section */}
                    {(() => {
                      const totalCharges = ledgerCharges.reduce((sum, c) => sum + c.amount, 0);
                      const isExpanded = expandedLedgerSections.has('charges');

                      return (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                          <button
                            onClick={() => setExpandedLedgerSections(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has('charges')) newSet.delete('charges');
                              else newSet.add('charges');
                              return newSet;
                            })}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-amber-400" />
                              <span className="text-white font-semibold">Posted Charges</span>
                              <span className="text-slate-400 text-sm">({ledgerCharges.length} items)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-amber-400 font-semibold">${totalCharges.toFixed(2)}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-slate-700">
                              {ledgerCharges.length === 0 ? (
                                <p className="text-slate-400 text-sm pt-4">No charges posted yet.</p>
                              ) : (
                                <div className="space-y-2 pt-4">
                                  {ledgerCharges.map((charge) => (
                                    <div key={charge.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-700/50">
                                      <div className="flex-1">
                                        <span className="text-slate-300">{charge.description}</span>
                                        <span className="text-slate-500 text-xs ml-2">
                                          ({charge.date.toLocaleDateString()})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={charge.amount >= 0 ? 'text-amber-400' : 'text-green-400'}>
                                          {charge.amount >= 0 ? '' : '-'}${Math.abs(charge.amount).toFixed(2)}
                                        </span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteCharge(charge.id); }}
                                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Payments Section */}
                    {(() => {
                      const totalPayments = ledgerPayments.reduce((sum, p) => sum + p.amount, 0);
                      const isExpanded = expandedLedgerSections.has('payments');

                      return (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                          <button
                            onClick={() => setExpandedLedgerSections(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has('payments')) newSet.delete('payments');
                              else newSet.add('payments');
                              return newSet;
                            })}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Banknote className="h-5 w-5 text-green-400" />
                              <span className="text-white font-semibold">Payments Received</span>
                              <span className="text-slate-400 text-sm">({ledgerPayments.length} items)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-green-400 font-semibold">${totalPayments.toFixed(2)}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-slate-700">
                              {ledgerPayments.length === 0 ? (
                                <p className="text-slate-400 text-sm pt-4">No payments recorded yet.</p>
                              ) : (
                                <div className="space-y-2 pt-4">
                                  {ledgerPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-700/50">
                                      <div className="flex-1 flex items-center gap-2">
                                        {payment.method === 'venmo' && <CreditCard className="h-4 w-4 text-blue-400" />}
                                        {payment.method === 'zelle' && <CreditCard className="h-4 w-4 text-purple-400" />}
                                        {payment.method === 'cash' && <Banknote className="h-4 w-4 text-green-400" />}
                                        <span className="text-slate-300">
                                          {payment.note || payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                          ({payment.date.toLocaleDateString()})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-green-400">${payment.amount.toFixed(2)}</span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.id); }}
                                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Balance Summary */}
                    <div className="bg-slate-900 rounded-xl border border-slate-600 p-6">
                      <h4 className="text-white font-semibold mb-4">Balance Summary</h4>
                      {(() => {
                        const totalCharges = ledgerCharges.reduce((sum, c) => sum + c.amount, 0);
                        const totalPayments = ledgerPayments.reduce((sum, p) => sum + p.amount, 0);
                        const estimates = calculateEstimatedCharges(selectedLedgerUserId);
                        const totalEstimate = estimates.reduce((sum, e) => sum + e.amount, 0);
                        const estimatedBalance = totalEstimate - totalPayments;

                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Estimated Charges:</span>
                              <span className="text-white">${totalEstimate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Posted Charges:</span>
                              <span className="text-white">${totalCharges.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Payments:</span>
                              <span className="text-green-400">${totalPayments.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-700 font-semibold">
                              <span className="text-white">Estimated Balance:</span>
                              <span className={estimatedBalance > 0 ? 'text-amber-400' : estimatedBalance < 0 ? 'text-green-400' : 'text-white'}>
                                {estimatedBalance > 0 ? `$${estimatedBalance.toFixed(2)} owed` : estimatedBalance < 0 ? `$${Math.abs(estimatedBalance).toFixed(2)} credit` : '$0.00'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </>
            )}

            {!selectedLedgerUserId && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <Receipt className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Select a rider to view their ledger</p>
              </div>
            )}
          </div>
        )}

        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Rider Roster ({registrations.length})
              </h3>
              <button
                onClick={() => {
                  // Copy roster to clipboard as TSV for pasting into spreadsheets
                  const headers = ['Name', 'Phone', 'Email', ...TRIP_NIGHTS.map((_, i) => `N${i + 1}`), 'Roommate'];
                  const rows = registrations.map(reg => {
                    const userData = userAccommodations.find(u => u.odUserId === reg.uid);
                    const nightCells = TRIP_NIGHTS.map(night => {
                      const sel = userData?.selections?.[night.key];
                      if (!sel?.accommodation) return '-';
                      return sel.accommodation === 'hotel' ? 'H' : sel.accommodation === 'camping' ? 'C' : 'O';
                    });
                    const roommateReg = userData?.preferredRoommate
                      ? registrations.find(r => r.id === userData.preferredRoommate || r.uid === userData.preferredRoommate)
                      : null;
                    const roommateName = roommateReg?.fullName || '-';
                    return [
                      reg.fullName,
                      reg.phone,
                      reg.email,
                      ...nightCells,
                      roommateName
                    ].join('\t');
                  });
                  navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
                  alert('Roster copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-left">
                    <th className="px-3 py-2 text-slate-400 font-medium sticky left-0 bg-slate-900/50">Name</th>
                    <th className="px-3 py-2 text-slate-400 font-medium whitespace-nowrap">Phone</th>
                    <th className="px-3 py-2 text-slate-400 font-medium">Email</th>
                    {TRIP_NIGHTS.map((night, idx) => (
                      <th key={night.key} className="px-2 py-2 text-slate-400 font-medium text-center" title={night.label}>
                        N{idx + 1}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-slate-400 font-medium">Roommate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {registrations.map(reg => {
                    const userData = userAccommodations.find(u => u.odUserId === reg.uid);
                    return (
                      <tr key={reg.id} className="hover:bg-slate-700/30">
                        <td className="px-3 py-2 text-white font-medium whitespace-nowrap sticky left-0 bg-slate-800">
                          {reg.nickname || reg.fullName.split(' ')[0]}
                        </td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                          <a href={`tel:${reg.phone}`} className="hover:text-blue-400">{reg.phone}</a>
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          <a href={`mailto:${reg.email}`} className="hover:text-blue-400 truncate block max-w-[180px]">{reg.email}</a>
                        </td>
                        {TRIP_NIGHTS.map(night => {
                          const sel = userData?.selections?.[night.key];
                          const accom = sel?.accommodation;
                          let display = '-';
                          let colorClass = 'text-slate-500';
                          if (accom === 'hotel') {
                            display = 'H';
                            colorClass = 'text-blue-400';
                          } else if (accom === 'camping') {
                            display = 'C';
                            colorClass = 'text-green-400';
                          } else if (accom === 'own') {
                            display = 'O';
                            colorClass = 'text-amber-400';
                          }
                          return (
                            <td key={night.key} className={`px-2 py-2 text-center font-medium ${colorClass}`}>
                              {display}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                          {(() => {
                            if (!userData?.preferredRoommate) return '-';
                            const roommateReg = registrations.find(r => r.id === userData.preferredRoommate || r.uid === userData.preferredRoommate);
                            return roommateReg?.fullName || '-';
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-700 text-xs text-slate-500">
              <span className="mr-4"><span className="text-blue-400 font-medium">H</span> = Hotel</span>
              <span className="mr-4"><span className="text-green-400 font-medium">C</span> = Camping</span>
              <span className="mr-4"><span className="text-amber-400 font-medium">O</span> = Own</span>
              <span><span className="text-slate-500 font-medium">-</span> = Not selected</span>
            </div>
          </div>
        )}

        {/* Profile Viewer Tab */}
        {activeTab === 'profileViewer' && (
          <div className="space-y-6">
            {/* Rider Selection */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                Select Rider to View Profile
              </h3>
              <select
                value={selectedProfileUserId || ''}
                onChange={(e) => setSelectedProfileUserId(e.target.value || null)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select a rider --</option>
                {registrations
                  .slice()
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map(reg => (
                    <option key={reg.id} value={reg.uid}>
                      {reg.fullName} {reg.nickname ? `"${reg.nickname}"` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Profile Display */}
            {selectedProfileUserId && (() => {
              const profileReg = registrations.find(r => r.uid === selectedProfileUserId);
              if (!profileReg) return null;

              const userData = userAccommodations.find(u => u.odUserId === selectedProfileUserId);

              // Build skills list
              const skills: string[] = [];
              if (profileReg.skillMechanical) skills.push('Mechanical');
              if (profileReg.skillMedical) skills.push('Medical');
              if (profileReg.skillPhotography) skills.push('Photography');
              if (profileReg.skillOther && profileReg.skillOtherText) skills.push(profileReg.skillOtherText);

              // Format helper functions
              const formatYearsRiding = (value: string): string => {
                const map: Record<string, string> = {
                  less1: 'Less than 1 year', '1to5': '1-5 years', '5to10': '5-10 years', '10plus': '10+ years'
                };
                return map[value] || value;
              };
              const formatOffRoad = (value: string): string => {
                const map: Record<string, string> = {
                  none: 'No off-road experience', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced'
                };
                return map[value] || value;
              };
              const formatBaja = (value: string): string => {
                const map: Record<string, string> = {
                  no: 'First time', once: 'Once before', twice: 'Twice before', many: 'Many times'
                };
                return map[value] || value;
              };
              const formatRepair = (value: string): string => {
                const map: Record<string, string> = {
                  none: 'None', basic: 'Basic', comfortable: 'Comfortable', macgyver: 'MacGyver level'
                };
                return map[value] || value;
              };
              const formatAccom = (value: string): string => {
                const map: Record<string, string> = {
                  camping: 'Prefer camping', hotels: 'Prefer hotels', either: 'Either is fine'
                };
                return map[value] || value;
              };

              return (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <UserRound className="h-5 w-5 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                    </div>
                    <div className="flex items-start gap-6">
                      {/* Photo */}
                      <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600 flex-shrink-0">
                        {profileReg.headshotUrl ? (
                          <img src={profileReg.headshotUrl} alt={profileReg.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-slate-400">{profileReg.fullName?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {profileReg.fullName}
                            {profileReg.nickname && <span className="text-slate-400 font-normal ml-2">"{profileReg.nickname}"</span>}
                          </h3>
                          {profileReg.tagline && <p className="text-slate-400 italic">{profileReg.tagline}</p>}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            {profileReg.city}, {profileReg.state} {profileReg.zipCode}
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <a href={`tel:${profileReg.phone}`} className="hover:text-blue-400">{profileReg.phone}</a>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <a href={`mailto:${profileReg.email}`} className="hover:text-blue-400">{profileReg.email}</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Emergency Contact */}
                  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Emergency Contact</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-sm">Contact</p>
                        <p className="text-white">{profileReg.emergencyName}</p>
                        <p className="text-slate-400 text-sm">{profileReg.emergencyRelation}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Phone</p>
                        <p className="text-white">
                          <a href={`tel:${profileReg.emergencyPhone}`} className="hover:text-blue-400">{profileReg.emergencyPhone}</a>
                        </p>
                      </div>
                      {profileReg.medicalConditions && (
                        <div className="md:col-span-2">
                          <p className="text-slate-500 text-sm">Medical Conditions / Allergies</p>
                          <p className="text-white">{profileReg.medicalConditions}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Motorcycle & Experience */}
                  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Bike className="h-5 w-5 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Motorcycle & Experience</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-sm">Motorcycle</p>
                        <p className="text-white">{profileReg.bikeYear} {profileReg.bikeModel}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Years Riding</p>
                        <p className="text-white">{formatYearsRiding(profileReg.yearsRiding)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Off-Road Experience</p>
                        <p className="text-white">{formatOffRoad(profileReg.offRoadExperience)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Repair Experience</p>
                        <p className="text-white">{formatRepair(profileReg.repairExperience)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Baja Experience</p>
                        <p className="text-white">{formatBaja(profileReg.bajaTourExperience)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Spanish Level</p>
                        <p className="text-white">{formatExperience(profileReg.spanishLevel)}</p>
                      </div>
                    </div>
                  </section>

                  {/* Skills & Equipment */}
                  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                        <Settings className="h-5 w-5 text-green-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Skills & Equipment</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-sm">T-Shirt Size</p>
                        <p className="text-white">{profileReg.tshirtSize || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Equipment</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profileReg.passportValid && (
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Valid Passport</span>
                          )}
                          {profileReg.hasGarminInreach && (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Garmin InReach</span>
                          )}
                          {profileReg.hasToolkit && (
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">Toolkit</span>
                          )}
                          {!profileReg.passportValid && !profileReg.hasGarminInreach && !profileReg.hasToolkit && (
                            <span className="text-slate-500 text-sm">None specified</span>
                          )}
                        </div>
                      </div>
                      {skills.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-slate-500 text-sm">Special Skills</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {skills.map((skill, idx) => (
                              <span key={idx} className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Pillion (if applicable) */}
                  {profileReg.hasPillion && (
                    <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-pink-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Pillion (Passenger)</h2>
                      </div>
                      <div className="text-slate-300">
                        <p className="text-white font-medium">Has Pillion: Yes</p>
                        <p className="text-slate-400 text-sm mt-1">Pillion details are included in their registration</p>
                      </div>
                    </section>
                  )}

                  {/* Accommodation Preferences */}
                  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <Hotel className="h-5 w-5 text-purple-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Accommodation Preferences</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-sm">Preference</p>
                        <p className="text-white">{formatAccom(profileReg.accommodationPreference)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Group Plan</p>
                        <p className="text-white">{profileReg.participateGroup ? 'Yes' : 'No'}</p>
                      </div>
                      {userData?.preferredRoommate && (
                        <div>
                          <p className="text-slate-500 text-sm">Preferred Roommate</p>
                          <p className="text-white">
                            {registrations.find(r => r.id === userData.preferredRoommate || r.uid === userData.preferredRoommate)?.fullName || 'Unknown'}
                          </p>
                        </div>
                      )}
                      {userData?.dietaryRestrictions && (
                        <div>
                          <p className="text-slate-500 text-sm">Dietary Restrictions</p>
                          <p className="text-white">{userData.dietaryRestrictions}</p>
                        </div>
                      )}
                    </div>

                    {/* Detailed Nightly Selections */}
                    {userData?.selections && Object.keys(userData.selections).length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-slate-500 text-sm mb-3">Detailed Nightly Selections</p>
                        <div className="space-y-3">
                          {TRIP_NIGHTS.map((night) => {
                            const sel = userData.selections[night.key];
                            const config = nightConfigs[night.key];
                            if (!sel?.accommodation) return null;

                            const accom = sel.accommodation;
                            let accomIcon = <UserX className="h-4 w-4" />;
                            let accomLabel = 'Own';
                            let accomColor = 'text-slate-400';
                            if (accom === 'hotel') {
                              accomIcon = <Hotel className="h-4 w-4" />;
                              accomLabel = 'Hotel';
                              accomColor = 'text-blue-400';
                            } else if (accom === 'camping') {
                              accomIcon = <Tent className="h-4 w-4" />;
                              accomLabel = 'Camping';
                              accomColor = 'text-green-400';
                            }

                            // Calculate night cost
                            let nightCost = 0;
                            if (config) {
                              if (accom === 'hotel' && config.hotelAvailable) nightCost += config.hotelCost;
                              else if (accom === 'camping' && config.campingAvailable) nightCost += config.campingCost;
                              if (sel.dinner && config.dinnerAvailable) nightCost += config.dinnerCost;
                              if (sel.breakfast && config.breakfastAvailable) nightCost += config.breakfastCost;
                              if (config.optionalActivities && sel.optionalActivitiesInterested) {
                                config.optionalActivities.forEach(act => {
                                  if (sel.optionalActivitiesInterested.includes(act.id)) nightCost += act.cost;
                                });
                              }
                            }

                            return (
                              <div key={night.key} className="bg-slate-900/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-white">{night.label}</span>
                                  <span className="text-slate-400 text-sm">${nightCost}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {/* Accommodation */}
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${accomColor} bg-slate-800`}>
                                    {accomIcon} {accomLabel}
                                  </span>
                                  {/* Single Room */}
                                  {sel.prefersSingleRoom && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-purple-400 bg-slate-800">
                                      <UserRound className="h-3 w-3" /> Single Room
                                    </span>
                                  )}
                                  {/* Floor Sleeping */}
                                  {sel.prefersFloorSleeping && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-cyan-400 bg-slate-800">
                                      Floor Sleep
                                    </span>
                                  )}
                                  {/* Dinner */}
                                  {sel.dinner && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-amber-400 bg-slate-800">
                                      <UtensilsCrossed className="h-3 w-3" /> Dinner
                                    </span>
                                  )}
                                  {/* Breakfast */}
                                  {sel.breakfast && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-orange-400 bg-slate-800">
                                      <Coffee className="h-3 w-3" /> Breakfast
                                    </span>
                                  )}
                                  {/* Optional Activities */}
                                  {sel.optionalActivitiesInterested && sel.optionalActivitiesInterested.length > 0 && config?.optionalActivities && (
                                    sel.optionalActivitiesInterested.map(actId => {
                                      const act = config.optionalActivities?.find(a => a.id === actId);
                                      return act ? (
                                        <span key={actId} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-emerald-400 bg-slate-800">
                                          <Compass className="h-3 w-3" /> {act.title}
                                        </span>
                                      ) : null;
                                    })
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Estimated Total */}
                        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-slate-400 font-medium">Estimated Total (from selections)</span>
                          <span className="text-xl font-bold text-white">
                            ${TRIP_NIGHTS.reduce((total, night) => {
                              const sel = userData.selections[night.key];
                              const config = nightConfigs[night.key];
                              if (!sel || !config) return total;
                              if (sel.accommodation === 'hotel' && config.hotelAvailable) total += config.hotelCost;
                              else if (sel.accommodation === 'camping' && config.campingAvailable) total += config.campingCost;
                              if (sel.dinner && config.dinnerAvailable) total += config.dinnerCost;
                              if (sel.breakfast && config.breakfastAvailable) total += config.breakfastCost;
                              if (config.optionalActivities && sel.optionalActivitiesInterested) {
                                config.optionalActivities.forEach(act => {
                                  if (sel.optionalActivitiesInterested.includes(act.id)) total += act.cost;
                                });
                              }
                              return total;
                            }, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Financial Summary */}
                  <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Financial Summary</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-slate-500 text-sm">Deposit Required</p>
                        <p className="text-white text-lg font-semibold">${profileReg.depositRequired || getRequiredDeposit(profileReg)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Amount Collected</p>
                        <p className="text-green-400 text-lg font-semibold">${profileReg.amtCollected || profileReg.depositPaid || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm">Balance</p>
                        <p className={`text-lg font-semibold ${
                          (profileReg.amtCollected || profileReg.depositPaid || 0) >= (profileReg.depositRequired || getRequiredDeposit(profileReg))
                            ? 'text-green-400'
                            : 'text-amber-400'
                        }`}>
                          ${Math.max(0, (profileReg.depositRequired || getRequiredDeposit(profileReg)) - (profileReg.amtCollected || profileReg.depositPaid || 0))} due
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Additional Notes */}
                  {profileReg.anythingElse && (
                    <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Additional Notes</h2>
                      </div>
                      <p className="text-slate-300">{profileReg.anythingElse}</p>
                    </section>
                  )}
                </div>
              );
            })()}

            {/* No selection */}
            {!selectedProfileUserId && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
                <Eye className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a rider from the dropdown above to view their full profile</p>
              </div>
            )}
          </div>
        )}

        {/* Waitlist Tab */}
        {activeTab === 'waitlist' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-400" />
                Waitlist ({waitlistEntries.length})
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                People who signed up after registration closed. Send them the invite link when a spot opens:
                <code className="ml-2 px-2 py-0.5 bg-slate-900 rounded text-amber-400 text-xs">
                  bajarun-2026.web.app/register?invite=baja2026
                </code>
              </p>
            </div>

            {loadingWaitlist ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-400">Loading waitlist...</p>
              </div>
            ) : waitlistEntries.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No one on the waitlist yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900/50 text-left">
                      <th className="px-4 py-3 text-slate-400 font-medium">Name</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Event</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Contact</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Location</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Bike</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Pillion</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Signed Up</th>
                      <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {waitlistEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{entry.fullName}</div>
                          {entry.notes && (
                            <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={entry.notes}>
                              {entry.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {entry.eventName ? (
                            <div>
                              <div className="text-slate-300 text-xs">{entry.eventName}</div>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs ${
                                entry.listType === 'interest'
                                  ? 'bg-purple-600/20 text-purple-400'
                                  : 'bg-amber-600/20 text-amber-400'
                              }`}>
                                {entry.listType === 'interest' ? 'Interest' : 'Waitlist'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-300">
                            <a href={`mailto:${entry.email}`} className="hover:text-blue-400 block">{entry.email}</a>
                            <a href={`tel:${entry.phone}`} className="hover:text-blue-400 text-sm text-slate-400">{entry.phone}</a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {entry.city}, {entry.state}
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {entry.bikeYear} {entry.bikeModel}
                        </td>
                        <td className="px-4 py-3">
                          {entry.hasPillion ? (
                            <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs">Yes</span>
                          ) : (
                            <span className="text-slate-500">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={entry.status}
                            onChange={(e) => handleUpdateWaitlistStatus(entry.id, e.target.value as WaitlistEntry['status'])}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                              entry.status === 'pending' ? 'bg-slate-600 text-slate-300' :
                              entry.status === 'contacted' ? 'bg-amber-600/20 text-amber-400' :
                              entry.status === 'promoted' ? 'bg-green-600/20 text-green-400' :
                              'bg-red-600/20 text-red-400'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="promoted">Promoted</option>
                            <option value="declined">Declined</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {entry.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteWaitlistEntry(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* JSON Upload Tab */}
        {activeTab === 'jsonUpload' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-purple-400" />
              Upload JSON to Firestore
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Paste JSON data to create or update documents. Dates in YYYY-MM-DD format will be converted to Firestore Timestamps.
              <br />
              <span className="text-purple-400">Batch upload:</span> Paste an array of objects with <code className="bg-slate-700 px-1 rounded">id</code> fields - each will be created as a separate document.
            </p>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Collection</label>
                  <input
                    type="text"
                    value={jsonCollection}
                    onChange={(e) => setJsonCollection(e.target.value)}
                    placeholder="e.g., tours"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Document ID <span className="text-slate-500">(optional for batch)</span></label>
                  <input
                    type="text"
                    value={jsonDocId}
                    onChange={(e) => setJsonDocId(e.target.value)}
                    placeholder="Leave empty for batch upload"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">JSON Data</label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  rows={12}
                  placeholder='{"name": "Baja 2026 Tour", "status": "closed", ...}'
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
              </div>

              {jsonResult && (
                <div className={`p-3 rounded-lg ${jsonResult.startsWith('Error') ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>
                  {jsonResult}
                </div>
              )}

              <button
                onClick={handleJsonUpload}
                disabled={uploadingJson}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {uploadingJson ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </>
                )}
              </button>

              {/* Quick Templates */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Quick Templates</h4>
                <p className="text-xs text-slate-500 mb-3">
                  registrationType: open (register), closed (no action), waitlist (join waitlist), interest (get notified)
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setJsonCollection('tours');
                      setJsonDocId('baja2026');
                      setJsonData(JSON.stringify({
                        name: "Baja 2026 Tour",
                        description: "An epic 9-day motorcycle adventure through Baja California.",
                        imageUrl: "",
                        registrationType: "closed",
                        maxParticipants: 30,
                        currentParticipants: 30,
                        depositAmount: 500,
                        sortOrder: 1,
                        startDate: "2026-03-14",
                        endDate: "2026-03-22"
                      }, null, 2));
                    }}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 text-sm rounded transition-colors"
                  >
                    Closed Tour
                  </button>
                  <button
                    onClick={() => {
                      setJsonCollection('tours');
                      setJsonDocId('baja2026');
                      setJsonData(JSON.stringify({
                        name: "Baja 2026 Tour",
                        description: "An epic 9-day motorcycle adventure through Baja California.",
                        imageUrl: "",
                        registrationType: "waitlist",
                        maxParticipants: 30,
                        currentParticipants: 30,
                        depositAmount: 500,
                        notice: "Registration is full! Join the waitlist and we'll contact you if a spot opens.",
                        sortOrder: 1,
                        startDate: "2026-03-14",
                        endDate: "2026-03-22"
                      }, null, 2));
                    }}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-sm rounded transition-colors"
                  >
                    Waitlist Tour
                  </button>
                  <button
                    onClick={() => {
                      setJsonCollection('tours');
                      setJsonDocId('future-tour');
                      setJsonData(JSON.stringify({
                        name: "Future Tour 2027",
                        description: "Details coming soon! Sign up to get notified when registration opens.",
                        imageUrl: "",
                        registrationType: "interest",
                        maxParticipants: 30,
                        currentParticipants: 0,
                        depositAmount: 500,
                        sortOrder: 2,
                        startDate: "2027-03-14",
                        endDate: "2027-03-22"
                      }, null, 2));
                    }}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded transition-colors"
                  >
                    Interest (Coming Soon)
                  </button>
                  <button
                    onClick={() => {
                      setJsonCollection('tours');
                      setJsonDocId('open-tour');
                      setJsonData(JSON.stringify({
                        name: "Open Tour",
                        description: "Registration is open! Join us for an epic adventure.",
                        imageUrl: "",
                        registrationType: "open",
                        maxParticipants: 30,
                        currentParticipants: 0,
                        depositAmount: 500,
                        sortOrder: 1,
                        startDate: "2026-06-01",
                        endDate: "2026-06-10"
                      }, null, 2));
                    }}
                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors"
                  >
                    Open Tour
                  </button>
                </div>

                {/* Room Inventory Templates */}
                <h4 className="text-sm font-medium text-slate-300 mb-3 mt-4">Room Inventory</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Collection: events/bajarun2026/roomInventory • isCamping: true for camping spots
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setJsonCollection('events/bajarun2026/roomInventory');
                      setJsonDocId('hotel-room-id');
                      setJsonData(JSON.stringify({
                        beds: ["Bed 1"],
                        checkIn: "2026-03-25",
                        checkOut: "2026-03-26",
                        day: 7,
                        id: "hotel-room-id",
                        isCamping: false,
                        location: "Tecate",
                        maxOccupancy: 2,
                        roomNumber: "R1",
                        suiteName: "Santuario Diegueño"
                      }, null, 2));
                    }}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                  >
                    Hotel Room
                  </button>
                  <button
                    onClick={() => {
                      setJsonCollection('events/bajarun2026/roomInventory');
                      setJsonDocId('camping-spot-id');
                      setJsonData(JSON.stringify({
                        beds: ["Tent"],
                        checkIn: "2026-03-26",
                        checkOut: "2026-03-27",
                        day: 8,
                        id: "camping-spot-id",
                        isCamping: true,
                        location: "Twentynine Palms",
                        maxOccupancy: 20,
                        roomNumber: "NA",
                        suiteName: "Indian Cove Camping"
                      }, null, 2));
                    }}
                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded transition-colors"
                  >
                    Camping Spot
                  </button>
                  <button
                    onClick={() => {
                      setJsonCollection('events/bajarun2026/roomInventory');
                      setJsonDocId('');
                      setJsonData(JSON.stringify([
                        { id: "own-day1", suiteName: "On Their Own", roomNumber: "NA", beds: [], maxOccupancy: 50, checkIn: "2026-03-19", checkOut: "2026-03-20", location: "Temecula", day: 1, isOwnAccommodation: true },
                        { id: "own-day2", suiteName: "On Their Own", roomNumber: "NA", beds: [], maxOccupancy: 50, checkIn: "2026-03-20", checkOut: "2026-03-21", location: "Meiling", day: 2, isOwnAccommodation: true },
                        { id: "own-day6", suiteName: "On Their Own", roomNumber: "NA", beds: [], maxOccupancy: 50, checkIn: "2026-03-24", checkOut: "2026-03-25", location: "BOLA", day: 6, isOwnAccommodation: true },
                        { id: "own-day7", suiteName: "On Their Own", roomNumber: "NA", beds: [], maxOccupancy: 50, checkIn: "2026-03-25", checkOut: "2026-03-26", location: "Tecate", day: 7, isOwnAccommodation: true },
                        { id: "own-day8", suiteName: "On Their Own", roomNumber: "NA", beds: [], maxOccupancy: 50, checkIn: "2026-03-26", checkOut: "2026-03-27", location: "TwentyNine Palms", day: 8, isOwnAccommodation: true }
                      ], null, 2));
                    }}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded transition-colors"
                  >
                    On Their Own (All Days)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Record Deposit Modal */}
      {showDepositModal && depositModalPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Record Deposit
              </h3>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositModalPerson(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Person info */}
              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden flex-shrink-0">
                  {depositModalPerson.headshotUrl ? (
                    <img
                      src={depositModalPerson.headshotUrl}
                      alt={depositModalPerson.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      {depositModalPerson.fullName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{depositModalPerson.fullName}</div>
                  <div className="text-sm text-slate-400">
                    Required: ${getRequiredDeposit(depositModalPerson)}
                    {depositModalPerson.hasPillion && ' (includes pillion)'}
                  </div>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount Collected
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={depositModalAmount}
                    onChange={(e) => setDepositModalAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositModalPerson(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordDeposit}
                  disabled={recordingDeposit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {recordingDeposit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {recordingDeposit ? 'Saving...' : 'Record Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Charge Modal */}
      {showChargeModal && selectedLedgerUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" />
                Post Charge
              </h3>
              <button
                onClick={() => setShowChargeModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Charge Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  value={newChargeType}
                  onChange={(e) => setNewChargeType(e.target.value as typeof newChargeType)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="accommodation">Accommodation</option>
                  <option value="meal">Meal</option>
                  <option value="fee">Fee</option>
                  <option value="adjustment">Adjustment/Credit</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newChargeDescription}
                  onChange={(e) => setNewChargeDescription(e.target.value)}
                  placeholder="e.g., Night 1 - Hotel San Ignacio"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount {newChargeType === 'adjustment' && '(use negative for credits)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={newChargeAmount}
                    onChange={(e) => setNewChargeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Night Key (optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Night (optional)</label>
                <select
                  value={newChargeNightKey}
                  onChange={(e) => setNewChargeNightKey(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Not specific to a night</option>
                  {TRIP_NIGHTS.map((night) => (
                    <option key={night.key} value={night.key}>{night.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowChargeModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCharge}
                  disabled={savingCharge || !newChargeDescription.trim() || !newChargeAmount}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {savingCharge ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingCharge ? 'Saving...' : 'Post Charge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedLedgerUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-400" />
                Record Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('venmo')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      newPaymentMethod === 'venmo'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Venmo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('zelle')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      newPaymentMethod === 'zelle'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Zelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('cash')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      newPaymentMethod === 'cash'
                        ? 'bg-green-600/20 border-green-500 text-green-300'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    Cash
                  </button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Note (optional)</label>
                <input
                  type="text"
                  value={newPaymentNote}
                  onChange={(e) => setNewPaymentNote(e.target.value)}
                  placeholder="e.g., Initial deposit"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={savingPayment || !newPaymentAmount}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {savingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
