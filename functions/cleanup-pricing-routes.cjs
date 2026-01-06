/**
 * Clean up redundant route data from eventConfig/pricing
 * Removes: dayTitle, dayDescription, pointsOfInterest, routeConfig
 * Keeps: accommodation/pricing fields
 *
 * Run: node cleanup-pricing-routes.cjs
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

// Fields to remove (route data - now in routes collection)
const FIELDS_TO_REMOVE = [
  'dayTitle',
  'dayDescription',
  'pointsOfInterest',
  'routeConfig',
];

// Fields to keep (accommodation/pricing data)
const FIELDS_TO_KEEP = [
  'night',
  'date',
  'nightSummary',
  'hotelAvailable',
  'hotelName',
  'hotelAddress',
  'hotelPhone',
  'hotelWebsite',
  'hotelMapsLink',
  'hotelDescription',
  'hotelCost',
  'campingAvailable',
  'campingName',
  'campingMapsLink',
  'campingDescription',
  'campingCost',
  'dinnerAvailable',
  'dinnerName',
  'dinnerDescription',
  'dinnerCost',
  'breakfastAvailable',
  'breakfastName',
  'breakfastDescription',
  'breakfastCost',
  'optionalActivities',
  'routeLinks',
  'gpxFileUrl',
  'reverRouteUrl',
];

async function cleanup() {
  console.log('Cleaning up redundant route data from eventConfig/pricing...\n');

  // Fetch current pricing data
  const pricingRef = db.collection('eventConfig').doc('pricing');
  const pricingDoc = await pricingRef.get();

  if (!pricingDoc.exists) {
    console.error('ERROR: eventConfig/pricing does not exist!');
    process.exit(1);
  }

  const pricingData = pricingDoc.data();
  const nights = pricingData.nights || {};

  console.log(`Found ${Object.keys(nights).length} nights to clean up.\n`);

  const cleanedNights = {};
  let totalRemoved = 0;

  for (const [nightKey, nightData] of Object.entries(nights)) {
    console.log(`\n${nightKey}:`);

    const cleanedNight = {};
    const removedFields = [];

    for (const [field, value] of Object.entries(nightData)) {
      if (FIELDS_TO_REMOVE.includes(field)) {
        removedFields.push(field);
        totalRemoved++;
      } else {
        cleanedNight[field] = value;
      }
    }

    if (removedFields.length > 0) {
      console.log(`  Removing: ${removedFields.join(', ')}`);
    } else {
      console.log(`  No redundant fields to remove`);
    }

    // Show what's being kept
    const keptFields = Object.keys(cleanedNight).filter(f => f !== 'night');
    if (keptFields.length > 0) {
      console.log(`  Keeping: ${keptFields.slice(0, 5).join(', ')}${keptFields.length > 5 ? '...' : ''}`);
    }

    cleanedNights[nightKey] = cleanedNight;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total fields removed: ${totalRemoved}`);
  console.log('='.repeat(50));

  // Update Firestore
  console.log('\nUpdating Firestore...');
  await pricingRef.update({
    nights: cleanedNights,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\n✓ Successfully cleaned up eventConfig/pricing!');
  console.log('  Route data has been removed.');
  console.log('  Accommodation/pricing data has been preserved.');

  process.exit(0);
}

cleanup().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
