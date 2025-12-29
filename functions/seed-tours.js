const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const tours = [
  {
    id: 'bajarun2026',
    name: 'Baja Run 2026',
    description: 'Epic 9-day motorcycle adventure through Baja California. Experience breathtaking desert landscapes, pristine beaches, and authentic Mexican culture.',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/tours%2Fbaja-2026.jpg?alt=media',
    startDate: admin.firestore.Timestamp.fromDate(new Date('2026-03-19')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2026-03-27')),
    status: 'open',
    registrationOpen: true,
    maxParticipants: 20,
    currentParticipants: 0,
    depositAmount: 500,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

(async () => {
  for (const tour of tours) {
    const { id, ...tourData } = tour;
    await db.collection('tours').doc(id).set(tourData);
    console.log('Added:', tour.name);
  }
  console.log('Done! Seeded', tours.length, 'tours');
  process.exit(0);
})();
