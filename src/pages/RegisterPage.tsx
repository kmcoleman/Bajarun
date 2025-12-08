/**
 * RegisterPage.tsx
 *
 * Registration form for Baja Tour 2025.
 * Requires authentication before registering.
 * Collects rider info, experience, and preferences.
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bike,
  Shield,
  Hotel,
  AlertCircle,
  CheckCircle,
  Info,
  LogIn,
  Send,
  Loader2,
  Heart,
  Globe,
  Camera,
  X
} from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface FormData {
  // Personal Info
  fullName: string;
  nickname: string;
  tagline: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;

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

  // Accommodation Preferences
  hasPillion: boolean;
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

  // Additional
  skillMechanical: boolean;
  skillMedical: boolean;
  skillPhotography: boolean;
  skillOther: boolean;
  skillOtherText: string;
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
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  medicalConditions: '',
  bikeModel: '',
  bikeYear: '',
  yearsRiding: '1to5',
  offRoadExperience: 'none',
  bajaTourExperience: 'no',
  repairExperience: 'none',
  spanishLevel: 'gringo',
  passportValid: true,
  hasPillion: false,
  accommodationPreference: 'either',
  flexibleAccommodations: false,
  okSharingSameGender: false,
  okLessIdeal: false,
  okGroupMeals: false,
  okHotelCost: false,
  participateGroup: null,
  tshirtSize: '',
  hasGarminInreach: false,
  hasToolkit: false,
  skillMechanical: false,
  skillMedical: false,
  skillPhotography: false,
  skillOther: false,
  skillOtherText: '',
  anythingElse: ''
};

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [existingRegistrationId, setExistingRegistrationId] = useState<string | null>(null);
  const [existingDepositPaid, setExistingDepositPaid] = useState<number>(0);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing registration if user is logged in
  useEffect(() => {
    async function fetchExistingRegistration() {
      if (!user) {
        setLoadingExisting(false);
        return;
      }

      try {
        const registrationsRef = collection(db, 'registrations');
        const q = query(registrationsRef, where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const existingDoc = snapshot.docs[0];
          const data = existingDoc.data();
          setExistingRegistrationId(existingDoc.id);

          // Load existing deposit amount (handle both old boolean and new number format)
          const paid = typeof data.depositPaid === 'number' ? data.depositPaid : 0;
          setExistingDepositPaid(paid);

          // Load existing data into form
          setFormData({
            fullName: data.fullName || '',
            nickname: data.nickname || '',
            tagline: data.tagline || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            phone: data.phone || '',
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
            anythingElse: data.anythingElse || ''
          });

          // If there's an existing headshot, show it as preview
          if (data.headshotUrl) {
            setHeadshotPreview(data.headshotUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching existing registration:', error);
      } finally {
        setLoadingExisting(false);
      }
    }

    fetchExistingRegistration();
  }, [user]);

  const handleHeadshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setHeadshotFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setHeadshotPreview(previewUrl);
    }
  };

  const removeHeadshot = () => {
    setHeadshotFile(null);
    if (headshotPreview) {
      URL.revokeObjectURL(headshotPreview);
      setHeadshotPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format phone number as user types: (555) 123-4567
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

  const handlePhoneChange = (field: 'phone' | 'emergencyPhone', value: string) => {
    const formatted = formatPhoneNumber(value);
    updateField(field, formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      let headshotUrl: string | null = headshotPreview; // Keep existing if no new file

      // Upload new headshot if provided
      if (headshotFile) {
        const fileExtension = headshotFile.name.split('.').pop();
        const fileName = `${user.uid}-${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `headshots/${fileName}`);

        await uploadBytes(storageRef, headshotFile);
        headshotUrl = await getDownloadURL(storageRef);
      }

      if (existingRegistrationId) {
        // Update existing registration
        const registrationRef = doc(db, 'registrations', existingRegistrationId);
        await updateDoc(registrationRef, {
          ...formData,
          email: user.email,
          headshotUrl,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new registration
        await addDoc(collection(db, 'registrations'), {
          ...formData,
          email: user.email,
          uid: user.uid,
          headshotUrl,
          depositPaid: 0,
          createdAt: serverTimestamp()
        });
      }

      // Show deposit modal after successful save
      setShowDepositModal(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close deposit modal and mark as submitted
  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
    setSubmitted(true);
  };

  // Not logged in - show sign in prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Sign In Required</h1>
            <p className="text-slate-400 mb-6">
              Please sign in to register for the Baja Tour 2026.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Create Account / Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading existing registration data
  if (loadingExisting) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading registration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted
  if (submitted) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">{existingRegistrationId ? 'Registration Updated!' : 'Registration Complete!'}</h1>
            <p className="text-slate-400 mb-6">
              Thank you for registering for the Baja Tour 2026. We'll be in touch with more details soon.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {existingRegistrationId ? 'Update Registration' : 'Trip Registration'}
          </h1>
          <p className="text-slate-400">
            {existingRegistrationId
              ? 'Update your registration details below'
              : 'Complete the form below to register for the Baja Tour 2026'
            }
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4" />
            <span>Registering as: {user.displayName || user.email}</span>
          </div>
          {existingRegistrationId && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
              <CheckCircle className="h-4 w-4" />
              Already registered - editing your info
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal Information */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            </div>

            <div className="grid gap-4">
              {/* Headshot Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Profile Photo
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Upload a headshot so other riders can recognize you. This will be shown on the Participants page.
                </p>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                      {headshotPreview ? (
                        <img
                          src={headshotPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    {headshotPreview && (
                      <button
                        type="button"
                        onClick={removeHeadshot}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                  {/* Upload Button */}
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
                      {headshotPreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG up to 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nickname
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => updateField('nickname', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="What do your friends call you?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tagline
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  A short phrase for your profile
                </p>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="Always up for the adventure. Let's Roll!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">From your account - cannot be changed here</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="94102"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Emergency Contact */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Emergency Contact</h2>
            </div>

            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyName}
                    onChange={(e) => updateField('emergencyName', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyRelation}
                    onChange={(e) => updateField('emergencyRelation', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Spouse, Partner, Friend, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Emergency Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.emergencyPhone}
                  onChange={(e) => handlePhoneChange('emergencyPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Medical Conditions / Allergies
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  This information will only be shared with ride leaders in case of emergency.
                </p>
                <textarea
                  value={formData.medicalConditions}
                  onChange={(e) => updateField('medicalConditions', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Any conditions or allergies the group should be aware of..."
                />
              </div>
            </div>
          </section>

          {/* Section 3: Motorcycle & Experience */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Motorcycle & Experience</h2>
            </div>

            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Motorcycle Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bikeModel}
                    onChange={(e) => updateField('bikeModel', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="BMW R1250GS Adventure"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bikeYear}
                    onChange={(e) => updateField('bikeYear', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="2023"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Years of Riding Experience *
                </label>
                <select
                  required
                  value={formData.yearsRiding}
                  onChange={(e) => updateField('yearsRiding', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="less1">Less than 1 year</option>
                  <option value="1to5">1-5 years</option>
                  <option value="5to10">5-10 years</option>
                  <option value="10plus">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Off-Road / Dirt Experience *
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Note: All main routes are on paved roads, but riding on short sections of dirt and sand may be necessary for certain accommodations.
                </p>
                <select
                  required
                  value={formData.offRoadExperience}
                  onChange={(e) => updateField('offRoadExperience', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="none">No off-road experience</option>
                  <option value="beginner">Beginner - Some gravel/dirt road experience</option>
                  <option value="intermediate">Intermediate - Comfortable on unpaved roads</option>
                  <option value="advanced">Advanced - Experienced off-road rider</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Motorcycle Repair Experience *
                </label>
                <select
                  required
                  value={formData.repairExperience}
                  onChange={(e) => updateField('repairExperience', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="none">None - I use a dealer for everything</option>
                  <option value="basic">Basic - I can patch a tire in a pinch</option>
                  <option value="comfortable">Comfortable - I carry some tools and know the basics</option>
                  <option value="macgyver">MacGyver level - I can fix most things on the road</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Have you toured Baja before? *
                </label>
                <select
                  required
                  value={formData.bajaTourExperience}
                  onChange={(e) => updateField('bajaTourExperience', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="no">No - This will be my first time</option>
                  <option value="once">Once before</option>
                  <option value="twice">Twice before</option>
                  <option value="many">Many times</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Will you have a Pillion (passenger)? *
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.hasPillion === true
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="hasPillion"
                      checked={formData.hasPillion === true}
                      onChange={() => updateField('hasPillion', true)}
                      className="sr-only"
                    />
                    Yes
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.hasPillion === false
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="hasPillion"
                      checked={formData.hasPillion === false}
                      onChange={() => updateField('hasPillion', false)}
                      className="sr-only"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Other */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Other</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Spanish Language Level *
                </label>
                <select
                  required
                  value={formData.spanishLevel}
                  onChange={(e) => updateField('spanishLevel', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="gringo">Gringo - No Spanish</option>
                  <option value="read">I can read a bit</option>
                  <option value="simple">I can handle simple conversations</option>
                  <option value="fluent">I am fluent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Is your passport valid until at least September 30, 2026? *
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.passportValid === true
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="passportValid"
                      checked={formData.passportValid === true}
                      onChange={() => updateField('passportValid', true)}
                      className="sr-only"
                    />
                    Yes
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.passportValid === false
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="passportValid"
                      checked={formData.passportValid === false}
                      onChange={() => updateField('passportValid', false)}
                      className="sr-only"
                    />
                    No
                  </label>
                </div>

                {!formData.passportValid && (
                  <div className="mt-4 p-4 bg-amber-600/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 font-medium">Passport Renewal Required</p>
                      <p className="text-amber-200/70 text-sm mt-1">
                        Passport processing can take 8-12 weeks.{' '}
                        <a
                          href="https://travel.state.gov/content/travel/en/passports/have-passport/renew-online.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 underline hover:text-amber-200"
                        >
                          Consider renewing now
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  T-Shirt Size *
                </label>
                <select
                  required
                  value={formData.tshirtSize}
                  onChange={(e) => updateField('tshirtSize', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Do you have a Garmin InReach? *
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.hasGarminInreach === true
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="hasGarminInreach"
                      checked={formData.hasGarminInreach === true}
                      onChange={() => updateField('hasGarminInreach', true)}
                      className="sr-only"
                    />
                    Yes
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.hasGarminInreach === false
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="hasGarminInreach"
                      checked={formData.hasGarminInreach === false}
                      onChange={() => updateField('hasGarminInreach', false)}
                      className="sr-only"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Will you carry a Toolkit? *
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.hasToolkit === true
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="hasToolkit"
                      checked={formData.hasToolkit === true}
                      onChange={() => updateField('hasToolkit', true)}
                      className="sr-only"
                    />
                    Yes
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.hasToolkit === false
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="hasToolkit"
                      checked={formData.hasToolkit === false}
                      onChange={() => updateField('hasToolkit', false)}
                      className="sr-only"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Special Skills (select all that apply)
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.skillMechanical}
                      onChange={(e) => updateField('skillMechanical', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Strong Mechanical Skills</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.skillMedical}
                      onChange={(e) => updateField('skillMedical', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Medical Training</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.skillPhotography}
                      onChange={(e) => updateField('skillPhotography', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Photography</span>
                  </label>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.skillOther}
                      onChange={(e) => updateField('skillOther', e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-slate-300">Other</span>
                      {formData.skillOther && (
                        <input
                          type="text"
                          value={formData.skillOtherText}
                          onChange={(e) => updateField('skillOtherText', e.target.value)}
                          placeholder="Please specify..."
                          className="mt-2 w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Accommodation Preferences */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Hotel className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Accommodation Preferences</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Accommodation Preference *
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Once we finalize the nightly options, you will be able to select Group Camping or Group Hotel for each night. Share your initial preferences to help us plan.
                </p>
                <select
                  required
                  value={formData.accommodationPreference}
                  onChange={(e) => updateField('accommodationPreference', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="camping">I prefer the most camping</option>
                  <option value="hotels">I prefer the most hotels</option>
                  <option value="either">I am good with either</option>
                </select>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-4">
                  Please confirm you understand and accept the following about group accommodations:
                </p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.flexibleAccommodations}
                      onChange={(e) => updateField('flexibleAccommodations', e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">I am flexible and OK with a mixture of camping and hotels</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.okSharingSameGender}
                      onChange={(e) => updateField('okSharingSameGender', e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">I am OK sharing a room with a same-sex person I may not know</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.okLessIdeal}
                      onChange={(e) => updateField('okLessIdeal', e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">I understand there may be less than ideal accommodations and can roll with it</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.okGroupMeals}
                      onChange={(e) => updateField('okGroupMeals', e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">I am able to roll with a group for meals</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.okHotelCost}
                      onChange={(e) => updateField('okHotelCost', e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">I am OK with hotel accommodations that average $85 to $100 per night</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  I will participate in the group accommodations and meals *
                </label>
                <div className="flex gap-4">
                  {(() => {
                    const allChecked = formData.flexibleAccommodations &&
                      formData.okSharingSameGender &&
                      formData.okLessIdeal &&
                      formData.okGroupMeals &&
                      formData.okHotelCost;

                    return (
                      <>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                          formData.participateGroup === true
                            ? 'bg-blue-600/20 border-blue-500 text-white cursor-pointer'
                            : allChecked
                              ? 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500 cursor-pointer'
                              : 'bg-slate-900/50 border-slate-700 text-slate-500 cursor-not-allowed'
                        }`}>
                          <input
                            type="radio"
                            name="participateGroup"
                            checked={formData.participateGroup === true}
                            onChange={() => allChecked && updateField('participateGroup', true)}
                            disabled={!allChecked}
                            className="sr-only"
                          />
                          Yes
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.participateGroup === false
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}>
                          <input
                            type="radio"
                            name="participateGroup"
                            checked={formData.participateGroup === false}
                            onChange={() => updateField('participateGroup', false)}
                            className="sr-only"
                          />
                          No
                        </label>
                      </>
                    );
                  })()}
                </div>
                {!(formData.flexibleAccommodations && formData.okSharingSameGender && formData.okLessIdeal && formData.okGroupMeals && formData.okHotelCost) && (
                  <p className="text-xs text-amber-400 mt-2">
                    Please check all boxes above to select "Yes"
                  </p>
                )}
              </div>

              <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-200/80 text-sm">
                  You will be able to select a preferred roommate closer to the departure date.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Additional Information */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Additional Information</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Anything else you want to share?
              </label>
              <textarea
                value={formData.anythingElse}
                onChange={(e) => updateField('anythingElse', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Questions, concerns, special requests..."
              />
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {existingRegistrationId ? 'Updating...' : 'Registering...'}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {existingRegistrationId ? 'Update Registration' : 'Register for the Ride'}
                </>
              )}
            </button>
            <p className="text-sm text-slate-500 text-center">
              By submitting, you confirm that the information provided is accurate.
            </p>
          </div>
        </form>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (() => {
        // Calculate deposit amounts
        const requiredDeposit = formData.participateGroup ? 500 : 100;
        const amountDue = Math.max(0, requiredDeposit - existingDepositPaid);
        const isFullyPaid = amountDue <= 0;

        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {existingRegistrationId ? 'Registration Updated!' : 'Registration Received!'}
                  </h2>
                  <button
                    onClick={handleCloseDepositModal}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {isFullyPaid ? (
                  /* Fully Paid - Simple Success Message */
                  <div className="text-center py-4">
                    <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Deposit Received</h3>
                    <p className="text-slate-400 mb-6">
                      Thank you! Your deposit of ${existingDepositPaid} has been received.<br />
                      We'll be in touch with more details soon.
                    </p>
                    <button
                      onClick={handleCloseDepositModal}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Got It!
                    </button>
                  </div>
                ) : (
                  /* Balance Due - Show QR Codes */
                  <>
                    {/* Deposit Instructions */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                      </div>
                      <p className="text-slate-300 mb-2">
                        Please send <span className="text-white font-semibold text-xl">${amountDue}</span> via Venmo or Zelle to complete your registration.
                      </p>
                      {existingDepositPaid > 0 && (
                        <p className="text-sm text-green-400 mb-2">
                          (${existingDepositPaid} already received - thank you!)
                        </p>
                      )}
                      <p className="text-sm text-slate-400">
                        {formData.participateGroup ? (
                          <>This deposit is used for hotels, meals, t-shirt, and minor incidentals.<br />
                          Any remaining funds will be returned to participants after the trip.</>
                        ) : (
                          <>This deposit covers your t-shirt and minor incidentals.<br />
                          Any remaining funds will be returned to participants after the trip.</>
                        )}
                      </p>
                    </div>

                    {/* QR Codes */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Venmo */}
                      <div className="bg-slate-900 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-semibold text-white mb-3">Venmo</h3>
                        <div className="bg-white rounded-lg p-2 inline-block mb-3">
                          <img
                            src="/venmo-qr.jpg"
                            alt="Venmo QR Code"
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <p className="text-blue-400 font-medium">@Kevmc</p>
                      </div>

                      {/* Zelle */}
                      <div className="bg-slate-900 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-semibold text-white mb-3">Zelle</h3>
                        <div className="bg-white rounded-lg p-2 inline-block mb-3">
                          <img
                            src="/zelle-qr.jpg"
                            alt="Zelle QR Code"
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <p className="text-purple-400 font-medium">Kevin Coleman</p>
                        <p className="text-slate-500 text-sm">(925) 890-8449</p>
                      </div>
                    </div>

                    {/* Cancellation Policy */}
                    <div className="p-4 bg-amber-600/10 border border-amber-500/30 rounded-lg">
                      <h4 className="text-amber-300 font-medium mb-2">Cancellation Policy</h4>
                      <p className="text-amber-200/70 text-sm">
                        If you cancel, we will refund any funds not already committed for reservations.
                      </p>
                    </div>

                    {/* Important Note */}
                    <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-blue-200/80 text-sm">
                        <strong className="text-blue-300">Important:</strong> Your registration is not final until we receive your deposit.
                      </p>
                    </div>

                    {/* Close Button */}
                    <div className="text-center pt-2">
                      <button
                        onClick={handleCloseDepositModal}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Got It!
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
