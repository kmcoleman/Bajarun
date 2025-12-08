/**
 * ItineraryPage.tsx
 *
 * Shows the complete trip itinerary with:
 * - Route map (placeholder for now)
 * - Day-by-day tiles with details
 * - Miles, time, accommodations, points of interest
 */

import { useState } from 'react';
import {
  MapPin,
  Clock,
  Milestone,
  Hotel,
  ChevronDown,
  ChevronUp,
  Star,
  Calendar,
  Tent,
  ExternalLink
} from 'lucide-react';
import { itineraryData, tripSummary, totalMiles, type DayItinerary } from '../data/itinerary';
import RouteMap from '../components/RouteMap';

export default function ItineraryPage() {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Trip Itinerary</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {tripSummary.totalDays} days of adventure from {tripSummary.startLocation} to {tripSummary.endLocation}
          </p>

          {/* Trip Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span>{tripSummary.startDate} - {tripSummary.endDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Milestone className="h-5 w-5 text-blue-400" />
              <span>{totalMiles.toLocaleString()} total miles</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Hotel className="h-5 w-5 text-blue-400" />
              <span>{tripSummary.totalDays - 1} nights</span>
            </div>
          </div>
        </div>

        {/* Interactive Route Map */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 mb-12 overflow-hidden">
          <RouteMap
            onDayClick={(day) => setExpandedDay(day)}
            selectedDay={expandedDay}
          />
        </div>

        {/* Day-by-Day Itinerary */}
        <div className="space-y-4">
          {itineraryData.map((day) => (
            <DayCard
              key={day.day}
              day={day}
              isExpanded={expandedDay === day.day}
              onToggle={() => toggleDay(day.day)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DayCardProps {
  day: DayItinerary;
  isExpanded: boolean;
  onToggle: () => void;
}

function DayCard({ day, isExpanded, onToggle }: DayCardProps) {
  const isRestDay = day.miles === 0;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Day number badge */}
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isRestDay ? 'bg-green-600/20' : 'bg-blue-600/20'
          }`}>
            <span className={`text-lg font-bold ${
              isRestDay ? 'text-green-400' : 'text-blue-400'
            }`}>
              {day.day}
            </span>
          </div>

          {/* Title and date */}
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">{day.title}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{day.date}</span>
              {!isRestDay && (
                <>
                  <span>•</span>
                  <span>{day.miles} miles</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expand/Collapse icon */}
        <div className="flex items-center gap-4">
          {isRestDay && (
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
              <Star className="h-4 w-4" />
              Rest Day
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
          <div className="pt-6 grid md:grid-cols-2 gap-6">
            {/* Left Column - Description */}
            <div>
              <p className="text-slate-300 mb-6">{day.description}</p>

              {/* Route Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-400">From</div>
                    <div className="text-white">{day.startPoint}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-400">To</div>
                    <div className="text-white">{day.endPoint}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Details */}
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Milestone className="h-4 w-4" />
                    Distance
                  </div>
                  <div className="text-xl font-semibold text-white">
                    {day.miles > 0 ? `${day.miles} mi` : 'Rest'}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Riding Time
                  </div>
                  <div className="text-xl font-semibold text-white">{day.ridingTime}</div>
                </div>
              </div>

              {/* Accommodation */}
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  {day.accommodationType === 'camping' ? (
                    <Tent className="h-4 w-4" />
                  ) : day.accommodationType === 'mixed' ? (
                    <div className="flex items-center gap-1">
                      <Hotel className="h-4 w-4" />
                      <span>/</span>
                      <Tent className="h-4 w-4" />
                    </div>
                  ) : (
                    <Hotel className="h-4 w-4" />
                  )}
                  Accommodation
                </div>
                <div className="text-white">{day.accommodation}</div>
                {day.accommodationLinks && day.accommodationLinks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                    {day.accommodationLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        {link.type === 'camping' ? (
                          <Tent className="h-4 w-4" />
                        ) : (
                          <Hotel className="h-4 w-4" />
                        )}
                        <span>{link.name}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Points of Interest */}
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Star className="h-4 w-4" />
                  Points of Interest
                </div>
                <ul className="space-y-2">
                  {day.pointsOfInterest.map((poi, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{poi}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
