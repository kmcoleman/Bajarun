/**
 * MyProfilePage.tsx
 *
 * User profile page showing all registration data.
 * View-only by default with an Edit mode for making changes.
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  User,
  Bike,
  Heart,
  Globe,
  Hotel,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Camera,
  CheckCircle,
  Wrench,
  Stethoscope,
  Camera as CameraIcon,
  MapPin,
  Phone,
  Mail,
  Users
} from 'lucide-react';

interface RegistrationData {
  id: string;
  // Personal Info
  fullName: string;
  nickname: string;
  tagline: string;
  email: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  headshotUrl?: string;

  // Emergency Contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  medicalConditions: string;

  // Motorcycle & Experience
  bikeModel: string;
  bikeYear: string;
  yearsRiding: 'less1' | '1to5' | '5to10' | '10plus';
  offRoadExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  bajaTourExperience: 'no' | 'once' | 'twice' | 'many';
  repairExperience: 'none' | 'basic' | 'comfortable' | 'macgyver';

  // Language & Documents
  spanishLevel: 'gringo' | 'read' | 'simple' | 'fluent';
  passportValid: boolean;

  // Pillion
  hasPillion: boolean;
  pillionName: string;
  pillionNickname: string;
  pillionPhone: string;
  pillionEmail: string;

  // Accommodation Preferences
  accommodationPreference: 'camping' | 'hotels' | 'either';
  flexibleAccommodations: boolean;
  okSharingSameGender: boolean;
  okLessIdeal: boolean;
  okGroupMeals: boolean;
  okHotelCost: boolean;
  participateGroup: boolean | null;

  // Logistics
  tshirtSize: string;
  hasGarminInreach: boolean;
  hasToolkit: boolean;

  // Skills
  skillMechanical: boolean;
  skillMedical: boolean;
  skillPhotography: boolean;
  skillOther: boolean;
  skillOtherText: string;

  // Additional
  anythingElse: string;

  // Status
  depositRequired: number;
  depositPaid: number;
}

// Helper functions to format display values
const formatYearsRiding = (value: string): string => {
  const map: Record<string, string> = {
    less1: 'Less than 1 year',
    '1to5': '1-5 years',
    '5to10': '5-10 years',
    '10plus': '10+ years'
  };
  return map[value] || value;
};

const formatOffRoadExperience = (value: string): string => {
  const map: Record<string, string> = {
    none: 'No off-road experience',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  };
  return map[value] || value;
};

const formatBajaExperience = (value: string): string => {
  const map: Record<string, string> = {
    no: 'First time',
    once: 'Once before',
    twice: 'Twice before',
    many: 'Many times'
  };
  return map[value] || value;
};

const formatRepairExperience = (value: string): string => {
  const map: Record<string, string> = {
    none: 'None',
    basic: 'Basic',
    comfortable: 'Comfortable',
    macgyver: 'MacGyver level'
  };
  return map[value] || value;
};

const formatSpanishLevel = (value: string): string => {
  const map: Record<string, string> = {
    gringo: 'No Spanish',
    read: 'Can read a bit',
    simple: 'Simple conversations',
    fluent: 'Fluent'
  };
  return map[value] || value;
};

const formatAccommodationPreference = (value: string): string => {
  const map: Record<string, string> = {
    camping: 'Prefer camping',
    hotels: 'Prefer hotels',
    either: 'Either is fine'
  };
  return map[value] || value;
};

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<RegistrationData | null>(null);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load registration data
  useEffect(() => {
    async function loadRegistration() {
      if (!user) return;

      setLoading(true);
      try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const data = docData.data();
          setRegistration({
            id: docData.id,
            fullName: data.fullName || '',
            nickname: data.nickname || '',
            tagline: data.tagline || '',
            email: data.email || user.email || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            phone: data.phone || '',
            headshotUrl: data.headshotUrl || '',
            emergencyName: data.emergencyName || '',
            emergencyPhone: data.emergencyPhone || '',
            emergencyRelation: data.emergencyRelation || '',
            medicalConditions: data.medicalConditions || '',
            bikeModel: data.bikeModel || '',
            bikeYear: data.bikeYear || '',
            yearsRiding: data.yearsRiding || '1to5',
            offRoadExperience: data.offRoadExperience || 'none',
            bajaTourExperience: data.bajaTourExperience || 'no',
            repairExperience: data.repairExperience || 'none',
            spanishLevel: data.spanishLevel || 'gringo',
            passportValid: data.passportValid ?? true,
            hasPillion: data.hasPillion ?? false,
            pillionName: data.pillionName || '',
            pillionNickname: data.pillionNickname || '',
            pillionPhone: data.pillionPhone || '',
            pillionEmail: data.pillionEmail || '',
            accommodationPreference: data.accommodationPreference || 'either',
            flexibleAccommodations: data.flexibleAccommodations ?? false,
            okSharingSameGender: data.okSharingSameGender ?? false,
            okLessIdeal: data.okLessIdeal ?? false,
            okGroupMeals: data.okGroupMeals ?? false,
            okHotelCost: data.okHotelCost ?? false,
            participateGroup: data.participateGroup ?? null,
            tshirtSize: data.tshirtSize || '',
            hasGarminInreach: data.hasGarminInreach ?? false,
            hasToolkit: data.hasToolkit ?? false,
            skillMechanical: data.skillMechanical ?? false,
            skillMedical: data.skillMedical ?? false,
            skillPhotography: data.skillPhotography ?? false,
            skillOther: data.skillOther ?? false,
            skillOtherText: data.skillOtherText || '',
            anythingElse: data.anythingElse || '',
            depositRequired: data.depositRequired || 0,
            depositPaid: typeof data.depositPaid === 'number' ? data.depositPaid : 0
          });
        }
      } catch (error) {
        console.error('Error loading registration:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadRegistration();
    }
  }, [user, authLoading]);

  // Enter edit mode
  const handleEdit = () => {
    if (registration) {
      setEditData({ ...registration });
      setHeadshotPreview(registration.headshotUrl || null);
      setEditMode(true);
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    setEditData(null);
    setHeadshotFile(null);
    setHeadshotPreview(null);
    setEditMode(false);
  };

  // Update field in edit mode
  const updateField = (field: keyof RegistrationData, value: string | boolean) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

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

  // Handle phone change
  const handlePhoneChange = (field: 'phone' | 'emergencyPhone' | 'pillionPhone', value: string) => {
    updateField(field, formatPhoneNumber(value));
  };

  // Handle headshot change
  const handleHeadshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setHeadshotFile(file);
      setHeadshotPreview(URL.createObjectURL(file));
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!editData || !user) return;

    setSaving(true);
    try {
      let headshotUrl = editData.headshotUrl;

      // Upload new headshot if provided
      if (headshotFile) {
        const fileExtension = headshotFile.name.split('.').pop();
        const fileName = `${user.uid}-${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `headshots/${fileName}`);
        await uploadBytes(storageRef, headshotFile);
        headshotUrl = await getDownloadURL(storageRef);
      }

      // Update registration
      const registrationRef = doc(db, 'registrations', editData.id);
      await updateDoc(registrationRef, {
        fullName: editData.fullName,
        nickname: editData.nickname,
        tagline: editData.tagline,
        city: editData.city,
        state: editData.state,
        zipCode: editData.zipCode,
        phone: editData.phone,
        headshotUrl,
        emergencyName: editData.emergencyName,
        emergencyPhone: editData.emergencyPhone,
        emergencyRelation: editData.emergencyRelation,
        medicalConditions: editData.medicalConditions,
        bikeModel: editData.bikeModel,
        bikeYear: editData.bikeYear,
        yearsRiding: editData.yearsRiding,
        offRoadExperience: editData.offRoadExperience,
        bajaTourExperience: editData.bajaTourExperience,
        repairExperience: editData.repairExperience,
        spanishLevel: editData.spanishLevel,
        passportValid: editData.passportValid,
        hasPillion: editData.hasPillion,
        pillionName: editData.pillionName,
        pillionNickname: editData.pillionNickname,
        pillionPhone: editData.pillionPhone,
        pillionEmail: editData.pillionEmail,
        tshirtSize: editData.tshirtSize,
        hasGarminInreach: editData.hasGarminInreach,
        hasToolkit: editData.hasToolkit,
        skillMechanical: editData.skillMechanical,
        skillMedical: editData.skillMedical,
        skillPhotography: editData.skillPhotography,
        skillOther: editData.skillOther,
        skillOtherText: editData.skillOtherText,
        anythingElse: editData.anythingElse,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setRegistration({ ...editData, headshotUrl: headshotUrl || '' });
      setEditMode(false);
      setEditData(null);
      setHeadshotFile(null);
    } catch (error) {
      console.error('Error saving registration:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400 mb-6">Please sign in to view your profile.</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not registered
  if (!registration) {
    return (
      <div className="min-h-screen bg-slate-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Not Registered</h2>
            <p className="text-slate-400 mb-6">You haven't registered for the tour yet.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Data to display (use editData in edit mode, registration in view mode)
  const data = editMode && editData ? editData : registration;

  // Build skills list
  const skills: string[] = [];
  if (data.skillMechanical) skills.push('Mechanical');
  if (data.skillMedical) skills.push('Medical');
  if (data.skillPhotography) skills.push('Photography');
  if (data.skillOther && data.skillOtherText) skills.push(data.skillOtherText);

  return (
    <div className="min-h-screen bg-slate-900 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
                <p className="text-slate-400">Your registration details</p>
              </div>
            </div>
            {!editMode ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Registration Status */}
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 rounded-xl border border-green-700/50 p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <div>
            <span className="text-green-400 font-medium">Registered</span>
            <span className="text-slate-400 ml-2">
              {data.participateGroup ? 'Group Plan' : 'Independent'}
              {data.depositPaid > 0 && ` - $${data.depositPaid} deposit paid`}
            </span>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          {/* Personal Information */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            </div>

            {editMode ? (
              <div className="space-y-4">
                {/* Photo Upload */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                      {headshotPreview ? (
                        <img src={headshotPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleHeadshotChange}
                      className="hidden"
                      id="headshot-upload"
                    />
                    <label
                      htmlFor="headshot-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      Change Photo
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editData?.fullName || ''}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nickname</label>
                    <input
                      type="text"
                      value={editData?.nickname || ''}
                      onChange={(e) => updateField('nickname', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editData?.tagline || ''}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={editData?.city || ''}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={editData?.state || ''}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={editData?.zipCode || ''}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editData?.phone || ''}
                    onChange={(e) => handlePhoneChange('phone', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-6">
                {/* Photo */}
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600 flex-shrink-0">
                  {data.headshotUrl ? (
                    <img src={data.headshotUrl} alt={data.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-slate-400" />
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {data.fullName}
                      {data.nickname && <span className="text-slate-400 font-normal ml-2">"{data.nickname}"</span>}
                    </h3>
                    {data.tagline && <p className="text-slate-400 italic">{data.tagline}</p>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {data.city}, {data.state} {data.zipCode}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4 text-slate-500" />
                      {data.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4 text-slate-500" />
                      {data.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Emergency Contact */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Emergency Contact</h2>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={editData?.emergencyName || ''}
                      onChange={(e) => updateField('emergencyName', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={editData?.emergencyRelation || ''}
                      onChange={(e) => updateField('emergencyRelation', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editData?.emergencyPhone || ''}
                    onChange={(e) => handlePhoneChange('emergencyPhone', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Medical Conditions / Allergies</label>
                  <textarea
                    value={editData?.medicalConditions || ''}
                    onChange={(e) => updateField('medicalConditions', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Contact</p>
                  <p className="text-white">{data.emergencyName}</p>
                  <p className="text-slate-400 text-sm">{data.emergencyRelation}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Phone</p>
                  <p className="text-white">{data.emergencyPhone}</p>
                </div>
                {data.medicalConditions && (
                  <div className="md:col-span-2">
                    <p className="text-slate-500 text-sm">Medical Conditions / Allergies</p>
                    <p className="text-white">{data.medicalConditions}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Motorcycle & Experience */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Motorcycle & Experience</h2>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Motorcycle Model</label>
                    <input
                      type="text"
                      value={editData?.bikeModel || ''}
                      onChange={(e) => updateField('bikeModel', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Year</label>
                    <input
                      type="text"
                      value={editData?.bikeYear || ''}
                      onChange={(e) => updateField('bikeYear', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Years Riding</label>
                    <select
                      value={editData?.yearsRiding || '1to5'}
                      onChange={(e) => updateField('yearsRiding', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="less1">Less than 1 year</option>
                      <option value="1to5">1-5 years</option>
                      <option value="5to10">5-10 years</option>
                      <option value="10plus">10+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Off-Road Experience</label>
                    <select
                      value={editData?.offRoadExperience || 'none'}
                      onChange={(e) => updateField('offRoadExperience', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="none">No off-road experience</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Repair Experience</label>
                    <select
                      value={editData?.repairExperience || 'none'}
                      onChange={(e) => updateField('repairExperience', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="basic">Basic</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="macgyver">MacGyver level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Baja Experience</label>
                    <select
                      value={editData?.bajaTourExperience || 'no'}
                      onChange={(e) => updateField('bajaTourExperience', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="no">First time</option>
                      <option value="once">Once before</option>
                      <option value="twice">Twice before</option>
                      <option value="many">Many times</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Motorcycle</p>
                  <p className="text-white">{data.bikeYear} {data.bikeModel}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Years Riding</p>
                  <p className="text-white">{formatYearsRiding(data.yearsRiding)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Off-Road Experience</p>
                  <p className="text-white">{formatOffRoadExperience(data.offRoadExperience)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Repair Experience</p>
                  <p className="text-white">{formatRepairExperience(data.repairExperience)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Baja Experience</p>
                  <p className="text-white">{formatBajaExperience(data.bajaTourExperience)}</p>
                </div>
              </div>
            )}
          </section>

          {/* Skills & Equipment */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Skills & Equipment</h2>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Spanish Level</label>
                    <select
                      value={editData?.spanishLevel || 'gringo'}
                      onChange={(e) => updateField('spanishLevel', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="gringo">No Spanish</option>
                      <option value="read">Can read a bit</option>
                      <option value="simple">Simple conversations</option>
                      <option value="fluent">Fluent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">T-Shirt Size</label>
                    <select
                      value={editData?.tshirtSize || ''}
                      onChange={(e) => updateField('tshirtSize', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select size...</option>
                      <option value="S">Small</option>
                      <option value="M">Medium</option>
                      <option value="L">Large</option>
                      <option value="XL">X-Large</option>
                      <option value="2XL">2X-Large</option>
                      <option value="3XL">3X-Large</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={editData?.passportValid ?? true}
                      onChange={(e) => updateField('passportValid', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                    />
                    Valid Passport
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={editData?.hasGarminInreach ?? false}
                      onChange={(e) => updateField('hasGarminInreach', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                    />
                    Garmin InReach
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={editData?.hasToolkit ?? false}
                      onChange={(e) => updateField('hasToolkit', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                    />
                    Toolkit
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Special Skills</label>
                  <div className="grid md:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={editData?.skillMechanical ?? false}
                        onChange={(e) => updateField('skillMechanical', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                      />
                      Mechanical
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={editData?.skillMedical ?? false}
                        onChange={(e) => updateField('skillMedical', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                      />
                      Medical
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={editData?.skillPhotography ?? false}
                        onChange={(e) => updateField('skillPhotography', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                      />
                      Photography
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input
                        type="checkbox"
                        checked={editData?.skillOther ?? false}
                        onChange={(e) => updateField('skillOther', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                      />
                      Other
                    </label>
                  </div>
                  {editData?.skillOther && (
                    <input
                      type="text"
                      value={editData?.skillOtherText || ''}
                      onChange={(e) => updateField('skillOtherText', e.target.value)}
                      placeholder="Please specify..."
                      className="mt-2 w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Spanish Level</p>
                  <p className="text-white">{formatSpanishLevel(data.spanishLevel)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">T-Shirt Size</p>
                  <p className="text-white">{data.tshirtSize || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Equipment</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.passportValid && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">Valid Passport</span>
                    )}
                    {data.hasGarminInreach && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">Garmin InReach</span>
                    )}
                    {data.hasToolkit && (
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">Toolkit</span>
                    )}
                  </div>
                </div>
                {skills.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-sm">Special Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {skills.map((skill, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-amber-600/20 text-amber-400 rounded text-xs">
                          {skill === 'Mechanical' && <Wrench className="h-3 w-3" />}
                          {skill === 'Medical' && <Stethoscope className="h-3 w-3" />}
                          {skill === 'Photography' && <CameraIcon className="h-3 w-3" />}
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Pillion (if applicable) */}
          {data.hasPillion && (
            <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Pillion (Passenger)</h2>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editData?.pillionName || ''}
                        onChange={(e) => updateField('pillionName', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Nickname</label>
                      <input
                        type="text"
                        value={editData?.pillionNickname || ''}
                        onChange={(e) => updateField('pillionNickname', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editData?.pillionPhone || ''}
                        onChange={(e) => handlePhoneChange('pillionPhone', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={editData?.pillionEmail || ''}
                        onChange={(e) => updateField('pillionEmail', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm">Name</p>
                    <p className="text-white">
                      {data.pillionName}
                      {data.pillionNickname && <span className="text-slate-400 ml-2">"{data.pillionNickname}"</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Phone</p>
                    <p className="text-white">{data.pillionPhone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Email</p>
                    <p className="text-white">{data.pillionEmail}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Preferences (Read-only) */}
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
                <p className="text-white">{formatAccommodationPreference(data.accommodationPreference)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Group Plan</p>
                <p className="text-white">{data.participateGroup ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">
                To change your nightly selections, visit{' '}
                <Link to="/my-selections" className="text-blue-400 hover:text-blue-300">
                  My Ride
                </Link>
              </p>
            </div>
          </section>

          {/* Notes */}
          {(data.anythingElse || editMode) && (
            <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Additional Notes</h2>
              </div>

              {editMode ? (
                <textarea
                  value={editData?.anythingElse || ''}
                  onChange={(e) => updateField('anythingElse', e.target.value)}
                  rows={3}
                  placeholder="Questions, concerns, special requests..."
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              ) : (
                <p className="text-slate-300">{data.anythingElse}</p>
              )}
            </section>
          )}
        </div>

        {/* Edit mode footer actions */}
        {editMode && (
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
