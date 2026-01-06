/**
 * ItineraryPage.tsx
 *
 * Shows the complete trip itinerary with:
 * - Day tabs across the top for quick navigation
 * - Selected day's details shown below
 * - Route map, miles, time, accommodations, points of interest
 *
 * Data source: Firestore events/bajarun2026/routes/day{N}
 */

import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  Milestone,
  Hotel,
  Star,
  Calendar,
  Tent,
  Info,
  Map,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Phone
} from 'lucide-react';
import { useRoutes, calculateTripSummary } from '../hooks/useRoutes';
import type { RouteConfig } from '../types/routeConfig';
import ReactMarkdown from 'react-markdown';
import type { NightConfig } from '../types/eventConfig';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import RouteMap from '../components/RouteMap';

export default function ItineraryPage() {
  const { routes, loading, error } = useRoutes();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [nightConfigs, setNightConfigs] = useState<{ [key: string]: NightConfig }>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  // Fetch pricing/accommodation data
  useEffect(() => {
    async function loadPricingData() {
      try {
        const configRef = doc(db, 'eventConfig', 'pricing');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.nights) {
            setNightConfigs(data.nights);
          }
        }
      } catch (err) {
        console.error('Error loading pricing data:', err);
      }
    }
    loadPricingData();
  }, []);

  // Navigate to previous/next day
  const goToPrevDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(selectedDay - 1);
    }
  };

  const goToNextDay = () => {
    if (selectedDay < routes.length) {
      setSelectedDay(selectedDay + 1);
    }
  };

  // Scroll tabs to show selected day
  useEffect(() => {
    if (tabsRef.current) {
      const selectedTab = tabsRef.current.querySelector(`[data-day="${selectedDay}"]`);
      if (selectedTab) {
        selectedTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDay]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || routes.length === 0) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>{error || 'No routes found'}</p>
        </div>
      </div>
    );
  }

  const tripSummary = calculateTripSummary(routes);
  const currentDay = routes.find(d => d.day === selectedDay) || routes[0];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Trip Itinerary</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {tripSummary.totalDays} days of adventure from {tripSummary.startLocation} to {tripSummary.endLocation}
          </p>

          {/* Trip Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span>{tripSummary.startDate} - {tripSummary.endDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Milestone className="h-5 w-5 text-blue-400" />
              <span>{tripSummary.totalMiles.toLocaleString()} total miles</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Hotel className="h-5 w-5 text-blue-400" />
              <span>{tripSummary.totalDays - 1} nights</span>
            </div>
          </div>

          {/* Draft Notice */}
          <div className="mt-6 max-w-2xl mx-auto p-4 bg-amber-600/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200/80 text-sm text-left">
              <strong className="text-amber-300">Draft Itinerary:</strong> This itinerary is subject to change.
              The route will be fine-tuned to focus on the best roads we can find.
            </p>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-2 mb-6">
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={goToPrevDay}
              disabled={selectedDay === 1}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>

            {/* Scrollable Tabs */}
            <div
              ref={tabsRef}
              className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {routes.map((day) => {
                const isSelected = selectedDay === day.day;
                const miles = day.estimatedDistance || 0;
                const isRestDay = miles === 0;

                return (
                  <button
                    key={day.day}
                    data-day={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all ${
                      isSelected
                        ? isRestDay
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">Day {day.day}</div>
                      <div className="text-xs opacity-80 whitespace-nowrap">
                        {miles > 0 ? `${miles} mi` : 'Rest'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNextDay}
              disabled={selectedDay === routes.length}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Selected Day Content */}
        <DayContent
          day={currentDay}
          onDayClick={setSelectedDay}
          nightConfig={nightConfigs[`night-${selectedDay}`]}
        />
      </div>
    </div>
  );
}

interface DayContentProps {
  day: RouteConfig;
  onDayClick: (day: number) => void;
  nightConfig?: NightConfig;
}

function DayContent({ day, onDayClick, nightConfig }: DayContentProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const miles = day.estimatedDistance || 0;
  const isRestDay = miles === 0;
  const description = day.rideSummary || day.description;

  // Reset expanded state when day changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [day.day]);

  return (
    <div className="space-y-6">
      {/* Day Header Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-start gap-4">
          {/* Day number badge */}
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isRestDay ? 'bg-green-600/20' : 'bg-blue-600/20'
          }`}>
            <span className={`text-2xl font-bold ${
              isRestDay ? 'text-green-400' : 'text-blue-400'
            }`}>
              {day.day}
            </span>
          </div>

          {/* Title and info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white">{day.title}</h2>
              {isRestDay && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                  <Star className="h-4 w-4" />
                  Rest Day
                </span>
              )}
            </div>
            <p className="text-slate-400 mt-1">{day.date}</p>

            {/* Description with expand/collapse and markdown support */}
            {description && (
              <div className="mt-3">
                <div className={`text-slate-300 ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-2 mb-1">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-200 mt-2 mb-1">{children}</h4>,
                      p: ({ children }) => <p className="my-2">{children}</p>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="text-slate-200">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-slate-300">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {description}
                  </ReactMarkdown>
                </div>
                {description.length > 200 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Map - Side by Side with Route Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left - Route Map (taller, focuses on selected day) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-400" />
              Route Map
            </h3>
          </div>
          <div className="h-[400px]">
            <RouteMap onDayClick={onDayClick} selectedDay={day.day} />
          </div>
        </div>

        {/* Right - Route Details */}
        <div className="space-y-4">
          {/* From/To */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Route</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">From</div>
                  <div className="text-white font-medium">{day.startName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">To</div>
                  <div className="text-white font-medium">{day.endName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Milestone className="h-4 w-4" />
                Distance
              </div>
              <div className="text-xl font-bold text-white">
                {miles > 0 ? `${miles} mi` : 'Rest'}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="h-4 w-4" />
                Riding Time
              </div>
              <div className="text-xl font-bold text-white">{day.estimatedTime || 'N/A'}</div>
            </div>
          </div>

          {/* Accommodation */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
              {day.accommodationType === 'camping' ? (
                <Tent className="h-5 w-5" />
              ) : day.accommodationType === 'mixed' ? (
                <div className="flex items-center gap-1">
                  <Hotel className="h-5 w-5" />
                  <span>/</span>
                  <Tent className="h-5 w-5" />
                </div>
              ) : (
                <Hotel className="h-5 w-5" />
              )}
              <span className="font-semibold text-white text-base">Accommodation</span>
            </div>

            {/* Hotel Info */}
            {nightConfig?.hotelAvailable && nightConfig.hotelName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-blue-400" />
                  {nightConfig.hotelWebsite ? (
                    <a
                      href={nightConfig.hotelWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      {nightConfig.hotelName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-white font-medium">{nightConfig.hotelName}</span>
                  )}
                </div>
                {nightConfig.hotelAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    {nightConfig.hotelMapsLink ? (
                      <a
                        href={nightConfig.hotelMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        {nightConfig.hotelAddress}
                      </a>
                    ) : (
                      <span className="text-slate-300">{nightConfig.hotelAddress}</span>
                    )}
                  </div>
                )}
                {nightConfig.hotelPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a
                      href={`tel:${nightConfig.hotelPhone}`}
                      className="text-slate-300 hover:text-blue-400 transition-colors"
                    >
                      {nightConfig.hotelPhone}
                    </a>
                  </div>
                )}
                {nightConfig.hotelDescription && (
                  <p className="text-sm text-slate-400 mt-2">{nightConfig.hotelDescription}</p>
                )}
              </div>
            )}

            {/* Camping Info */}
            {nightConfig?.campingAvailable && nightConfig.campingName && (
              <div className={`space-y-2 ${nightConfig?.hotelAvailable && nightConfig.hotelName ? 'mt-4 pt-4 border-t border-slate-700' : ''}`}>
                <div className="flex items-center gap-2">
                  <Tent className="h-4 w-4 text-green-400" />
                  {nightConfig.campingMapsLink ? (
                    <a
                      href={nightConfig.campingMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium hover:text-green-400 transition-colors flex items-center gap-1"
                    >
                      {nightConfig.campingName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-white font-medium">{nightConfig.campingName}</span>
                  )}
                </div>
                {nightConfig.campingDescription && (
                  <p className="text-sm text-slate-400">{nightConfig.campingDescription}</p>
                )}
              </div>
            )}

            {/* Fallback if no accommodation info */}
            {(!nightConfig || (!nightConfig.hotelAvailable && !nightConfig.campingAvailable)) && (
              <div className="text-white">{day.accommodation || 'TBD'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Highlights */}
      {nightConfig?.highlights && nightConfig.highlights.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Star className="h-5 w-5 text-amber-400" />
            <span className="font-semibold text-white text-lg">Highlights</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {nightConfig.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <span className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center flex-shrink-0 text-amber-400 text-sm font-medium">
                  {index + 1}
                </span>
                <span className="font-medium">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
