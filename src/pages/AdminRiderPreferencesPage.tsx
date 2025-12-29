/**
 * AdminRiderPreferencesPage.tsx
 *
 * Admin page to view and edit any rider's accommodation
 * and meal preferences. Based on AccommodationSelectPage
 * with a rider selection dropdown added.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Hotel,
  Tent,
  UserX,
  UtensilsCrossed,
  Coffee,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Calendar,
  UserRound,
  Compass,
  Users,
  Utensils,
  UserCog
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import type { NightConfig, NightSelection, UserSelections, AccommodationType } from '../types/eventConfig';
import { emptyNightSelection, TRIP_NIGHTS } from '../types/eventConfig';
import { itineraryData } from '../data/itinerary';

interface RiderInfo {
  id: string;
  fullName: string;
  email?: string;
}

export default function AdminRiderPreferencesPage() {
  const { user, loading: authLoading } = useAuth();

  // Rider selection
  const [allRiders, setAllRiders] = useState<RiderInfo[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [selectedRiderName, setSelectedRiderName] = useState<string>('');

  const [nightConfigs, setNightConfigs] = useState<{ [key: string]: NightConfig }>({});
  const [userSelections, setUserSelections] = useState<UserSelections>({});
  const [expandedNights, setExpandedNights] = useState<Set<string>>(new Set(['night-1']));
  const [loading, setLoading] = useState(true);
  const [loadingRider, setLoadingRider] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Roommate and dietary preferences
  const [registeredRiders, setRegisteredRiders] = useState<{ id: string; fullName: string }[]>([]);
  const [preferredRoommate, setPreferredRoommate] = useState<string>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('');


  // Load initial data (riders list and event config)
  useEffect(() => {
    async function loadInitialData() {
      if (!user) return;

      try {
        // Load event pricing config
        const configRef = doc(db, 'eventConfig', 'pricing');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.nights) {
            setNightConfigs(data.nights);
          }
        }

        // Load all registered riders
        const registrationsRef = collection(db, 'registrations');
        const registrationsSnap = await getDocs(registrationsRef);
        const riders: RiderInfo[] = [];
        registrationsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.fullName) {
            riders.push({
              id: docSnap.id,
              fullName: data.fullName,
              email: data.email
            });
          }
        });
        // Sort alphabetically by name
        riders.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setAllRiders(riders);
        setRegisteredRiders(riders.map(r => ({ id: r.id, fullName: r.fullName })));
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadInitialData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Load selected rider's preferences
  const loadRiderPreferences = async (riderId: string) => {
    if (!riderId) {
      setUserSelections({});
      setPreferredRoommate('');
      setDietaryRestrictions('');
      setSelectedRiderName('');
      return;
    }

    setLoadingRider(true);
    try {
      const userRef = doc(db, 'users', riderId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserSelections(userData.accommodationSelections || {});
        setPreferredRoommate(userData.preferredRoommate || '');
        setDietaryRestrictions(userData.dietaryRestrictions || '');
      } else {
        setUserSelections({});
        setPreferredRoommate('');
        setDietaryRestrictions('');
      }

      // Set rider name
      const rider = allRiders.find(r => r.id === riderId);
      setSelectedRiderName(rider?.fullName || '');
      setHasChanges(false);
      setSaveSuccess(false);
    } catch (error) {
      console.error('Error loading rider preferences:', error);
    } finally {
      setLoadingRider(false);
    }
  };

  // Handle rider selection change
  const handleRiderChange = (riderId: string) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard and switch riders?')) {
        return;
      }
    }
    setSelectedRiderId(riderId);
    loadRiderPreferences(riderId);
  };

  // Get the itinerary day info for a night
  const getItineraryForNight = (nightIndex: number) => {
    return itineraryData[nightIndex] || null;
  };

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

  // Update a selection for a night
  const updateSelection = (nightKey: string, field: keyof NightSelection, value: AccommodationType | boolean | string | string[] | null) => {
    setUserSelections(prev => ({
      ...prev,
      [nightKey]: {
        ...(prev[nightKey] || emptyNightSelection),
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Toggle an optional activity interest
  const toggleOptionalActivity = (nightKey: string, activityId: string) => {
    const currentSelection = userSelections[nightKey] || emptyNightSelection;
    const currentInterested = currentSelection.optionalActivitiesInterested || [];
    const newInterested = currentInterested.includes(activityId)
      ? currentInterested.filter(id => id !== activityId)
      : [...currentInterested, activityId];
    updateSelection(nightKey, 'optionalActivitiesInterested', newInterested);
  };

  // Save selections to Firestore for the selected rider
  const handleSave = async () => {
    if (!selectedRiderId) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', selectedRiderId);
      await setDoc(userRef, {
        accommodationSelections: userSelections,
        preferredRoommate: preferredRoommate || null,
        dietaryRestrictions: dietaryRestrictions || null,
        selectionsUpdatedAt: new Date(),
        selectionsUpdatedBy: user?.uid || 'admin'
      }, { merge: true });

      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving selections:', error);
      alert('Failed to save selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate estimated total
  const calculateTotal = () => {
    let total = 0;
    TRIP_NIGHTS.forEach(night => {
      const config = nightConfigs[night.key];
      const selection = userSelections[night.key];
      if (!config || !selection) return;

      if (selection.accommodation === 'hotel' && config.hotelAvailable) {
        total += config.hotelCost;
      } else if (selection.accommodation === 'camping' && config.campingAvailable) {
        total += config.campingCost;
      }

      if (selection.dinner && config.dinnerAvailable) {
        total += config.dinnerCost;
      }
      if (selection.breakfast && config.breakfastAvailable) {
        total += config.breakfastCost;
      }
      if (config.optionalActivities && selection.optionalActivitiesInterested) {
        config.optionalActivities.forEach(activity => {
          if (selection.optionalActivitiesInterested.includes(activity.id)) {
            total += activity.cost;
          }
        });
      }
    });
    return total;
  };

  // Loading
  if (loading) {
    return (
      <AdminLayout title="Edit Rider Preferences">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Rider Preferences">
      <div className="max-w-4xl mx-auto">
        {/* Subtitle */}
        <p className="text-slate-400 mb-8">
          Select a rider to view and edit their accommodation, meal, and tour preferences.
        </p>

        {/* Rider Selection */}
        <div className="bg-purple-900/30 border border-purple-600/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Select Rider</h3>
              <p className="text-sm text-slate-400">Choose a rider to edit their preferences</p>
            </div>
          </div>
          <select
            value={selectedRiderId}
            onChange={(e) => handleRiderChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
          >
            <option value="">-- Select a rider --</option>
            {allRiders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.fullName} {rider.email ? `(${rider.email})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* No rider selected message */}
        {!selectedRiderId && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <UserCog className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Select a rider above to view and edit their preferences.</p>
          </div>
        )}

        {/* Loading rider data */}
        {selectedRiderId && loadingRider && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading rider preferences...</p>
          </div>
        )}

        {/* Rider preferences form */}
        {selectedRiderId && !loadingRider && (
          <>
            {/* Editing indicator */}
            <div className="bg-blue-900/30 border border-blue-600/50 rounded-xl p-4 mb-6 flex items-center gap-3">
              <UserCog className="h-5 w-5 text-blue-400" />
              <p className="text-blue-200">
                Editing preferences for <strong>{selectedRiderName}</strong>
              </p>
            </div>

            {/* Estimated Total & Save Button */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm text-slate-400">Estimated Total</div>
                <div className="text-2xl font-bold text-white">
                  ${calculateTotal().toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">Based on current selections</div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors ${
                  saveSuccess
                    ? 'bg-green-600 text-white'
                    : hasChanges
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
              </button>
            </div>

            {/* Preferences Section */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6 space-y-6">
              {/* Preferred Roommate */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Preferred Roommate</h3>
                    <p className="text-sm text-slate-400">Select their preferred roommate</p>
                  </div>
                </div>
                <select
                  value={preferredRoommate}
                  onChange={(e) => {
                    setPreferredRoommate(e.target.value);
                    setHasChanges(true);
                    setSaveSuccess(false);
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">No preference</option>
                  {registeredRiders
                    .filter(rider => rider.id !== selectedRiderId)
                    .map((rider) => (
                      <option key={rider.id} value={rider.fullName}>
                        {rider.fullName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Utensils className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Dietary Restrictions</h3>
                    <p className="text-sm text-slate-400">Any dietary needs or allergies</p>
                  </div>
                </div>
                <textarea
                  value={dietaryRestrictions}
                  onChange={(e) => {
                    setDietaryRestrictions(e.target.value);
                    setHasChanges(true);
                    setSaveSuccess(false);
                  }}
                  placeholder="e.g., Vegetarian, gluten-free, nut allergy, etc."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Night Cards */}
            <div className="space-y-4">
              {TRIP_NIGHTS.map((night, index) => {
                const config = nightConfigs[night.key];
                const selection = userSelections[night.key] || emptyNightSelection;
                const isExpanded = expandedNights.has(night.key);
                const itineraryDay = getItineraryForNight(index);
                const hasOptions = config && (config.hotelAvailable || config.campingAvailable);

                return (
                  <div
                    key={night.key}
                    className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                  >
                    {/* Night Header */}
                    <button
                      onClick={() => toggleNight(night.key)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-white">
                            {night.label}
                          </h3>
                          <div className="text-sm text-slate-400">
                            {itineraryDay ? itineraryDay.endPoint : 'Location TBD'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Selection summary badges */}
                        {selection.accommodation && (
                          <span className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            selection.accommodation === 'hotel'
                              ? 'bg-blue-600/20 text-blue-400'
                              : selection.accommodation === 'camping'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-slate-600/20 text-slate-400'
                          }`}>
                            {selection.accommodation === 'hotel' && <Hotel className="h-4 w-4" />}
                            {selection.accommodation === 'camping' && <Tent className="h-4 w-4" />}
                            {selection.accommodation === 'own' && <UserX className="h-4 w-4" />}
                            {selection.accommodation === 'hotel' ? 'Hotel' : selection.accommodation === 'camping' ? 'Camping' : 'Own'}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-slate-700">
                        {!hasOptions ? (
                          <div className="pt-6 text-center text-slate-400">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Accommodation options not yet configured for this night.</p>
                          </div>
                        ) : (
                          <div className="pt-6 space-y-6">
                            {/* NIGHT SUMMARY */}
                            {config.nightSummary && (
                              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <p className="text-slate-300 whitespace-pre-wrap">{config.nightSummary}</p>
                              </div>
                            )}

                            {/* ACCOMMODATION SELECTION */}
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                                Accommodation
                              </h4>
                              <div className="grid gap-3">
                                {/* Hotel Option */}
                                {config.hotelAvailable && (
                                  <label
                                    className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                      selection.accommodation === 'hotel'
                                        ? 'border-blue-500 bg-blue-600/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`accommodation-${night.key}`}
                                      checked={selection.accommodation === 'hotel'}
                                      onChange={() => updateSelection(night.key, 'accommodation', 'hotel')}
                                      className="sr-only"
                                    />
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      selection.accommodation === 'hotel' ? 'bg-blue-600' : 'bg-slate-700'
                                    }`}>
                                      <Hotel className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">Hotel</span>
                                        <span className="text-blue-400 font-semibold">
                                          ${config.hotelCost}/person
                                        </span>
                                      </div>
                                      <div className="text-sm text-slate-300 mt-1">{config.hotelName}</div>
                                    </div>
                                    {selection.accommodation === 'hotel' && (
                                      <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                    )}
                                  </label>
                                )}

                                {/* Single Room Preference */}
                                {config.hotelAvailable && config.singleRoomAvailable && selection.accommodation === 'hotel' && (
                                  <label
                                    className={`relative flex items-start gap-4 p-4 ml-6 rounded-lg border-2 cursor-pointer transition-colors ${
                                      selection.prefersSingleRoom
                                        ? 'border-purple-500 bg-purple-600/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selection.prefersSingleRoom || false}
                                      onChange={(e) => updateSelection(night.key, 'prefersSingleRoom', e.target.checked)}
                                      className="sr-only"
                                    />
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      selection.prefersSingleRoom ? 'bg-purple-600' : 'bg-slate-700'
                                    }`}>
                                      <UserRound className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-white">
                                        Prefers single room if available
                                      </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      selection.prefersSingleRoom
                                        ? 'bg-purple-600 border-purple-600'
                                        : 'border-slate-500'
                                    }`}>
                                      {selection.prefersSingleRoom && <Check className="h-4 w-4 text-white" />}
                                    </div>
                                  </label>
                                )}

                                {/* Floor Sleeping Option */}
                                {config.hotelAvailable && config.floorSleepingAvailable && selection.accommodation === 'hotel' && (
                                  <label
                                    className={`relative flex items-start gap-4 p-4 ml-6 rounded-lg border-2 cursor-pointer transition-colors ${
                                      selection.prefersFloorSleeping
                                        ? 'border-cyan-500 bg-cyan-600/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selection.prefersFloorSleeping || false}
                                      onChange={(e) => updateSelection(night.key, 'prefersFloorSleeping', e.target.checked)}
                                      className="sr-only"
                                    />
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      selection.prefersFloorSleeping ? 'bg-cyan-600' : 'bg-slate-700'
                                    }`}>
                                      <Tent className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-white">
                                        Prefers floor sleeping (budget option)
                                      </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      selection.prefersFloorSleeping
                                        ? 'bg-cyan-600 border-cyan-600'
                                        : 'border-slate-500'
                                    }`}>
                                      {selection.prefersFloorSleeping && <Check className="h-4 w-4 text-white" />}
                                    </div>
                                  </label>
                                )}

                                {/* Camping Option */}
                                {config.campingAvailable && (
                                  <label
                                    className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                      selection.accommodation === 'camping'
                                        ? 'border-green-500 bg-green-600/10'
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`accommodation-${night.key}`}
                                      checked={selection.accommodation === 'camping'}
                                      onChange={() => updateSelection(night.key, 'accommodation', 'camping')}
                                      className="sr-only"
                                    />
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      selection.accommodation === 'camping' ? 'bg-green-600' : 'bg-slate-700'
                                    }`}>
                                      <Tent className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white">Camping</span>
                                        <span className="text-green-400 font-semibold">
                                          ${config.campingCost}/person
                                        </span>
                                      </div>
                                      <div className="text-sm text-slate-300 mt-1">{config.campingName}</div>
                                    </div>
                                    {selection.accommodation === 'camping' && (
                                      <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                                    )}
                                  </label>
                                )}

                                {/* Arrange Separately Option */}
                                <label
                                  className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                    selection.accommodation === 'own'
                                      ? 'border-slate-400 bg-slate-600/10'
                                      : 'border-slate-600 hover:border-slate-500'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`accommodation-${night.key}`}
                                    checked={selection.accommodation === 'own'}
                                    onChange={() => updateSelection(night.key, 'accommodation', 'own')}
                                    className="sr-only"
                                  />
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    selection.accommodation === 'own' ? 'bg-slate-500' : 'bg-slate-700'
                                  }`}>
                                    <UserX className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-white">Arranging separately</span>
                                      <span className="text-slate-400 font-semibold">$0</span>
                                    </div>
                                  </div>
                                  {selection.accommodation === 'own' && (
                                    <Check className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                  )}
                                </label>
                              </div>
                            </div>

                            {/* MEALS SELECTION */}
                            {(config.dinnerAvailable || config.breakfastAvailable) && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                                  Meals
                                </h4>
                                <div className="grid gap-3">
                                  {/* Dinner Option */}
                                  {config.dinnerAvailable && (
                                    <label
                                      className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                        selection.dinner
                                          ? 'border-amber-500 bg-amber-600/10'
                                          : 'border-slate-600 hover:border-slate-500'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selection.dinner}
                                        onChange={(e) => updateSelection(night.key, 'dinner', e.target.checked)}
                                        className="sr-only"
                                      />
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        selection.dinner ? 'bg-amber-600' : 'bg-slate-700'
                                      }`}>
                                        <UtensilsCrossed className="h-5 w-5 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-white">Dinner</span>
                                          <span className="text-amber-400 font-semibold">
                                            ${config.dinnerCost}/person
                                          </span>
                                        </div>
                                        <div className="text-sm text-slate-300 mt-1">{config.dinnerName}</div>
                                      </div>
                                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        selection.dinner
                                          ? 'bg-amber-600 border-amber-600'
                                          : 'border-slate-500'
                                      }`}>
                                        {selection.dinner && <Check className="h-4 w-4 text-white" />}
                                      </div>
                                    </label>
                                  )}

                                  {/* Breakfast Option */}
                                  {config.breakfastAvailable && (
                                    <label
                                      className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                        selection.breakfast
                                          ? 'border-orange-500 bg-orange-600/10'
                                          : 'border-slate-600 hover:border-slate-500'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selection.breakfast}
                                        onChange={(e) => updateSelection(night.key, 'breakfast', e.target.checked)}
                                        className="sr-only"
                                      />
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        selection.breakfast ? 'bg-orange-600' : 'bg-slate-700'
                                      }`}>
                                        <Coffee className="h-5 w-5 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-white">Breakfast</span>
                                          <span className="text-orange-400 font-semibold">
                                            ${config.breakfastCost}/person
                                          </span>
                                        </div>
                                        <div className="text-sm text-slate-300 mt-1">{config.breakfastName}</div>
                                      </div>
                                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        selection.breakfast
                                          ? 'bg-orange-600 border-orange-600'
                                          : 'border-slate-500'
                                      }`}>
                                        {selection.breakfast && <Check className="h-4 w-4 text-white" />}
                                      </div>
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* OPTIONAL ACTIVITIES SELECTION */}
                            {config.optionalActivities && config.optionalActivities.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                                  Optional {config.optionalActivities.length === 1 ? 'Activity' : 'Activities'}
                                </h4>
                                <div className="grid gap-3">
                                  {config.optionalActivities.map(activity => {
                                    const isInterested = (selection.optionalActivitiesInterested || []).includes(activity.id);
                                    return (
                                      <label
                                        key={activity.id}
                                        className={`relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                          isInterested
                                            ? 'border-emerald-500 bg-emerald-600/10'
                                            : 'border-slate-600 hover:border-slate-500'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isInterested}
                                          onChange={() => toggleOptionalActivity(night.key, activity.id)}
                                          className="sr-only"
                                        />
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          isInterested ? 'bg-emerald-600' : 'bg-slate-700'
                                        }`}>
                                          <Compass className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className="font-semibold text-white">{activity.title}</span>
                                            {activity.cost > 0 && (
                                              <span className="text-emerald-400 font-semibold">
                                                ${activity.cost}/person
                                              </span>
                                            )}
                                          </div>
                                          {activity.description && (
                                            <p className="text-sm text-slate-400 mt-2">{activity.description}</p>
                                          )}
                                        </div>
                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                          isInterested
                                            ? 'bg-emerald-600 border-emerald-600'
                                            : 'border-slate-500'
                                        }`}>
                                          {isInterested && <Check className="h-4 w-4 text-white" />}
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-colors ${
                  saveSuccess
                    ? 'bg-green-600 text-white'
                    : hasChanges
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
