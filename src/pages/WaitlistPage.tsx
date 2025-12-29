/**
 * WaitlistPage.tsx
 *
 * Waitlist/interest form for tours.
 * - For 'waitlist' tours: Users join waitlist for a full tour
 * - For 'interest' tours: Users express interest in a future tour
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Bike,
  Mail,
  Phone,
  MapPin,
  Users,
  Hotel,
  CheckCircle,
  Loader2,
  ClipboardList,
  MessageSquare,
  Bell
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { formatPhoneNumber } from '../utils/formatters';

interface TourInfo {
  id: string;
  name: string;
  registrationType: 'waitlist' | 'interest';
}

interface WaitlistFormData {
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
}

const initialFormData: WaitlistFormData = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  bikeModel: '',
  bikeYear: '',
  hasPillion: false,
  flexibleAccommodations: true,
  heardAbout: '',
  notes: ''
};

export default function WaitlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');

  const [tourInfo, setTourInfo] = useState<TourInfo | null>(null);
  const [loadingTour, setLoadingTour] = useState(!!eventId);
  const [formData, setFormData] = useState<WaitlistFormData>(() => ({
    ...initialFormData,
    email: user?.email || ''
  }));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch tour info if eventId is provided
  useEffect(() => {
    async function fetchTour() {
      if (!eventId) {
        setLoadingTour(false);
        return;
      }

      try {
        const tourDoc = await getDoc(doc(db, 'tours', eventId));
        if (tourDoc.exists()) {
          const data = tourDoc.data();
          setTourInfo({
            id: tourDoc.id,
            name: data.name,
            registrationType: data.registrationType || 'waitlist'
          });
        }
      } catch (error) {
        console.error('Error fetching tour:', error);
      } finally {
        setLoadingTour(false);
      }
    }

    fetchTour();
  }, [eventId]);

  // Determine if this is interest vs waitlist mode
  const isInterestMode = tourInfo?.registrationType === 'interest';

  const updateField = (field: keyof WaitlistFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    updateField('phone', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Add to waitlist (duplicate check removed for security - admin can manage duplicates)
      const waitlistRef = collection(db, 'waitlist');
      await addDoc(waitlistRef, {
        ...formData,
        email: formData.email.toLowerCase(),
        uid: user?.uid || null,
        eventId: eventId || null,
        eventName: tourInfo?.name || null,
        listType: isInterestMode ? 'interest' : 'waitlist',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting waitlist:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading tour info
  if (loadingTour) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Successfully submitted
  if (submitted) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className={`w-16 h-16 ${isInterestMode ? 'bg-purple-600/20' : 'bg-green-600/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {isInterestMode ? (
                <Bell className="h-8 w-8 text-purple-400" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              {isInterestMode ? "You'll Be Notified!" : "You're on the List!"}
            </h1>
            <p className="text-slate-400 mb-6">
              {isInterestMode
                ? `Thanks for your interest in ${tourInfo?.name || 'this tour'}. We'll contact you when registration opens.`
                : `Thanks for your interest in ${tourInfo?.name || 'the tour'}. We'll contact you if a spot opens up.`
              }
            </p>
            <button
              onClick={() => navigate('/tours')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${isInterestMode ? 'bg-purple-600/20' : 'bg-amber-600/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {isInterestMode ? (
              <Bell className="h-8 w-8 text-purple-400" />
            ) : (
              <ClipboardList className="h-8 w-8 text-amber-400" />
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {isInterestMode ? 'Get Notified' : 'Join the Waitlist'}
          </h1>
          {tourInfo && (
            <p className="text-blue-400 font-medium mb-2">{tourInfo.name}</p>
          )}
          <p className="text-slate-400 max-w-xl mx-auto">
            {isInterestMode
              ? "This event isn't open for registration yet. Sign up to be notified when it opens."
              : "Registration is currently closed, but spots occasionally open up. Add your name to the waitlist and we'll contact you if space becomes available."
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Contact Information</h2>
            </div>

            <div className="grid gap-4">
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
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
              </div>
            </div>
          </section>

          {/* Bike Information */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Your Motorcycle</h2>
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
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  <Users className="h-4 w-4 inline mr-1" />
                  Will you have a passenger (pillion)?
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

          {/* Flexibility - only show for waitlist, not interest */}
          {!isInterestMode && (
            <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Hotel className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Flexibility</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.flexibleAccommodations}
                    onChange={(e) => updateField('flexibleAccommodations', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-white font-medium">I'm flexible with accommodations</span>
                    <p className="text-slate-400 text-sm mt-1">
                      Since joining late, you may need to be flexible if preferred hotels are full.
                      Check this if you're OK with alternative arrangements.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          )}

          {/* Additional Info */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Additional Info</h2>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  How did you hear about this tour?
                </label>
                <select
                  value={formData.heardAbout}
                  onChange={(e) => updateField('heardAbout', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="friend">Friend / Word of mouth</option>
                  <option value="norcal">NorCal BMW Club</option>
                  <option value="advrider">ADVRider</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Anything else you'd like us to know?
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Previous Baja experience, specific dates you're available, etc..."
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 px-8 py-4 ${isInterestMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-amber-600 hover:bg-amber-700'} disabled:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-lg`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : isInterestMode ? (
                <>
                  <Bell className="h-5 w-5" />
                  Get Notified
                </>
              ) : (
                <>
                  <ClipboardList className="h-5 w-5" />
                  Join Waitlist
                </>
              )}
            </button>
            <p className="text-sm text-slate-500 text-center">
              {isInterestMode
                ? "We'll email you when registration opens."
                : "We'll contact you if a spot opens up."
              }
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
