/**
 * seed-rooms.js
 *
 * Seeds room inventory data to Firestore for the Baja Run 2026 event.
 * Rooms are stored under: events/bajarun2026/roomInventory/{roomId}
 *
 * Usage: node seed-rooms.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper to create room ID from suite name
const toRoomId = (suiteName, roomNumber = 'R1') => {
  return `${suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${roomNumber.toLowerCase()}`;
};

// All room inventory data
const rooms = [
  // ========== DAY 1 - TEMECULA (Best Western) ==========
  // Single bed rooms (1-7)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `best-western-${i + 1}-r1`,
    suiteName: `Best Western ${i + 1}`,
    roomNumber: 'R1',
    beds: ['Bed 1'],
    maxOccupancy: 2,
    checkIn: '2026-03-19',
    checkOut: '2026-03-20',
    location: 'Temecula',
    day: 1
  })),
  // Double bed rooms (20-28)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `best-western-${i + 20}-r1`,
    suiteName: `Best Western ${i + 20}`,
    roomNumber: 'R1',
    beds: ['Bed 1', 'Bed 2'],
    maxOccupancy: 2,
    checkIn: '2026-03-19',
    checkOut: '2026-03-20',
    location: 'Temecula',
    day: 1
  })),

  // ========== DAY 2 - MEILING (Rancho Meling) ==========
  // Casa Andres R1-R4 (2 beds each)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `casa-andres-r${i + 1}`,
    suiteName: 'Casa Andres',
    roomNumber: `R${i + 1}`,
    beds: ['Bed 1', 'Bed 2'],
    maxOccupancy: 2,
    checkIn: '2026-03-20',
    checkOut: '2026-03-21',
    location: 'Meiling',
    day: 2
  })),
  // Room #7 R1, R2 (1 bed each)
  { id: 'room-7-r1', suiteName: 'Room #7', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  { id: 'room-7-r2', suiteName: 'Room #7', roomNumber: 'R2', beds: ['Bed 2'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #9 R1, R2 (1 bed each)
  { id: 'room-9-r1', suiteName: 'Room #9', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  { id: 'room-9-r2', suiteName: 'Room #9', roomNumber: 'R2', beds: ['Bed 2'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #6 (2 beds)
  { id: 'room-6-r1', suiteName: 'Room #6', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #11 (2 beds)
  { id: 'room-11-r1', suiteName: 'Room #11', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #2 (2 beds)
  { id: 'room-2-r1', suiteName: 'Room #2', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #4 (2 beds)
  { id: 'room-4-r1', suiteName: 'Room #4', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #1 (1 bed)
  { id: 'room-1-r1', suiteName: 'Room #1', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #3 (1 bed)
  { id: 'room-3-r1', suiteName: 'Room #3', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Room #5 (1 bed)
  { id: 'room-5-r1', suiteName: 'Room #5', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2 },
  // Camping
  { id: 'meiling-camping', suiteName: 'Camping', roomNumber: 'NA', beds: ['Tent'], maxOccupancy: 20, checkIn: '2026-03-20', checkOut: '2026-03-21', location: 'Meiling', day: 2, isCamping: true },

  // ========== DAY 6 - BOLA (Bahia de los Angeles / Camp Archelon) ==========
  // Casa Lora R1, R2 (1 bed each)
  { id: 'casa-lora-r1', suiteName: 'Casa Lora', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  { id: 'casa-lora-r2', suiteName: 'Casa Lora', roomNumber: 'R2', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Estrella R1, R2 (1 bed each)
  { id: 'estrella-r1', suiteName: 'Estrella', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  { id: 'estrella-r2', suiteName: 'Estrella', roomNumber: 'R2', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Carey R1 (2 beds)
  { id: 'carey-r1', suiteName: 'Carey', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Casa de Arena R1 (3 beds)
  { id: 'casa-de-arena-r1', suiteName: 'Casa de Arena', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2', 'Bed 3'], maxOccupancy: 3, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Casa de Piedra R1 (1 bed)
  { id: 'casa-de-piedra-r1', suiteName: 'Casa de Piedra', roomNumber: 'R1', beds: ['Bed 1'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Luna R1 (2 beds)
  { id: 'luna-r1', suiteName: 'Luna', roomNumber: 'R1', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Cabana Sol R2 (2 beds)
  { id: 'cabana-sol-r2', suiteName: 'Cabana Sol', roomNumber: 'R2', beds: ['Bed 1', 'Bed 2'], maxOccupancy: 2, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6 },
  // Camping
  { id: 'bola-camping', suiteName: 'Camping', roomNumber: 'NA', beds: ['Tent'], maxOccupancy: 20, checkIn: '2026-03-24', checkOut: '2026-03-25', location: 'BOLA', day: 6, isCamping: true },

  // ========== DAY 7 - TECATE (Santuario Diegueño) ==========
  // Single bed rooms (1-7)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `santuario-diegueno-${i + 1}-r1`,
    suiteName: `Santuario Diegueño ${i + 1}`,
    roomNumber: 'R1',
    beds: ['Bed 1'],
    maxOccupancy: 2,
    checkIn: '2026-03-25',
    checkOut: '2026-03-26',
    location: 'Tecate',
    day: 7
  })),
  // Double bed rooms (20-28)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `santuario-diegueno-${i + 20}-r1`,
    suiteName: `Santuario Diegueño ${i + 20}`,
    roomNumber: 'R1',
    beds: ['Bed 1', 'Bed 2'],
    maxOccupancy: 2,
    checkIn: '2026-03-25',
    checkOut: '2026-03-26',
    location: 'Tecate',
    day: 7
  })),

  // ========== DAY 8 - TWENTYNINE PALMS (Oasis) ==========
  // Single bed rooms (1-7)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `oasis-${i + 1}-r1`,
    suiteName: `Oasis ${i + 1}`,
    roomNumber: 'R1',
    beds: ['Bed 1'],
    maxOccupancy: 2,
    checkIn: '2026-03-26',
    checkOut: '2026-03-27',
    location: 'TwentyNine Palms',
    day: 8
  })),
  // Double bed rooms (20-28)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `oasis-${i + 20}-r1`,
    suiteName: `Oasis ${i + 20}`,
    roomNumber: 'R1',
    beds: ['Bed 1', 'Bed 2'],
    maxOccupancy: 2,
    checkIn: '2026-03-26',
    checkOut: '2026-03-27',
    location: 'TwentyNine Palms',
    day: 8
  })),
];

async function seedRooms() {
  console.log('Seeding room inventory to Firestore...\n');

  const batch = db.batch();
  const stats = { day1: 0, day2: 0, day6: 0, day7: 0, day8: 0 };

  for (const room of rooms) {
    const docRef = db.collection('events').doc('bajarun2026').collection('roomInventory').doc(room.id);
    batch.set(docRef, {
      ...room,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (room.day === 1) stats.day1++;
    else if (room.day === 2) stats.day2++;
    else if (room.day === 6) stats.day6++;
    else if (room.day === 7) stats.day7++;
    else if (room.day === 8) stats.day8++;
  }

  await batch.commit();

  console.log('Room inventory seeded successfully!\n');
  console.log('Summary:');
  console.log(`  Day 1 (Temecula):      ${stats.day1} rooms`);
  console.log(`  Day 2 (Meiling):       ${stats.day2} rooms`);
  console.log(`  Day 6 (BOLA):          ${stats.day6} rooms`);
  console.log(`  Day 7 (Tecate):        ${stats.day7} rooms`);
  console.log(`  Day 8 (Twentynine):    ${stats.day8} rooms`);
  console.log(`  Total:                 ${rooms.length} rooms`);
}

seedRooms()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
