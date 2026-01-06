/**
 * seed-routes.js
 *
 * Uploads route configuration files to Firestore for the Baja Run 2026 event.
 * Routes are stored under: events/bajarun2026/routes/day{N}
 *
 * This is the SINGLE SOURCE OF TRUTH for all route data used by both web and mobile apps.
 *
 * Usage:
 *   node seed-routes.js                    # Upload all routes
 *   node seed-routes.js <day> <json-file>  # Upload single route
 *
 * Example:
 *   node seed-routes.js 9 /Users/kev/Downloads/route-furnace-creek.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Day metadata - title, date, description, accommodation for each day
// Route data (coordinates, geometry, POIs) comes from route planner JSON files
const DAY_METADATA = {
  1: {
    date: 'March 19, 2026',
    title: 'Arrival & Meet in Temecula',
    description: 'Riders make their way to Temecula, California on their own to meet up for orientation, bike checks, and welcome dinner.',
    accommodation: 'Best Western Plus Temecula',
    accommodationType: 'hotel',
  },
  2: {
    date: 'March 20, 2026',
    title: 'Temecula to Rancho Meling',
    description: 'This journey begins in the rolling vineyards of Temecula, climbing through the scenic mountain twisties of San Diego County before crossing the border at the relaxed, high-altitude Tecate gate.',
    accommodation: 'Shared Room ($55-70 PP) or Camping ($15)',
    accommodationType: 'mixed',
  },
  3: {
    date: 'March 21, 2026',
    title: 'Rancho Meling to Laguna Ojo de Liebre',
    description: 'Big riding day south through the Vizcaíno Desert to Guerrero Negro area. Camp at the famous Laguna Ojo de Liebre whale sanctuary.',
    accommodation: 'Rustic Camping at Whale Preserve ($15)',
    accommodationType: 'camping',
  },
  4: {
    date: 'March 22, 2026',
    title: 'Laguna Ojo de Liebre to Playa El Burro',
    description: 'Traverse the vast Vizcaíno Desert before ascending the volcanic switchbacks of the Cuesta del Infierno to the turquoise waters of Bahía Concepción.',
    accommodation: 'Beach Camping at Playa El Burro',
    accommodationType: 'camping',
  },
  5: {
    date: 'March 23, 2026',
    title: 'Bahía Concepción - Rest Day',
    description: 'Rest day to explore the stunning beaches and coves of Bahía Concepción. Visit Mulegé, Loreto, or Mission San Javier.',
    accommodation: 'Beach Camping at Playa El Burro',
    accommodationType: 'camping',
  },
  6: {
    date: 'March 24, 2026',
    title: 'Playa El Burro to Bahía de los Ángeles',
    description: 'Head north along the Sea of Cortez to the remote fishing village of Bahía de los Ángeles through dramatic desert landscapes.',
    accommodation: 'Camp Archelon or Los Vientos Hotel',
    accommodationType: 'mixed',
  },
  7: {
    date: 'March 25, 2026',
    title: 'Bahía de los Ángeles to Tecate',
    description: 'Follow the dramatic coastline of the Sea of Cortez through Gonzaga Bay and San Felipe before climbing into the Sierra de Juárez.',
    accommodation: 'Santuario Diegueño',
    accommodationType: 'hotel',
  },
  8: {
    date: 'March 26, 2026',
    title: 'Tecate to Twentynine Palms',
    description: 'Cross the border into California, climb through Julian and Anza-Borrego Desert before entering Joshua Tree National Park.',
    accommodation: 'Fairfield Inn & Suites Twentynine Palms',
    accommodationType: 'hotel',
  },
  9: {
    date: 'March 27, 2026',
    title: 'Twentynine Palms to Furnace Creek',
    description: 'Journey through Mojave National Preserve, past Kelso Depot and volcanic cinder cones, descending into Death Valley.',
    accommodation: 'Camping at Furnace Creek',
    accommodationType: 'camping',
  },
};

// Route files for batch upload (optional, for re-seeding all routes)
const ROUTE_FILES = {
  2: '/Users/kev/Downloads/route-v-a-sin-nombre--22913-b-c---mexico.json',
  3: '/Users/kev/Downloads/route-23940-heroica-muleg---b-c-s---mexico (1).json',
  4: '/Users/kev/Downloads/route-23903-heroica-muleg---b-c-s---mexico.json',
  5: '/Users/kev/Downloads/route-23903-heroica-muleg---b-c-s---mexico (1).json',
  6: '/Users/kev/Downloads/route-a-la-gringa--campo-archelon-km-3-km-3--campo-archelon--22980-bah-a-de-los--ngeles--b-c---mexico.json',
  // 7: FILE MISSING
  8: '/Users/kev/Downloads/route-71809-29-palms-hwy--twentynine-palms--ca-92277--usa.json',
  9: '/Users/kev/Downloads/route-furnace-creek-campground--death-valley--ca-92328--usa.json',
};

/**
 * Upload a single route to Firestore
 */
async function uploadSingleRoute(dayNumber, jsonFilePath) {
  const day = parseInt(dayNumber, 10);
  const metadata = DAY_METADATA[day];

  if (!metadata) {
    console.error(`❌ Unknown day: ${day}. Valid days are 1-9.`);
    return false;
  }

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ File not found: ${jsonFilePath}`);
    return false;
  }

  const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
  const routeData = JSON.parse(fileContent);

  // Build the complete route config (merge route data with day metadata)
  const routeConfig = {
    // Day metadata
    day: day,
    date: metadata.date,
    title: metadata.title,
    description: metadata.description,
    accommodation: metadata.accommodation,
    accommodationType: metadata.accommodationType,

    // Route data from JSON file
    startName: routeData.startName,
    startCoordinates: routeData.startCoordinates,
    endName: routeData.endName,
    endCoordinates: routeData.endCoordinates,
    waypoints: routeData.waypoints || [],
    pois: routeData.pois || [],
    estimatedDistance: routeData.estimatedDistance,
    estimatedTime: routeData.estimatedTime,

    // Pre-calculated route geometry (NEW - for instant map rendering)
    routeGeometry: routeData.routeGeometry || null,

    // Metadata
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Upload to Firestore
  const docRef = db.collection('events').doc('bajarun2026').collection('routes').doc(`day${day}`);
  await docRef.set(routeConfig);

  console.log(`\n✅ Day ${day}: ${metadata.title}`);
  console.log(`   📅 ${metadata.date}`);
  console.log(`   📍 ${routeData.startName} → ${routeData.endName}`);
  console.log(`   📏 ${routeData.estimatedDistance || 'N/A'} miles | ⏱️  ${routeData.estimatedTime || 'N/A'}`);
  console.log(`   📌 ${routeData.pois?.length || 0} POIs | 🛤️  ${routeData.waypoints?.length || 0} waypoints`);
  console.log(`   🗺️  Route geometry: ${routeData.routeGeometry ? `${routeData.routeGeometry.coordinates.length} points` : 'Not included'}`);

  return true;
}

/**
 * Upload all routes from ROUTE_FILES
 */
async function uploadAllRoutes() {
  console.log('Starting batch route upload to Firestore...\n');
  console.log('📍 Target: events/bajarun2026/routes/day{N}\n');

  let successCount = 0;
  let failCount = 0;

  for (const [day, filePath] of Object.entries(ROUTE_FILES)) {
    try {
      const success = await uploadSingleRoute(day, filePath);
      if (success) successCount++;
      else failCount++;
    } catch (error) {
      console.error(`❌ Day ${day}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Uploaded: ${successCount} routes`);
  if (failCount > 0) console.log(`❌ Failed: ${failCount} routes`);
  console.log(`\nRoutes stored at: events/bajarun2026/routes/day{N}`);
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 2) {
    // Single route upload: node seed-routes.js <day> <json-file>
    const [day, jsonFile] = args;
    await uploadSingleRoute(day, jsonFile);
  } else if (args.length === 0) {
    // Batch upload all routes
    await uploadAllRoutes();
  } else {
    console.log('Usage:');
    console.log('  node seed-routes.js                    # Upload all routes');
    console.log('  node seed-routes.js <day> <json-file>  # Upload single route');
    console.log('');
    console.log('Example:');
    console.log('  node seed-routes.js 9 /Users/kev/Downloads/route-furnace-creek.json');
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
