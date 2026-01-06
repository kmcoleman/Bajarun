/**
 * eventConfig.ts
 *
 * Type definitions for event pricing configuration,
 * user selections, charges, and payments.
 */

import type { RouteConfig } from './routeConfig';

// ============================================
// NIGHTLY CONFIGURATION (Admin sets these)
// ============================================

export interface NightConfig {
  // Basic info
  date: string;  // "2026-03-19"
  nightSummary: string;  // General overview/notes for this night

  // Day info (for mobile app display)
  highlights: string[];  // Text-based ride features (not map POIs)

  // Hotel configuration
  hotelAvailable: boolean;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelWebsite: string;
  hotelMapsLink: string;
  hotelDescription: string;
  hotelCost: number;  // per person (assumes double occupancy)
  hotelCapacity: number;  // max number of people (0 = unlimited)
  hotelOptions: string;  // any options to ask about

  // Camping configuration
  campingAvailable: boolean;
  campingName: string;
  campingMapsLink: string;
  campingDescription: string;
  campingCost: number;  // per person

  // Dinner configuration
  dinnerAvailable: boolean;
  dinnerName: string;
  dinnerDescription: string;
  dinnerCost: number;  // per person

  // Breakfast configuration
  breakfastAvailable: boolean;
  breakfastName: string;
  breakfastDescription: string;
  breakfastCost: number;  // per person

  // Single room option
  singleRoomAvailable: boolean;
  singleRoomDescription: string;  // e.g., "Approximately twice the per person rate"

  // Floor sleeping option (budget alternative)
  floorSleepingAvailable: boolean;
  floorSleepingDescription: string;  // e.g., "50% of per person rate - bring your own mattress"

  // Optional activities (can have multiple per night)
  optionalActivities: OptionalActivity[];

  // Route configuration (admin-configurable)
  routeConfig?: RouteConfig;
}

export interface OptionalActivity {
  id: string;
  title: string;
  cost: number;
  description: string;
}

export interface EventPricing {
  nights: {
    [nightKey: string]: NightConfig;  // "night-1", "night-2", etc.
  };
  fees: {
    tshirt: number;
    eventFee: number;
  };
}

// Default empty night config
export const emptyNightConfig: NightConfig = {
  date: '',
  nightSummary: '',
  highlights: [],
  hotelAvailable: false,
  hotelName: '',
  hotelAddress: '',
  hotelPhone: '',
  hotelWebsite: '',
  hotelMapsLink: '',
  hotelDescription: '',
  hotelCost: 0,
  hotelCapacity: 0,
  hotelOptions: '',
  campingAvailable: false,
  campingName: '',
  campingMapsLink: '',
  campingDescription: '',
  campingCost: 0,
  dinnerAvailable: false,
  dinnerName: '',
  dinnerDescription: '',
  dinnerCost: 0,
  breakfastAvailable: false,
  breakfastName: '',
  breakfastDescription: '',
  breakfastCost: 0,
  singleRoomAvailable: false,
  singleRoomDescription: '',
  floorSleepingAvailable: false,
  floorSleepingDescription: '',
  optionalActivities: [],
};

// ============================================
// USER SELECTIONS (User chooses these)
// ============================================

export type AccommodationType = 'hotel' | 'camping' | 'own';

export interface NightSelection {
  accommodation: AccommodationType | null;
  dinner: boolean;
  breakfast: boolean;
  prefersSingleRoom: boolean;         // User prefers single room if available
  prefersFloorSleeping: boolean;      // User prefers floor sleeping (budget option)
  optionalActivitiesInterested: string[]; // Array of activity IDs user is interested in
  roommatePreference: string | null;  // userId
  assignedRoommate: string | null;    // userId, set by admin
  assignedRoom: string | null;        // "Room 101", set by admin
}

export interface UserSelections {
  [nightKey: string]: NightSelection;  // "night-1", "night-2", etc.
}

// Default empty night selection
export const emptyNightSelection: NightSelection = {
  accommodation: null,
  dinner: false,
  breakfast: false,
  prefersSingleRoom: false,
  prefersFloorSleeping: false,
  optionalActivitiesInterested: [],
  roommatePreference: null,
  assignedRoommate: null,
  assignedRoom: null,
};

// ============================================
// CHARGES LEDGER
// ============================================

export type ChargeType = 'accommodation' | 'meal' | 'fee' | 'adjustment';

export interface Charge {
  id: string;
  type: ChargeType;
  description: string;
  amount: number;  // negative for reversals/credits
  date: Date;
  postedBy: string;  // admin userId
  nightKey?: string;  // "night-1", etc. (for accommodation/meal charges)
  isEstimate?: boolean;  // true for auto-generated estimates
  reversesChargeId?: string;  // links reversal to original charge
}

// ============================================
// PAYMENTS
// ============================================

export type PaymentMethod = 'venmo' | 'zelle' | 'cash';

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  method: PaymentMethod;
  recordedBy: string;  // admin userId
  note?: string;  // "Initial deposit", "Final payment", etc.
}

// ============================================
// STATEMENT (Calculated)
// ============================================

export interface Statement {
  charges: Charge[];
  payments: Payment[];
  totalCharges: number;
  totalPayments: number;
  balance: number;  // positive = owes money, negative = credit
}

// ============================================
// TRIP NIGHTS DEFINITION
// ============================================

export const TRIP_NIGHTS = [
  { key: 'night-1', date: '2026-03-19', label: 'Night 1 - March 19', location: 'TBD' },
  { key: 'night-2', date: '2026-03-20', label: 'Night 2 - March 20', location: 'TBD' },
  { key: 'night-3', date: '2026-03-21', label: 'Night 3 - March 21', location: 'TBD' },
  { key: 'night-4', date: '2026-03-22', label: 'Night 4 - March 22', location: 'TBD' },
  { key: 'night-5', date: '2026-03-23', label: 'Night 5 - March 23', location: 'TBD' },
  { key: 'night-6', date: '2026-03-24', label: 'Night 6 - March 24', location: 'TBD' },
  { key: 'night-7', date: '2026-03-25', label: 'Night 7 - March 25', location: 'TBD' },
  { key: 'night-8', date: '2026-03-26', label: 'Night 8 - March 26', location: 'TBD' },
  { key: 'night-9', date: '2026-03-27', label: 'Night 9 - March 27', location: 'TBD' },
];
