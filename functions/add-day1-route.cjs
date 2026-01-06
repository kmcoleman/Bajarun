/**
 * Add Day 1 (Arrival Day) to routes collection
 * Run: node add-day1-route.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Day 1 data from static itinerary.ts
const day1Route = {
  day: 1,
  date: "March 19, 2026",
  title: "Arrival & Meet in Temecula",
  description: "Riders make their way to Temecula, California on their own to meet up for orientation, bike checks, and welcome dinner. We'll review the route, safety protocols, and get to know fellow riders before heading south together.",
  startName: "Temecula, CA",
  startCoordinates: {
    lat: 33.4936,
    lng: -117.1484
  },
  endName: "Temecula, CA",
  endCoordinates: {
    lat: 33.4936,
    lng: -117.1484
  },
  waypoints: [],
  pois: [
    {
      id: "poi-day1-1",
      name: "Welcome dinner and orientation",
      coordinates: { lat: 33.4936, lng: -117.1484 },
      category: "poi",
      description: "Meet fellow riders and review trip details"
    },
    {
      id: "poi-day1-2",
      name: "Bike inspection and preparation",
      coordinates: { lat: 33.4936, lng: -117.1484 },
      category: "poi",
      description: "Final checks before the adventure begins"
    },
    {
      id: "poi-day1-3",
      name: "Route briefing and safety review",
      coordinates: { lat: 33.4936, lng: -117.1484 },
      category: "poi",
      description: "Overview of the journey ahead"
    },
    {
      id: "poi-day1-4",
      name: "Document check",
      coordinates: { lat: 33.4936, lng: -117.1484 },
      category: "poi",
      description: "Passport, insurance, registration verification"
    }
  ],
  estimatedDistance: 0,
  estimatedTime: "N/A",
  accommodation: "Best Western Plus Temecula",
  accommodationType: "hotel",
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function addDay1() {
  console.log('Adding Day 1 to routes collection...\n');

  const routeRef = db.collection('events').doc('bajarun2026').collection('routes').doc('day1');

  // Check if it already exists
  const existing = await routeRef.get();
  if (existing.exists) {
    console.log('Day 1 already exists! Current data:');
    console.log(JSON.stringify(existing.data(), null, 2));
    console.log('\nOverwriting with new data...');
  }

  await routeRef.set(day1Route);

  console.log('✓ Day 1 added successfully!\n');
  console.log('Details:');
  console.log(`  Title: ${day1Route.title}`);
  console.log(`  Date: ${day1Route.date}`);
  console.log(`  Location: ${day1Route.startName}`);
  console.log(`  POIs: ${day1Route.pois.length}`);
  console.log(`  Distance: ${day1Route.estimatedDistance} miles (arrival day)`);

  // Verify all days now exist
  console.log('\nVerifying all routes...');
  const snapshot = await db.collection('events').doc('bajarun2026').collection('routes').get();
  console.log(`Total routes in collection: ${snapshot.size}`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  ${doc.id}: ${data.title}`);
  });

  process.exit(0);
}

addDay1().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
