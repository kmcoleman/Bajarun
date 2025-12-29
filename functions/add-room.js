/**
 * add-room.js
 *
 * Quick script to add a single room to Firestore.
 * Usage: node add-room.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Room to add - Best Western double room #29
const room = {
  id: 'best-western-29-r1',
  suiteName: 'Best Western 29',
  roomNumber: 'R1',
  beds: ['Bed 1', 'Bed 2'],
  maxOccupancy: 2,
  checkIn: '2026-03-19',
  checkOut: '2026-03-20',
  location: 'Temecula',
  day: 1
};

async function addRoom() {
  console.log(`Adding room: ${room.suiteName}...`);

  const docRef = db.collection('events').doc('bajarun2026').collection('roomInventory').doc(room.id);
  await docRef.set({
    ...room,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Done!');
}

addRoom()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
