/**
 * Script to add "On Their Own" room inventory entries for all days
 * Run with: node scripts/add-own-accommodation.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
initializeApp({
  projectId: 'bajarun-2026'
});

const db = getFirestore();

const ownAccommodationEntries = [
  {
    id: "own-day1",
    suiteName: "On Their Own",
    roomNumber: "NA",
    beds: [],
    maxOccupancy: 50,
    checkIn: "2026-03-19",
    checkOut: "2026-03-20",
    location: "Temecula",
    day: 1,
    isOwnAccommodation: true
  },
  {
    id: "own-day2",
    suiteName: "On Their Own",
    roomNumber: "NA",
    beds: [],
    maxOccupancy: 50,
    checkIn: "2026-03-20",
    checkOut: "2026-03-21",
    location: "Meiling",
    day: 2,
    isOwnAccommodation: true
  },
  {
    id: "own-day6",
    suiteName: "On Their Own",
    roomNumber: "NA",
    beds: [],
    maxOccupancy: 50,
    checkIn: "2026-03-24",
    checkOut: "2026-03-25",
    location: "BOLA",
    day: 6,
    isOwnAccommodation: true
  },
  {
    id: "own-day7",
    suiteName: "On Their Own",
    roomNumber: "NA",
    beds: [],
    maxOccupancy: 50,
    checkIn: "2026-03-25",
    checkOut: "2026-03-26",
    location: "Tecate",
    day: 7,
    isOwnAccommodation: true
  },
  {
    id: "own-day8",
    suiteName: "On Their Own",
    roomNumber: "NA",
    beds: [],
    maxOccupancy: 50,
    checkIn: "2026-03-26",
    checkOut: "2026-03-27",
    location: "TwentyNine Palms",
    day: 8,
    isOwnAccommodation: true
  }
];

async function addOwnAccommodation() {
  console.log('Adding "On Their Own" entries to room inventory...\n');

  for (const entry of ownAccommodationEntries) {
    try {
      await db.collection('events').doc('bajarun2026').collection('roomInventory').doc(entry.id).set(entry);
      console.log(`✓ Added: Day ${entry.day} - ${entry.location}`);
    } catch (error) {
      console.error(`✗ Failed Day ${entry.day}:`, error.message);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

addOwnAccommodation();
