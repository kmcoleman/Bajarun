/**
 * NightlyConfigPage.tsx
 *
 * Admin page for configuring nightly accommodations and meals.
 * Allows setting prices, descriptions, and availability for each night.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Hotel,
  Tent,
  UtensilsCrossed,
  Coffee,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  DollarSign,
  Check,
  AlertCircle,
  UserRound,
  Compass,
  Plus,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { NightConfig, OptionalActivity } from '../types/eventConfig';
import { emptyNightConfig, TRIP_NIGHTS } from '../types/eventConfig';

const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

export default function NightlyConfigPage() {
  const { user, loading: authLoading } = useAuth();

  const [selectedNightIndex, setSelectedNightIndex] = useState(0);
  const [nightConfigs, setNightConfigs] = useState<{ [key: string]: NightConfig }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isAdmin = user?.uid === ADMIN_UID;
  const selectedNight = TRIP_NIGHTS[selectedNightIndex];
  const currentConfig = nightConfigs[selectedNight.key] || { ...emptyNightConfig, date: selectedNight.date };

  // Load pricing configuration from Firestore
  useEffect(() => {
    async function loadConfig() {
      try {
        const docRef = doc(db, 'eventConfig', 'pricing');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.nights) {
            setNightConfigs(data.nights);
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && isAdmin) {
      loadConfig();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading]);

  // Update a field in the current night's config
  const updateField = (field: keyof NightConfig, value: string | number | boolean | OptionalActivity[]) => {
    setNightConfigs(prev => ({
      ...prev,
      [selectedNight.key]: {
        ...currentConfig,
        date: selectedNight.date,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // Add a new optional activity
  const addOptionalActivity = () => {
    const newActivity: OptionalActivity = {
      id: `activity-${Date.now()}`,
      title: '',
      cost: 0,
      description: ''
    };
    const activities = [...(currentConfig.optionalActivities || []), newActivity];
    updateField('optionalActivities', activities);
  };

  // Update an optional activity
  const updateOptionalActivity = (activityId: string, field: keyof OptionalActivity, value: string | number) => {
    const activities = (currentConfig.optionalActivities || []).map(activity =>
      activity.id === activityId ? { ...activity, [field]: value } : activity
    );
    updateField('optionalActivities', activities);
  };

  // Remove an optional activity
  const removeOptionalActivity = (activityId: string) => {
    const activities = (currentConfig.optionalActivities || []).filter(activity => activity.id !== activityId);
    updateField('optionalActivities', activities);
  };

  // Save configuration to Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'eventConfig', 'pricing');
      await setDoc(docRef, {
        nights: nightConfigs,
        updatedAt: new Date(),
        updatedBy: user?.uid
      }, { merge: true });

      setHasChanges(false);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Navigate between nights
  const goToNight = (index: number) => {
    if (index >= 0 && index < TRIP_NIGHTS.length) {
      setSelectedNightIndex(index);
    }
  };

  // Auth loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Daily Configuration</h1>
              <p className="text-slate-400 mt-1">Configure accommodations and meals for each night</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        {/* Night Selector Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => goToNight(selectedNightIndex - 1)}
            disabled={selectedNightIndex === 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          {TRIP_NIGHTS.map((night, index) => {
            const config = nightConfigs[night.key];
            const isConfigured = config && (config.hotelAvailable || config.campingAvailable);

            return (
              <button
                key={night.key}
                onClick={() => setSelectedNightIndex(index)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedNightIndex === index
                    ? 'bg-blue-600 text-white'
                    : isConfigured
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Night {index + 1}
                {isConfigured && selectedNightIndex !== index && (
                  <Check className="inline h-4 w-4 ml-1" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => goToNight(selectedNightIndex + 1)}
            disabled={selectedNightIndex === TRIP_NIGHTS.length - 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Current Night Header */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
          <h2 className="text-xl font-semibold text-white">{selectedNight.label}</h2>
          <p className="text-slate-400">Date: {selectedNight.date}</p>
        </div>

        {/* Night Summary */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
          <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Night Summary
          </label>
          <textarea
            value={currentConfig.nightSummary || ''}
            onChange={(e) => updateField('nightSummary', e.target.value)}
            placeholder="Add a general overview for this night... (e.g., arrival info, location details, what to expect)"
            rows={4}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            This summary will be displayed to users on the accommodation selection page.
          </p>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6">
          {/* HOTEL SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Hotel className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Hotel</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-400">Available</span>
                <button
                  onClick={() => updateField('hotelAvailable', !currentConfig.hotelAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentConfig.hotelAvailable ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentConfig.hotelAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </label>
            </div>

            {currentConfig.hotelAvailable && (
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hotel Name *
                    </label>
                    <input
                      type="text"
                      value={currentConfig.hotelName}
                      onChange={(e) => updateField('hotelName', e.target.value)}
                      placeholder="Hotel Malarrimo"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Cost per Person *
                    </label>
                    <input
                      type="number"
                      value={currentConfig.hotelCost || ''}
                      onChange={(e) => updateField('hotelCost', parseFloat(e.target.value) || 0)}
                      placeholder="50"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <ExternalLink className="inline h-4 w-4 mr-1" />
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={currentConfig.hotelWebsite}
                      onChange={(e) => updateField('hotelWebsite', e.target.value)}
                      placeholder="https://hotel-website.com"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Google Maps Link
                    </label>
                    <input
                      type="url"
                      value={currentConfig.hotelMapsLink}
                      onChange={(e) => updateField('hotelMapsLink', e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentConfig.hotelDescription}
                    onChange={(e) => updateField('hotelDescription', e.target.value)}
                    placeholder="Nice hotel with pool, restaurant, secure parking..."
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Options/Questions to Ask
                  </label>
                  <input
                    type="text"
                    value={currentConfig.hotelOptions}
                    onChange={(e) => updateField('hotelOptions', e.target.value)}
                    placeholder="King bed preference? Early check-in needed?"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </section>

          {/* CAMPING SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Tent className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Camping</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-400">Available</span>
                <button
                  onClick={() => updateField('campingAvailable', !currentConfig.campingAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentConfig.campingAvailable ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentConfig.campingAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </label>
            </div>

            {currentConfig.campingAvailable && (
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Campground Name *
                    </label>
                    <input
                      type="text"
                      value={currentConfig.campingName}
                      onChange={(e) => updateField('campingName', e.target.value)}
                      placeholder="Rancho Meling Campground"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Cost per Person *
                    </label>
                    <input
                      type="number"
                      value={currentConfig.campingCost || ''}
                      onChange={(e) => updateField('campingCost', parseFloat(e.target.value) || 0)}
                      placeholder="15"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={currentConfig.campingMapsLink}
                    onChange={(e) => updateField('campingMapsLink', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentConfig.campingDescription}
                    onChange={(e) => updateField('campingDescription', e.target.value)}
                    placeholder="Scenic campground with showers, fire pits..."
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            )}
          </section>

          {/* DINNER SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dinner</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-400">Available</span>
                <button
                  onClick={() => updateField('dinnerAvailable', !currentConfig.dinnerAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentConfig.dinnerAvailable ? 'bg-amber-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentConfig.dinnerAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </label>
            </div>

            {currentConfig.dinnerAvailable && (
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Dinner Name/Location *
                    </label>
                    <input
                      type="text"
                      value={currentConfig.dinnerName}
                      onChange={(e) => updateField('dinnerName', e.target.value)}
                      placeholder="Group Dinner at Hotel Restaurant"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Cost per Person *
                    </label>
                    <input
                      type="number"
                      value={currentConfig.dinnerCost || ''}
                      onChange={(e) => updateField('dinnerCost', parseFloat(e.target.value) || 0)}
                      placeholder="30"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentConfig.dinnerDescription}
                    onChange={(e) => updateField('dinnerDescription', e.target.value)}
                    placeholder="Family style Mexican fare, drinks included..."
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            )}
          </section>

          {/* BREAKFAST SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                  <Coffee className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Breakfast</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-400">Available</span>
                <button
                  onClick={() => updateField('breakfastAvailable', !currentConfig.breakfastAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentConfig.breakfastAvailable ? 'bg-orange-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentConfig.breakfastAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </label>
            </div>

            {currentConfig.breakfastAvailable && (
              <div className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Breakfast Name/Location *
                    </label>
                    <input
                      type="text"
                      value={currentConfig.breakfastName}
                      onChange={(e) => updateField('breakfastName', e.target.value)}
                      placeholder="Group Breakfast at Ranch"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Cost per Person *
                    </label>
                    <input
                      type="number"
                      value={currentConfig.breakfastCost || ''}
                      onChange={(e) => updateField('breakfastCost', parseFloat(e.target.value) || 0)}
                      placeholder="15"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentConfig.breakfastDescription}
                    onChange={(e) => updateField('breakfastDescription', e.target.value)}
                    placeholder="Ranch-style breakfast, eggs, bacon, coffee..."
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            )}
          </section>

          {/* SINGLE ROOM OPTION SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <UserRound className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Single Room Option</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-400">Available</span>
                <button
                  onClick={() => updateField('singleRoomAvailable', !currentConfig.singleRoomAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentConfig.singleRoomAvailable ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentConfig.singleRoomAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </label>
            </div>

            {currentConfig.singleRoomAvailable && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description / Pricing Info
                  </label>
                  <textarea
                    value={currentConfig.singleRoomDescription}
                    onChange={(e) => updateField('singleRoomDescription', e.target.value)}
                    placeholder="Approximately twice the per person rate"
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <p className="text-sm text-slate-400">
                  When enabled, users who select hotel will be asked if they'd prefer a single room.
                </p>
              </div>
            )}
          </section>

          {/* FLOOR SLEEPING OPTION SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                  <Tent className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Floor Sleeping Option</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-slate-400">Available</span>
                <button
                  onClick={() => updateField('floorSleepingAvailable', !currentConfig.floorSleepingAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentConfig.floorSleepingAvailable ? 'bg-cyan-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentConfig.floorSleepingAvailable ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </label>
            </div>

            {currentConfig.floorSleepingAvailable && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description / Pricing Info
                  </label>
                  <textarea
                    value={currentConfig.floorSleepingDescription}
                    onChange={(e) => updateField('floorSleepingDescription', e.target.value)}
                    placeholder="50% of per person rate - bring your own mattress"
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <p className="text-sm text-slate-400">
                  Budget option for users who want to sleep on the floor with their own mattress at a reduced rate.
                </p>
              </div>
            )}
          </section>

          {/* OPTIONAL ACTIVITIES SECTION */}
          <section className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <Compass className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Optional Activities</h3>
              </div>
              <button
                onClick={addOptionalActivity}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </button>
            </div>

            <div className="p-4 space-y-4">
              {(!currentConfig.optionalActivities || currentConfig.optionalActivities.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No optional activities configured. Click "Add Activity" to create one.
                </p>
              ) : (
                currentConfig.optionalActivities.map((activity, index) => (
                  <div key={activity.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-emerald-400">Activity {index + 1}</span>
                      <button
                        onClick={() => removeOptionalActivity(activity.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Activity Title *
                        </label>
                        <input
                          type="text"
                          value={activity.title}
                          onChange={(e) => updateOptionalActivity(activity.id, 'title', e.target.value)}
                          placeholder="Whale Watching Tour"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          <DollarSign className="inline h-4 w-4 mr-1" />
                          Cost per Person
                        </label>
                        <input
                          type="number"
                          value={activity.cost || ''}
                          onChange={(e) => updateOptionalActivity(activity.id, 'cost', parseFloat(e.target.value) || 0)}
                          placeholder="50"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description / Notes
                      </label>
                      <textarea
                        value={activity.description}
                        onChange={(e) => updateOptionalActivity(activity.id, 'description', e.target.value)}
                        placeholder="A truly bucket-list experience. We'll arrange transportation and logistics."
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                ))
              )}
              <p className="text-sm text-slate-400">
                Optional tours or activities available for this night. Users can indicate their interest.
              </p>
            </div>
          </section>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
