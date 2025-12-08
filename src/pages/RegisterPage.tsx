/**
 * RegisterPage.tsx
 *
 * Registration form for Baja Tour 2025.
 * Requires authentication before registering.
 * Collects rider info, experience, and preferences.
 */

import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bike,
  Shield,
  Hotel,
  Tent,
  Users,
  AlertCircle,
  CheckCircle,
  Info,
  LogIn,
  Send,
  Loader2,
  Heart,
  Wrench,
  Globe,
  Camera,
  X
} from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface FormData {
  // Personal Info
  fullName: string;
  address: string;
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
  yearsRiding: string;
  offRoadExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  bajaTourExperience: 'no' | 'once' | 'twice' | 'many';

  // Language & Documents
  speaksSpanish: boolean;
  passportValid: boolean;

  // Accommodation Preferences
  hasPillion: boolean;
  accommodationPref: 'hotels' | 'camping' | 'mix';
  shareRoom: 'yes' | 'no';

  // Logistics
  tshirtSize: string;
  dietaryRestrictions: string;
  hasSatComm: boolean;

  // Additional
  specialSkills: string;
  anythingElse: string;
}

const initialFormData: FormData = {
  fullName: '',
  address: '',
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
  yearsRiding: '',
  offRoadExperience: 'none',
  bajaTourExperience: 'no',
  speaksSpanish: false,
  passportValid: true,
  hasPillion: false,
  accommodationPref: 'hotels',
  shareRoom: 'yes',
  tshirtSize: '',
  dietaryRestrictions: '',
  hasSatComm: false,
  specialSkills: '',
  anythingElse: ''
};

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      let headshotUrl: string | null = null;

      // Upload headshot if provided
      if (headshotFile) {
        const fileExtension = headshotFile.name.split('.').pop();
        const fileName = `${user.uid}-${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `headshots/${fileName}`);

        await uploadBytes(storageRef, headshotFile);
        headshotUrl = await getDownloadURL(storageRef);
      }

      // Save registration to Firestore
      await addDoc(collection(db, 'registrations'), {
        ...formData,
        email: user.email,
        uid: user.uid,
        headshotUrl,
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  // Already submitted
  if (submitted) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Registration Complete!</h1>
            <p className="text-slate-400 mb-6">
              Thank you for registering for the Baja Tour 2025. We'll be in touch with more details soon.
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
          <h1 className="text-4xl font-bold text-white mb-4">Trip Registration</h1>
          <p className="text-slate-400">
            Complete the form below to register for the Baja Tour 2025
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4" />
            <span>Registering as: {user.displayName || user.email}</span>
          </div>
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
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="123 Main Street"
                />
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
                  onChange={(e) => updateField('phone', e.target.value)}
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
                  onChange={(e) => updateField('emergencyPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Medical Conditions / Allergies
                </label>
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
                <input
                  type="text"
                  required
                  value={formData.yearsRiding}
                  onChange={(e) => updateField('yearsRiding', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 10 years"
                />
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

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasPillion"
                  checked={formData.hasPillion}
                  onChange={(e) => updateField('hasPillion', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasPillion" className="text-slate-300">
                  I will have a pillion (passenger)
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Language & Documents */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Language & Documents</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="speaksSpanish"
                  checked={formData.speaksSpanish}
                  onChange={(e) => updateField('speaksSpanish', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="speaksSpanish" className="text-slate-300">
                  I speak Spanish (conversational or better)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Is your passport valid until at least September 30, 2026? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="passportValid"
                      checked={formData.passportValid === true}
                      onChange={() => updateField('passportValid', true)}
                      className="w-5 h-5 border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Yes, my passport is valid</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="passportValid"
                      checked={formData.passportValid === false}
                      onChange={() => updateField('passportValid', false)}
                      className="w-5 h-5 border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">No, I need to renew</span>
                  </label>
                </div>

                {!formData.passportValid && (
                  <div className="mt-4 p-4 bg-amber-600/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 font-medium">Passport Renewal Required</p>
                      <p className="text-amber-200/70 text-sm mt-1">
                        Start your renewal now! Passport processing can take 8-12 weeks.
                        Visit <a href="https://travel.state.gov/content/travel/en/passports.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200">travel.state.gov</a> to begin.
                      </p>
                    </div>
                  </div>
                )}
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
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Accommodation Preference *
                </label>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.accommodationPref === 'hotels'
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-900 border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="accommodationPref"
                      value="hotels"
                      checked={formData.accommodationPref === 'hotels'}
                      onChange={(e) => updateField('accommodationPref', e.target.value)}
                      className="sr-only"
                    />
                    <Hotel className={`h-5 w-5 ${formData.accommodationPref === 'hotels' ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={formData.accommodationPref === 'hotels' ? 'text-white' : 'text-slate-300'}>
                      All Hotels
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.accommodationPref === 'camping'
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-900 border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="accommodationPref"
                      value="camping"
                      checked={formData.accommodationPref === 'camping'}
                      onChange={(e) => updateField('accommodationPref', e.target.value)}
                      className="sr-only"
                    />
                    <Tent className={`h-5 w-5 ${formData.accommodationPref === 'camping' ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={formData.accommodationPref === 'camping' ? 'text-white' : 'text-slate-300'}>
                      All Camping
                    </span>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.accommodationPref === 'mix'
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-900 border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="accommodationPref"
                      value="mix"
                      checked={formData.accommodationPref === 'mix'}
                      onChange={(e) => updateField('accommodationPref', e.target.value)}
                      className="sr-only"
                    />
                    <Users className={`h-5 w-5 ${formData.accommodationPref === 'mix' ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={formData.accommodationPref === 'mix' ? 'text-white' : 'text-slate-300'}>
                      Mix of Both
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Are you okay sharing a room with someone you may or may not know? *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRoomInfo(!showRoomInfo)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>

                {showRoomInfo && (
                  <div className="mb-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-200/80 text-sm">
                      Hotel rooms may be limited in many of the towns we visit, so single rooms may not be available.
                      Sharing a room helps ensure everyone has a place to stay and reduces costs.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shareRoom"
                      value="yes"
                      checked={formData.shareRoom === 'yes'}
                      onChange={(e) => updateField('shareRoom', e.target.value)}
                      className="w-5 h-5 border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Yes, I'm okay sharing a room</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shareRoom"
                      value="no"
                      checked={formData.shareRoom === 'no'}
                      onChange={(e) => updateField('shareRoom', e.target.value)}
                      className="w-5 h-5 border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">No, I prefer my own room (subject to availability)</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Logistics */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Logistics</h2>
            </div>

            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    T-Shirt Size
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dietary Restrictions
                  </label>
                  <input
                    type="text"
                    value={formData.dietaryRestrictions}
                    onChange={(e) => updateField('dietaryRestrictions', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Vegetarian, allergies, etc."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasSatComm"
                  checked={formData.hasSatComm}
                  onChange={(e) => updateField('hasSatComm', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasSatComm" className="text-slate-300">
                  I have a satellite communicator (Garmin InReach, Zoleo, etc.)
                </label>
              </div>
            </div>
          </section>

          {/* Section 7: Additional Information */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Additional Information</h2>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Special Skills
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Mechanic, medical training, photography, fluent Spanish speaker, etc.
                </p>
                <textarea
                  value={formData.specialSkills}
                  onChange={(e) => updateField('specialSkills', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Any skills that might be useful for the group..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Anything else we should know?
                </label>
                <textarea
                  value={formData.anythingElse}
                  onChange={(e) => updateField('anythingElse', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Questions, concerns, special requests..."
                />
              </div>
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
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Registration
                </>
              )}
            </button>
            <p className="text-sm text-slate-500 text-center">
              By submitting, you confirm that the information provided is accurate.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
