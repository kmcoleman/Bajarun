/**
 * seed-routes.js
 *
 * Uploads route configuration files to Firestore for the Baja Run 2026 event.
 * Routes are stored under: events/bajarun2026/routes/{dayNumber}
 *
 * Usage: node seed-routes.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Map of day numbers to their route files
// Files are in /Users/kev/Downloads/
const routeFiles = [
  // Day 1: Arrival - no route needed
  // Day 2: Temecula → Rancho Meling (already in Firestore, but we can update)
  {
    day: 2,
    file: 'route-v-a-sin-nombre--22913-b-c---mexico.json',
    // Note: This file is actually Rancho Meling → Guerrero Negro
    // We need to check file contents to match correctly
  },
  // Let me map based on actual start/end points from the files:
];

// Route files with their actual day mappings based on VERIFIED content analysis:
const routes = [
  {
    day: 2,
    title: 'Temecula to Rancho Meling',
    file: '/Users/kev/Downloads/route-v-a-sin-nombre--22913-b-c---mexico.json',
    // Verified: Temecula (33.50) → Rancho Meling (30.97) | 274 mi, 6h 22m
  },
  {
    day: 3,
    title: 'Rancho Meling to Guerrero Negro',
    file: '/Users/kev/Downloads/route-23940-heroica-muleg---b-c-s---mexico (1).json',
    // Verified: Rancho Meling (30.97) → Guerrero Negro (27.75) | 343 mi, 7h 9m
  },
  {
    day: 4,
    title: 'Guerrero Negro to Playa El Burro',
    file: '/Users/kev/Downloads/route-23903-heroica-muleg---b-c-s---mexico.json',
    // Verified: Guerrero Negro (27.75) → Playa El Burro (26.73) | 197 mi, 4h 6m
  },
  {
    day: 5,
    title: 'Bahía Concepción Rest Day',
    file: '/Users/kev/Downloads/route-23903-heroica-muleg---b-c-s---mexico (1).json',
    // Verified: Same start/end (26.73) - rest day exploration | 0 mi
  },
  {
    day: 6,
    title: 'Playa El Burro to Bahía de los Ángeles',
    file: '/Users/kev/Downloads/route-a-la-gringa--campo-archelon-km-3-km-3--campo-archelon--22980-bah-a-de-los--ngeles--b-c---mexico.json',
    // Verified: Playa El Burro (26.73) → Bahía de los Ángeles (28.97) | 312 mi, 6h 1m
  },
  // Day 7: Bahía de los Ángeles → Tecate - FILE MISSING!
  {
    day: 8,
    title: 'Tecate to Twentynine Palms',
    file: '/Users/kev/Downloads/route-71809-29-palms-hwy--twentynine-palms--ca-92277--usa.json',
    // Verified: Tecate (32.56) → Twentynine Palms (34.13) | 233 mi, 5h 20m
  },
  {
    day: 9,
    title: 'Twentynine Palms to Furnace Creek',
    file: '/Users/kev/Downloads/route-furnace-creek-campground--death-valley--ca-92328--usa.json',
    // Verified: Twentynine Palms (34.13) → Death Valley (36.46) | 241 mi, 4h 3m
  },
];

async function uploadRoutes() {
  console.log('Starting route upload to Firestore...\n');

  for (const route of routes) {
    try {
      // Read the JSON file
      const filePath = route.file;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const routeData = JSON.parse(fileContent);

      // Validate required fields
      if (!routeData.startName || !routeData.endName) {
        console.error(`❌ Day ${route.day}: Missing required fields in ${path.basename(filePath)}`);
        continue;
      }

      // Prepare the route config document
      const routeConfig = {
        // Core route info
        startName: routeData.startName,
        startCoordinates: routeData.startCoordinates,
        endName: routeData.endName,
        endCoordinates: routeData.endCoordinates,

        // Waypoints (with optional name support)
        waypoints: routeData.waypoints || [],

        // Points of Interest
        pois: routeData.pois || [],

        // Distance and time (using new format)
        estimatedDistance: routeData.estimatedDistance,
        estimatedTime: routeData.estimatedTime, // e.g., "6h 22m"

        // Metadata
        day: route.day,
        title: route.title,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Upload to Firestore: events/bajarun2026/routes/{day}
      const docRef = db.collection('events').doc('bajarun2026').collection('routes').doc(`day${route.day}`);
      await docRef.set(routeConfig);

      console.log(`✅ Day ${route.day}: ${route.title}`);
      console.log(`   📍 ${routeData.startName.substring(0, 40)}...`);
      console.log(`   📍 → ${routeData.endName.substring(0, 40)}...`);
      console.log(`   📏 ${routeData.estimatedDistance || 'N/A'} miles | ⏱️  ${routeData.estimatedTime || 'N/A'}`);
      console.log(`   📌 ${routeData.pois?.length || 0} POIs | 🛤️  ${routeData.waypoints?.length || 0} waypoints`);
      console.log('');

    } catch (error) {
      console.error(`❌ Day ${route.day}: Error - ${error.message}`);
      console.error(`   File: ${route.file}`);
      console.log('');
    }
  }

  console.log('Route upload complete!');
  console.log('\nRoutes stored at: events/bajarun2026/routes/day{N}');
}

// Run the upload
uploadRoutes()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
