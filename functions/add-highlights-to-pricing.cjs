/**
 * Add highlights from poi-migration-report.html to eventConfig/pricing
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Highlights extracted from poi-migration-report.html
// These are the text-based highlights (not coordinate POIs)
const highlightsByNight = {
  'night-1': [],
  'night-2': [],
  'night-3': [
    'Vizcaíno Desert landscapes',
    '28th Parallel - Baja California Sur border',
    'Salt evaporation ponds',
    'Laguna Ojo de Liebre whale sanctuary'
  ],
  'night-4': [
    'Gray whale watching - get the first boat out to give you plenty of time to get to camp',
    'San Ignacio Oasis: Palm-fringed town with stunning 18th-century stone mission',
    'Volcán Las Tres Vírgenes: Towering dormant volcanoes near the Sea of Cortez',
    'Cuesta del Infierno: Thrilling steep switchbacks dropping to the coast',
    'Santa Rosalía: French-influenced mining town with Eiffel-designed iron church',
    'Panaderia El Boleo: Century-old bakery famous for French-style breads',
    'Mulegé River Overlook: Panoramic view of palm oasis meeting the sea'
  ],
  'night-5': [
    'Kayaking and snorkeling in crystal-clear waters',
    'Explore nearby beaches: Playa Santispac, Playa Coyote, Playa Requeson',
    'Visit the historic town of Mulegé (30 min ride)',
    'Visit the town of Loreto or head up to the historic Mission San Javier',
    'Fresh seafood at beachside palapas'
  ],
  'night-6': [
    'Coastal Highway 1 scenery',
    'Bahía de los Ángeles bay views',
    'Remote desert landscapes on Highway 12',
    'Island views in the Sea of Cortez',
    'The "L.A. Bay" Turnoff Whale Shark Mural - nice photo op'
  ],
  'night-7': [
    'Gonzaga Bay',
    'The Puertecitos Twisties',
    'Valley of the Giants',
    'La Rumorosa Grade',
    'San Felipe Malecon'
  ],
  'night-8': [
    'Julian: Historic gold-mining charm and legendary apple pies',
    'Sunrise Scenic Byway: High-elevation sweepers through Cleveland National Forest',
    'Joshua Tree National Park: Rock monoliths and iconic Joshua trees'
  ],
  'night-9': []
};

async function addHighlights() {
  console.log('Adding highlights to eventConfig/pricing...\n');

  const pricingRef = db.collection('eventConfig').doc('pricing');
  const pricingDoc = await pricingRef.get();

  if (!pricingDoc.exists) {
    console.error('eventConfig/pricing not found!');
    process.exit(1);
  }

  const data = pricingDoc.data();
  const nights = data.nights || {};

  for (const [nightKey, highlights] of Object.entries(highlightsByNight)) {
    if (highlights.length === 0) {
      console.log(nightKey + ': No highlights to add');
      continue;
    }

    if (!nights[nightKey]) {
      console.log(nightKey + ': Night config not found, skipping');
      continue;
    }

    // Update the night with pointsOfInterest
    nights[nightKey].pointsOfInterest = highlights;
    console.log(nightKey + ': Added ' + highlights.length + ' highlights');
  }

  // Save back to Firestore
  await pricingRef.update({ nights });
  console.log('\n✅ Successfully added highlights to eventConfig/pricing!');

  process.exit(0);
}

addHighlights().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
