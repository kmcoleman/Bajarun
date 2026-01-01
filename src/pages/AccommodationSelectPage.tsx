/**
 * AccommodationSelectPage.tsx
 *
 * Page for registrants to review and select their accommodation
 * and meal options for each night of the trip.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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
  MapPin,
  ExternalLink,
  Check,
  AlertCircle,
  Calendar,
  UserRound,
  Compass,
  Users,
  Utensils
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import type { NightConfig, NightSelection, UserSelections, AccommodationType } from '../types/eventConfig';
import { emptyNightSelection, TRIP_NIGHTS } from '../types/eventConfig';
import { itineraryData } from '../data/itinerary';

export default function AccommodationSelectPage() {
  const { user, loading: authLoading } = useAuth();

  const [nightConfigs, setNightConfigs] = useState<{ [key: string]: NightConfig }>({});
  const [userSelections, setUserSelections] = useState<UserSelections>({});
  const [expandedNights, setExpandedNights] = useState<Set<string>>(new Set(['night-1']));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Roommate and dietary preferences
  const [registeredRiders, setRegisteredRiders] = useState<{ id: string; fullName: string }[]>([]);
  const [preferredRoommate, setPreferredRoommate] = useState<string>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('');

  // Track if user has already submitted selections (read-only after first save)
  const [hasExistingSelections, setHasExistingSelections] = useState(false);

  // Load event config and user selections from Firestore
  useEffect(() => {
    async function loadData() {
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

        // Load user's existing selections and preferences
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.accommodationSelections) {
            setUserSelections(userData.accommodationSelections);
            // Check if they have at least one accommodation selected (means they've submitted before)
            const hasAnySelection = Object.values(userData.accommodationSelections).some(
              (sel: any) => sel?.accommodation
            );
            setHasExistingSelections(hasAnySelection);
          }
          if (userData.preferredRoommate) {
            setPreferredRoommate(userData.preferredRoommate);
          }
          if (userData.dietaryRestrictions) {
            setDietaryRestrictions(userData.dietaryRestrictions);
          }
        }

        // Load registered riders for roommate dropdown
        const registrationsRef = collection(db, 'registrations');
        const registrationsSnap = await getDocs(registrationsRef);
        const riders: { id: string; fullName: string }[] = [];
        registrationsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.fullName && doc.id !== user.uid) {
            riders.push({ id: doc.id, fullName: data.fullName });
          }
        });
        // Sort alphabetically by name
        riders.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setRegisteredRiders(riders);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Get the itinerary day info for a night
  const getItineraryForNight = (nightIndex: number) => {
    // Night 1 corresponds to Day 1's accommodation, etc.
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
    // Prevent updates if selections already submitted
    if (hasExistingSelections) return;

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
    // Prevent updates if selections already submitted
    if (hasExistingSelections) return;

    const currentSelection = userSelections[nightKey] || emptyNightSelection;
    const currentInterested = currentSelection.optionalActivitiesInterested || [];
    const newInterested = currentInterested.includes(activityId)
      ? currentInterested.filter(id => id !== activityId)
      : [...currentInterested, activityId];
    updateSelection(nightKey, 'optionalActivitiesInterested', newInterested);
  };

  // Get nights that are missing accommodation selection
  const getMissingAccommodationNights = () => {
    return TRIP_NIGHTS.filter(night => {
      const config = nightConfigs[night.key];
      const selection = userSelections[night.key];
      // Only check nights that have options configured
      const hasOptions = config && (config.hotelAvailable || config.campingAvailable);
      if (!hasOptions) return false;
      // Check if accommodation is selected
      return !selection?.accommodation;
    });
  };

  const missingNights = getMissingAccommodationNights();
  const isComplete = missingNights.length === 0;

  // Save selections to Firestore
  const handleSave = async () => {
    if (!user) return;

    // Validate all nights have accommodation selected
    if (!isComplete) {
      const missingLabels = missingNights.map(n => n.label).join(', ');
      alert(`Please select accommodation for: ${missingLabels}`);
      // Expand the first missing night
      if (missingNights.length > 0) {
        setExpandedNights(prev => new Set([...prev, missingNights[0].key]));
      }
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        accommodationSelections: userSelections,
        preferredRoommate: preferredRoommate || null,
        dietaryRestrictions: dietaryRestrictions || null,
        selectionsUpdatedAt: new Date()
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
      // Sum costs of selected optional activities
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

  // Auth loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-slate-400 mb-6">Please log in to select your accommodation options.</p>
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Accommodation, Meal Selection, and Optional Tours</h1>
          <p className="text-slate-400">
            To finalize our reservations and ensure everyone is comfortable, please select your preferred options below. All prices listed are estimated totals based on current rates; final costs will be confirmed once bookings are secured.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-4 mb-6">
          <p className="text-amber-200 text-sm">
            <strong>Important:</strong> Specific hotels are not yet finalized, but those listed in the itinerary are representative of the quality, type, and cost of the accommodations we will use.
          </p>
        </div>

        {/* Read-Only Notice - shown when selections already submitted */}
        {hasExistingSelections && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-200 font-medium">Your selections have been submitted</p>
              <p className="text-blue-200/70 text-sm mt-1">
                Your accommodation and meal selections are locked. If you need to make changes, please contact <a href="mailto:bmwriderkmc@gmail.com" className="underline hover:text-blue-100">bmwriderkmc@gmail.com</a>.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6 space-y-6">
          {/* Lodging Details */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">1. Lodging Details</h3>
            <p className="text-slate-300 text-sm mb-3">
              Our standard arrangement is a shared room (two riders per room). We handle all logistics for both hotel and campsite bookings throughout the trip.
            </p>
            <ul className="text-slate-400 text-sm space-y-2">
              <li><strong className="text-slate-300">Shared Room (Standard):</strong> Included in the base estimate. You will be paired with another rider. You can select your preferred roommate below.</li>
              <li><strong className="text-slate-300">Single Room Request:</strong> If you prefer a private room, please select the "Single Room" option. Single rooms are subject to limited availability and cannot be guaranteed. If available, the cost is approximately double the per-person shared rate.</li>
            </ul>
          </div>

          {/* Pricing Note */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">2. Pricing</h3>
            <p className="text-slate-300 text-sm">
              All prices shown are estimates based on current rates and should be within +/- 10-15% of the displayed cost. The actual cost will be used when we finalize bills at each location.
            </p>
          </div>

          {/* Group Dining */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">3. Group Dining</h3>
            <p className="text-slate-300 text-sm mb-3">
              At select locations, we will organize a hosted group dinner to simplify logistics and enjoy the camaraderie of the ride.
            </p>
            <ul className="text-slate-400 text-sm space-y-2">
              <li><strong className="text-slate-300">Fixed Menu & Price:</strong> These dinners feature a curated menu for quality and efficiency. The set per-person price will be added to your final itinerary.</li>
              <li><strong className="text-slate-300">Dietary Restrictions:</strong> If you are a vegetarian or have specific dietary requirements, please make note of that. Please be aware that it may be difficult to meet all dietary needs in remote parts of Baja, so we will take a "best efforts" approach to accommodate you.</li>
            </ul>
          </div>

          {/* Optional Tours */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">4. Optional Tours</h3>
            <p className="text-slate-300 text-sm mb-3">
              Beyond the main route, we offer optional tours depending on local conditions and group interest.
            </p>
            <ul className="text-slate-400 text-sm space-y-2">
              <li><strong className="text-slate-300">Whale Watching Tour:</strong> A truly bucket-list experience. If you have never done this, I highly recommend it.</li>
              <li><strong className="text-slate-300">Rest Day Side Trips:</strong> On our rest day at Bahía Concepción, you can take optional rides to the charming town of Mulegé (30 min), the beautiful colonial town of Loreto (90 min), or the historic Mission San Javier (2.25 hours).</li>
            </ul>
            <p className="text-slate-400 text-sm mt-3">
              <strong className="text-slate-300">Interested?</strong> If you are interested in any optional tours, please indicate below and I will handle the organization and logistics for the group.
            </p>
          </div>

          {/* Next Step */}
          <div className="pt-4 border-t border-slate-700">
            <p className="text-slate-300 text-sm">
              <strong>Next Step:</strong> Once you submit these selections, I will finalize the master reservation list and provide your updated trip estimate.
            </p>
          </div>
        </div>

        {/* Incomplete Warning */}
        {!isComplete && Object.keys(nightConfigs).length > 0 && (
          <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 font-medium">Accommodation selection required</p>
              <p className="text-amber-200/70 text-sm mt-1">
                Please select accommodation for {missingNights.length === 1 ? 'this night' : 'these nights'}: {missingNights.map(n => n.label.replace('Night ', '')).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Estimated Total & Save Button */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-400">Estimated Total</div>
            <div className="text-2xl font-bold text-white">
              ${calculateTotal().toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">Based on current selections</div>
          </div>
          {!hasExistingSelections && (
            <button
              onClick={handleSave}
              disabled={saving || (!hasChanges && isComplete)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors ${
                saveSuccess
                  ? 'bg-green-600 text-white'
                  : hasChanges || !isComplete
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
              {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Selections'}
            </button>
          )}
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
                <p className="text-sm text-slate-400">If you have a preferred roommate, select them here</p>
              </div>
            </div>
            <select
              value={preferredRoommate}
              onChange={(e) => {
                if (hasExistingSelections) return;
                setPreferredRoommate(e.target.value);
                setHasChanges(true);
                setSaveSuccess(false);
              }}
              disabled={hasExistingSelections}
              className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${hasExistingSelections ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="">No preference</option>
              {registeredRiders.map((rider) => (
                <option key={rider.id} value={rider.id}>
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
                <p className="text-sm text-slate-400">Let us know about any dietary needs or allergies</p>
              </div>
            </div>
            <textarea
              value={dietaryRestrictions}
              onChange={(e) => {
                if (hasExistingSelections) return;
                setDietaryRestrictions(e.target.value);
                setHasChanges(true);
                setSaveSuccess(false);
              }}
              disabled={hasExistingSelections}
              placeholder="e.g., Vegetarian, gluten-free, nut allergy, etc."
              rows={3}
              className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${hasExistingSelections ? 'opacity-60 cursor-not-allowed' : ''}`}
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
            const isMissingSelection = hasOptions && !selection.accommodation;

            return (
              <div
                key={night.key}
                className={`bg-slate-800 rounded-xl border overflow-hidden ${
                  isMissingSelection ? 'border-amber-500/50' : 'border-slate-700'
                }`}
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
                    {isMissingSelection ? (
                      <span className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-amber-600/20 text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        Required
                      </span>
                    ) : selection.accommodation && (
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
                                  {config.hotelDescription && (
                                    <p className="text-sm text-slate-400 mt-2">{config.hotelDescription}</p>
                                  )}
                                  {(config.hotelWebsite || config.hotelMapsLink) && (
                                    <div className="flex gap-4 mt-2">
                                      {config.hotelWebsite && (
                                        <a
                                          href={config.hotelWebsite}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          Website
                                        </a>
                                      )}
                                      {config.hotelMapsLink && (
                                        <a
                                          href={config.hotelMapsLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                          <MapPin className="h-3 w-3" />
                                          Map
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {selection.accommodation === 'hotel' && (
                                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                )}
                              </label>
                            )}

                            {/* Single Room Preference - shown when hotel selected and single room available */}
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
                                    I'd prefer a single room if available
                                  </div>
                                  <p className="text-sm text-slate-400 mt-1">
                                    {config.singleRoomDescription || 'Approximately twice the per person rate'}
                                  </p>
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

                            {/* Floor Sleeping Option - shown when hotel selected and floor sleeping available */}
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
                                    I'd prefer floor sleeping (budget option)
                                  </div>
                                  <p className="text-sm text-slate-400 mt-1">
                                    {config.floorSleepingDescription || '50% of per person rate - bring your own mattress'}
                                  </p>
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
                                  {config.campingDescription && (
                                    <p className="text-sm text-slate-400 mt-2">{config.campingDescription}</p>
                                  )}
                                  {config.campingMapsLink && (
                                    <a
                                      href={config.campingMapsLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 mt-2"
                                    >
                                      <MapPin className="h-3 w-3" />
                                      Map
                                    </a>
                                  )}
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
                                  <span className="font-semibold text-white">I'll arrange separately</span>
                                  <span className="text-slate-400 font-semibold">$0</span>
                                </div>
                                <p className="text-sm text-slate-400 mt-1">
                                  I will make my own accommodation arrangements for this night.
                                </p>
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
                                    {config.dinnerDescription && (
                                      <p className="text-sm text-slate-400 mt-2">{config.dinnerDescription}</p>
                                    )}
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
                                    {config.breakfastDescription && (
                                      <p className="text-sm text-slate-400 mt-2">{config.breakfastDescription}</p>
                                    )}
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
        {!hasExistingSelections && (
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
              {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Selections'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
