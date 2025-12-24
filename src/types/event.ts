/**
 * event.ts
 *
 * Core types for the multi-event platform.
 * An Event represents a single motorcycle tour or day ride.
 */

import type { Coordinates } from './routeConfig';

/**
 * Event status lifecycle
 */
export type EventStatus = 'draft' | 'open' | 'closed' | 'completed';

/**
 * Accommodation link for a day
 */
export interface AccommodationLink {
  name: string;
  url: string;
  type: 'camping' | 'hotel';
}

/**
 * A single day in the event itinerary
 */
export interface EventDay {
  dayNumber: number;              // 1-indexed
  date: string;                   // "March 19, 2026"
  title: string;                  // "Arrival & Meet in Temecula"
  description: string;            // Full description

  // Does this day have an overnight stay after it?
  // false for last day of tour or single-day events
  hasOvernight: boolean;

  // Route information
  miles: number;                  // 0 for rest/arrival days
  ridingTime: string;             // "6 hours" or "Rest day" or "N/A"
  startPoint: string;             // "Temecula, CA"
  endPoint: string;               // "Rancho Meling, BC"

  // Map coordinates
  coordinates: {
    start: Coordinates;
    end: Coordinates;
  };
  waypoints?: Coordinates[];

  // Points of interest (text descriptions)
  pointsOfInterest: string[];

  // Accommodation info (display only - pricing is in nightConfigs)
  accommodationSummary: string;   // "Shared Room ($55-70 PP) or Camping ($15)"
  accommodationType: 'hotel' | 'camping' | 'mixed';
  accommodationLinks?: AccommodationLink[];
}

/**
 * Event fees configuration
 */
export interface EventFees {
  eventFee: number;               // Base event fee
  tshirt: number;                 // T-shirt cost
}

/**
 * Deposit configuration
 */
export interface DepositConfig {
  groupPlan: number;              // e.g., $500
  independent: number;            // e.g., $100
}

/**
 * Main Event entity
 */
export interface Event {
  // Identity
  id: string;                     // Firestore doc ID, URL-friendly: "baja-2026"
  name: string;                   // "BMW Baja Tour 2026"
  shortName: string;              // "BAJA 2026" (for header)
  description: string;            // Event description for home page

  // Dates (ISO format for storage, display format for UI)
  startDate: string;              // "2026-03-19"
  endDate: string;                // "2026-03-27"
  registrationDeadline: string;   // "2024-12-24"

  // Schedule
  days: EventDay[];               // Full itinerary
  isMultiDay: boolean;            // true for tours, false for day rides

  // Status
  status: EventStatus;

  // Pricing
  fees: EventFees;
  depositRequired: DepositConfig;

  // Timestamps
  createdAt?: string;             // ISO date
  updatedAt?: string;
}

/**
 * Computed trip summary (derived from Event)
 */
export interface TripSummary {
  startDate: string;
  endDate: string;
  totalDays: number;
  ridingDays: number;
  restDays: number;
  totalMiles: number;
  startLocation: string;
  endLocation: string;
}

/**
 * Compute trip summary from event
 */
export function computeTripSummary(event: Event): TripSummary {
  const totalMiles = event.days.reduce((sum, day) => sum + day.miles, 0);
  const ridingDays = event.days.filter(day => day.miles > 0).length;
  const restDays = event.days.filter(day => day.miles === 0).length;

  return {
    startDate: event.days[0]?.date || event.startDate,
    endDate: event.days[event.days.length - 1]?.date || event.endDate,
    totalDays: event.days.length,
    ridingDays,
    restDays,
    totalMiles,
    startLocation: event.days[0]?.startPoint || '',
    endLocation: event.days[event.days.length - 1]?.endPoint || '',
  };
}

/**
 * Convert DayItinerary from legacy itinerary.ts format to EventDay
 */
export function legacyDayToEventDay(
  legacyDay: {
    day: number;
    date: string;
    title: string;
    description: string;
    miles: number;
    ridingTime: string;
    startPoint: string;
    endPoint: string;
    accommodation: string;
    accommodationType: 'hotel' | 'camping' | 'mixed';
    accommodationLinks?: AccommodationLink[];
    pointsOfInterest: string[];
    coordinates: { start: [number, number]; end: [number, number] };
    waypoints?: [number, number][];
  },
  isLastDay: boolean
): EventDay {
  return {
    dayNumber: legacyDay.day,
    date: legacyDay.date,
    title: legacyDay.title,
    description: legacyDay.description,
    hasOvernight: !isLastDay,
    miles: legacyDay.miles,
    ridingTime: legacyDay.ridingTime,
    startPoint: legacyDay.startPoint,
    endPoint: legacyDay.endPoint,
    coordinates: {
      start: { lat: legacyDay.coordinates.start[0], lng: legacyDay.coordinates.start[1] },
      end: { lat: legacyDay.coordinates.end[0], lng: legacyDay.coordinates.end[1] },
    },
    waypoints: legacyDay.waypoints?.map(wp => ({ lat: wp[0], lng: wp[1] })),
    pointsOfInterest: legacyDay.pointsOfInterest,
    accommodationSummary: legacyDay.accommodation,
    accommodationType: legacyDay.accommodationType,
    accommodationLinks: legacyDay.accommodationLinks,
  };
}
