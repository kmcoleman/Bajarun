/**
 * AdminRegistrationsPage.tsx
 *
 * Admin page for entering registration info for users.
 * Used to re-enter registrations from cached data.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Loader2,
  Check,
  User,
  Save,
  ChevronDown,
  Bike,
  Heart,
  Globe,
  Hotel,
  X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { formatPhoneNumber } from '../utils/formatters';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface UserOption {
  uid: string;
  email?: string;
  displayName?: string;
  hasRegistration: boolean;
}

interface FormData {
  // Personal Info
  fullName: string;
  nickname: string;
  tagline: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  // Emergency Contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  medicalConditions: string;
  // Motorcycle & Experience
  bikeModel: string;
  bikeYear: string;
  yearsRiding: string;
  offRoadExperience: string;
  bajaTourExperience: string;
  repairExperience: string;
  hasPillion: boolean;
  pillionName: string;
  pillionNickname: string;
  pillionPhone: string;
  pillionEmail: string;
  // Other
  spanishLevel: string;
  passportValid: boolean;
  tshirtSize: string;
  hasGarminInreach: boolean;
  hasToolkit: boolean;
  skillMechanical: boolean;
  skillMedical: boolean;
  skillPhotography: boolean;
  skillOther: boolean;
  skillOtherText: string;
  // Accommodation Preferences
  accommodationPreference: string;
  flexibleAccommodations: boolean;
  okSharingSameGender: boolean;
  okLessIdeal: boolean;
  okGroupMeals: boolean;
  okHotelCost: boolean;
  participateGroup: boolean;
  // Additional
  anythingElse: string;
}

const initialFormData: FormData = {
  fullName: '',
  nickname: '',
  tagline: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  medicalConditions: '',
  bikeModel: '',
  bikeYear: '',
  yearsRiding: '',
  offRoadExperience: '',
  bajaTourExperience: '',
  repairExperience: '',
  hasPillion: false,
  pillionName: '',
  pillionNickname: '',
  pillionPhone: '',
  pillionEmail: '',
  spanishLevel: '',
  passportValid: false,
  tshirtSize: '',
  hasGarminInreach: false,
  hasToolkit: false,
  skillMechanical: false,
  skillMedical: false,
  skillPhotography: false,
  skillOther: false,
  skillOtherText: '',
  accommodationPreference: 'either',
  flexibleAccommodations: false,
  okSharingSameGender: false,
  okLessIdeal: false,
  okGroupMeals: false,
  okHotelCost: false,
  participateGroup: true,
  anythingElse: ''
};

export default function AdminRegistrationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUid, setSelectedUid] = useState<string>('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOtherSkillModal, setShowOtherSkillModal] = useState(false);

  // Load users from the users collection
  useEffect(() => {
    async function loadUsers() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const userList: UserOption[] = [];

        const regsSnap = await getDocs(collection(db, 'registrations'));
        const registeredUids = new Set(regsSnap.docs.map(d => d.data().uid));

        usersSnap.forEach(doc => {
          userList.push({
            uid: doc.id,
            email: doc.data().email || undefined,
            displayName: doc.data().displayName || undefined,
            hasRegistration: registeredUids.has(doc.id)
          });
        });

        userList.sort((a, b) => {
          if (a.hasRegistration !== b.hasRegistration) {
            return a.hasRegistration ? 1 : -1;
          }
          return (a.email || a.uid).localeCompare(b.email || b.uid);
        });

        setUsers(userList);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Load existing registration if user already has one
  useEffect(() => {
    async function loadExistingRegistration() {
      if (!selectedUid) return;

      try {
        const regsSnap = await getDocs(collection(db, 'registrations'));
        const existing = regsSnap.docs.find(d => d.data().uid === selectedUid);

        const selectedUser = users.find(u => u.uid === selectedUid);
        const userEmail = selectedUser?.email || '';

        if (existing) {
          const data = existing.data();
          setFormData({
            fullName: data.fullName || '',
            nickname: data.nickname || '',
            tagline: data.tagline || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            phone: data.phone || '',
            email: data.email || userEmail,
            emergencyName: data.emergencyName || '',
            emergencyPhone: data.emergencyPhone || '',
            emergencyRelation: data.emergencyRelation || '',
            medicalConditions: data.medicalConditions || '',
            bikeModel: data.bikeModel || '',
            bikeYear: data.bikeYear || '',
            yearsRiding: data.yearsRiding || '',
            offRoadExperience: data.offRoadExperience || '',
            bajaTourExperience: data.bajaTourExperience || '',
            repairExperience: data.repairExperience || '',
            hasPillion: data.hasPillion || false,
            pillionName: data.pillionName || '',
            pillionNickname: data.pillionNickname || '',
            pillionPhone: data.pillionPhone || '',
            pillionEmail: data.pillionEmail || '',
            spanishLevel: data.spanishLevel || '',
            passportValid: data.passportValid || false,
            tshirtSize: data.tshirtSize || '',
            hasGarminInreach: data.hasGarminInreach || false,
            hasToolkit: data.hasToolkit || false,
            skillMechanical: data.skillMechanical || false,
            skillMedical: data.skillMedical || false,
            skillPhotography: data.skillPhotography || false,
            skillOther: data.skillOther || false,
            skillOtherText: data.skillOtherText || '',
            accommodationPreference: data.accommodationPreference || 'either',
            flexibleAccommodations: data.flexibleAccommodations || false,
            okSharingSameGender: data.okSharingSameGender || false,
            okLessIdeal: data.okLessIdeal || false,
            okGroupMeals: data.okGroupMeals || false,
            okHotelCost: data.okHotelCost || false,
            participateGroup: data.participateGroup ?? true,
            anythingElse: data.anythingElse || ''
          });
        } else {
          setFormData({
            ...initialFormData,
            email: userEmail
          });
        }
      } catch (error) {
        console.error('Error loading registration:', error);
      }
    }

    loadExistingRegistration();
  }, [selectedUid, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUid) {
      alert('Please select a user first');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const baseDeposit = formData.participateGroup ? 500 : 100;
      const depositRequired = formData.hasPillion ? baseDeposit * 2 : baseDeposit;

      const regsSnap = await getDocs(collection(db, 'registrations'));
      const existing = regsSnap.docs.find(d => d.data().uid === selectedUid);

      if (existing) {
        await setDoc(doc(db, 'registrations', existing.id), {
          ...formData,
          uid: selectedUid,
          depositRequired,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(doc(db, 'registrations', selectedUid), {
          ...formData,
          uid: selectedUid,
          depositRequired,
          depositPaid: 0,
          amtCollected: 0,
          createdAt: serverTimestamp()
        });
      }

      setSaved(true);
      setUsers(prev => prev.map(u =>
        u.uid === selectedUid ? { ...u, hasRegistration: true } : u
      ));
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving registration:', error);
      alert('Failed to save registration');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <AdminLayout title="Admin Registration Entry">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
    );
  }

  const selectedUser = users.find(u => u.uid === selectedUid);
  const unregisteredCount = users.filter(u => !u.hasRegistration).length;

  return (
    <AdminLayout title="Admin Registration Entry">
      <div className="max-w-4xl mx-auto">
        {/* Subtitle */}
        <p className="text-slate-400 mb-6">{unregisteredCount} users need registration</p>

        {/* User Selector */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <div className="relative">
            <select
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">-- Select a user --</option>
              {users.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.hasRegistration ? '[REG] ' : ''}{u.email || u.uid}{u.displayName ? ` (${u.displayName})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          {selectedUser && (
            <p className="mt-2 text-sm text-gray-500">
              UID: {selectedUser.uid}
            </p>
          )}
        </div>

        {/* Registration Form */}
        {selectedUid && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => updateField('nickname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', formatPhoneNumber(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="e.g., Adventure seeker from the Bay Area"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Emergency Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => updateField('emergencyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField('emergencyPhone', formatPhoneNumber(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyRelation}
                    onChange={(e) => updateField('emergencyRelation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions / Allergies</label>
                  <textarea
                    value={formData.medicalConditions}
                    onChange={(e) => updateField('medicalConditions', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Motorcycle & Experience */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bike className="h-5 w-5" />
                Motorcycle & Experience
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bike Model</label>
                  <input
                    type="text"
                    value={formData.bikeModel}
                    onChange={(e) => updateField('bikeModel', e.target.value)}
                    placeholder="e.g., BMW R1250GS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bike Year</label>
                  <input
                    type="text"
                    value={formData.bikeYear}
                    onChange={(e) => updateField('bikeYear', e.target.value)}
                    placeholder="e.g., 2023"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years Riding</label>
                  <select
                    value={formData.yearsRiding}
                    onChange={(e) => updateField('yearsRiding', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    <option value="less1">Less than 1 year</option>
                    <option value="1to5">1-5 years</option>
                    <option value="5to10">5-10 years</option>
                    <option value="10plus">10+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Off-Road Experience</label>
                  <select
                    value={formData.offRoadExperience}
                    onChange={(e) => updateField('offRoadExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    <option value="none">None</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baja Tour Experience</label>
                  <select
                    value={formData.bajaTourExperience}
                    onChange={(e) => updateField('bajaTourExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    <option value="no">No - First time</option>
                    <option value="once">Once before</option>
                    <option value="twice">Twice before</option>
                    <option value="many">Many times</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repair Experience</label>
                  <select
                    value={formData.repairExperience}
                    onChange={(e) => updateField('repairExperience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    <option value="none">None - I use a dealer</option>
                    <option value="basic">Basic - Can patch a tire</option>
                    <option value="comfortable">Comfortable - Know the basics</option>
                    <option value="macgyver">MacGyver - Can fix most things</option>
                  </select>
                </div>
              </div>

              {/* Pillion */}
              <div className="mt-6 pt-6 border-t">
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.hasPillion}
                    onChange={(e) => updateField('hasPillion', e.target.checked)}
                    className="h-4 w-4 text-amber-600 rounded"
                  />
                  <span className="font-medium text-gray-900">Has a pillion passenger</span>
                </label>
                {formData.hasPillion && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pillion Name</label>
                      <input
                        type="text"
                        value={formData.pillionName}
                        onChange={(e) => updateField('pillionName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pillion Nickname</label>
                      <input
                        type="text"
                        value={formData.pillionNickname}
                        onChange={(e) => updateField('pillionNickname', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pillion Phone</label>
                      <input
                        type="tel"
                        value={formData.pillionPhone}
                        onChange={(e) => updateField('pillionPhone', formatPhoneNumber(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pillion Email</label>
                      <input
                        type="email"
                        value={formData.pillionEmail}
                        onChange={(e) => updateField('pillionEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Other */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Other
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spanish Level</label>
                  <select
                    value={formData.spanishLevel}
                    onChange={(e) => updateField('spanishLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    <option value="gringo">Gringo - No Spanish</option>
                    <option value="read">I can read a bit</option>
                    <option value="simple">Simple conversations</option>
                    <option value="fluent">Fluent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">T-Shirt Size</label>
                  <select
                    value={formData.tshirtSize}
                    onChange={(e) => updateField('tshirtSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select...</option>
                    <option value="S">Small</option>
                    <option value="M">Medium</option>
                    <option value="L">Large</option>
                    <option value="XL">X-Large</option>
                    <option value="2XL">2X-Large</option>
                    <option value="3XL">3X-Large</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.passportValid}
                    onChange={(e) => updateField('passportValid', e.target.checked)}
                    className="h-4 w-4 text-amber-600 rounded"
                  />
                  <span className="text-gray-900">Passport valid through September 2026</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasGarminInreach}
                    onChange={(e) => updateField('hasGarminInreach', e.target.checked)}
                    className="h-4 w-4 text-amber-600 rounded"
                  />
                  <span className="text-gray-900">Has Garmin InReach or similar</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasToolkit}
                    onChange={(e) => updateField('hasToolkit', e.target.checked)}
                    className="h-4 w-4 text-amber-600 rounded"
                  />
                  <span className="text-gray-900">Will carry a Toolkit</span>
                </label>
              </div>

              {/* Skills */}
              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-3">Special Skills</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.skillMechanical}
                      onChange={(e) => updateField('skillMechanical', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">Strong Mechanical Skills</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.skillMedical}
                      onChange={(e) => updateField('skillMedical', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">Medical Training</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.skillPhotography}
                      onChange={(e) => updateField('skillPhotography', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">Photography</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.skillOther}
                      onChange={(e) => {
                        updateField('skillOther', e.target.checked);
                        if (e.target.checked) {
                          setShowOtherSkillModal(true);
                        }
                      }}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">Other</span>
                    {formData.skillOther && formData.skillOtherText && (
                      <span className="text-gray-600 text-sm">({formData.skillOtherText})</span>
                    )}
                    {formData.skillOther && (
                      <button
                        type="button"
                        onClick={() => setShowOtherSkillModal(true)}
                        className="text-amber-600 hover:text-amber-700 text-sm underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation Preferences */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Accommodation Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Preference</label>
                  <select
                    value={formData.accommodationPreference}
                    onChange={(e) => updateField('accommodationPreference', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="camping">Prefer most camping</option>
                    <option value="hotels">Prefer most hotels</option>
                    <option value="either">Good with either</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.flexibleAccommodations}
                      onChange={(e) => updateField('flexibleAccommodations', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">Flexible - OK with mixture of camping and hotels</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.okSharingSameGender}
                      onChange={(e) => updateField('okSharingSameGender', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">OK sharing room with same-sex stranger</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.okLessIdeal}
                      onChange={(e) => updateField('okLessIdeal', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">OK with less than ideal accommodations</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.okGroupMeals}
                      onChange={(e) => updateField('okGroupMeals', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">OK rolling with group for meals</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.okHotelCost}
                      onChange={(e) => updateField('okHotelCost', e.target.checked)}
                      className="h-4 w-4 text-amber-600 rounded"
                    />
                    <span className="text-gray-900">OK with hotel costs ($85-$100/night)</span>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.participateGroup}
                      onChange={(e) => updateField('participateGroup', e.target.checked)}
                      className="h-5 w-5 text-amber-600 rounded"
                    />
                    <span className="font-medium text-gray-900">Participate in group plan ($500 deposit)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anything else to share?</label>
                <textarea
                  value={formData.anythingElse}
                  onChange={(e) => updateField('anythingElse', e.target.value)}
                  rows={3}
                  placeholder="Questions, concerns, special requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Save Registration
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-5 w-5" />
                  Saved!
                </span>
              )}
            </div>
          </form>
        )}

        {/* Other Skill Modal */}
        {showOtherSkillModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Other Skill</h3>
                <button
                  type="button"
                  onClick={() => setShowOtherSkillModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please specify the skill
                </label>
                <input
                  type="text"
                  value={formData.skillOtherText}
                  onChange={(e) => updateField('skillOtherText', e.target.value)}
                  placeholder="e.g., Ham radio operator, Drone pilot..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.skillOtherText) {
                      updateField('skillOther', false);
                    }
                    setShowOtherSkillModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
