/**
 * rooms.ts
 *
 * Types for room inventory and room assignments.
 * Used by admin to assign riders to specific rooms/beds.
 */

/**
 * Room inventory item - represents a room or camping spot
 */
export interface RoomInventory {
  id: string;                    // e.g., "best-western-1-r1", "casa-andres-r1"
  suiteName: string;             // e.g., "Best Western 1", "Casa Andres"
  roomNumber: string;            // e.g., "R1", "R2", "NA" for camping
  beds: string[];                // e.g., ["Bed 1"] or ["Bed 1", "Bed 2", "Bed 3"]
  maxOccupancy: number;          // 2 or 3 for rooms, 20 for camping
  checkIn: string;               // "2026-03-19"
  checkOut: string;              // "2026-03-20"
  location: string;              // "Temecula", "Meiling", "BOLA", "Tecate", "TwentyNine Palms"
  day: number;                   // 1, 2, 6, 7, or 8
  isCamping?: boolean;           // true for camping spots
  isOwnAccommodation?: boolean;  // true for "on their own" group
}

/**
 * Individual bed assignment
 */
export interface BedAssignment {
  oderId: string;                // User's UID
  riderName: string;             // Display name for quick reference
  assignedAt: Date;              // When assignment was made
  assignedBy: string;            // Admin UID who made the assignment
}

/**
 * Room assignments document structure (one doc per day)
 * Stored at: events/bajarun2026/roomAssignments/day{N}
 */
export interface RoomAssignmentsDoc {
  // Key format: "{roomId}__{bedId}" e.g., "best-western-1-r1__bed-1"
  [roomBedKey: string]: BedAssignment;
}

/**
 * Rider info for assignment UI
 */
export interface RiderForAssignment {
  oderId: string;                        // User's UID (from registration doc ID)
  fullName: string;                      // From registration
  nickname?: string;                     // From registration
  preferredRoommate?: string;            // UID of preferred roommate (from users collection)
  preferredRoommateName?: string;        // Resolved name for display
  accommodationPreference?: 'hotel' | 'camping' | 'own';
}

/**
 * Days that have room assignments
 */
export const ROOM_ASSIGNMENT_DAYS = [1, 2, 6, 7, 8] as const;
export type RoomAssignmentDay = typeof ROOM_ASSIGNMENT_DAYS[number];

/**
 * Day info for UI display
 */
export const DAY_INFO: Record<RoomAssignmentDay, { location: string; hotel: string; date: string }> = {
  1: { location: 'Temecula', hotel: 'Best Western', date: 'Mar 19' },
  2: { location: 'Meiling', hotel: 'Rancho Meling', date: 'Mar 20' },
  6: { location: 'BOLA', hotel: 'Camp Archelon', date: 'Mar 24' },
  7: { location: 'Tecate', hotel: 'Santuario Diegueño', date: 'Mar 25' },
  8: { location: 'TwentyNine Palms', hotel: 'Oasis', date: 'Mar 26' },
};

/**
 * Helper to create room-bed key for assignments
 */
export function createRoomBedKey(roomId: string, bedName: string): string {
  const bedId = bedName.toLowerCase().replace(/\s+/g, '-');
  return `${roomId}__${bedId}`;
}

/**
 * Helper to parse room-bed key
 */
export function parseRoomBedKey(key: string): { roomId: string; bedId: string } {
  const [roomId, bedId] = key.split('__');
  return { roomId, bedId };
}
