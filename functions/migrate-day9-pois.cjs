/**
 * Migrate Day 9 POIs from eventConfig/pricing to events/bajarun2026/routes
 * Run: node migrate-day9-pois.cjs
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

// Normalize name for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function migratePOIs() {
  console.log('Migrating Day 9 POIs from pricing to routes...\n');

  // Fetch current routes day9 data
  const routeRef = db.collection('events').doc('bajarun2026').collection('routes').doc('day9');
  const routeDoc = await routeRef.get();

  if (!routeDoc.exists) {
    console.error('ERROR: day9 route document does not exist!');
    process.exit(1);
  }

  const routeData = routeDoc.data();
  const existingPois = routeData.pois || [];
  console.log(`Existing POIs in routes/day9: ${existingPois.length}`);
  existingPois.forEach(p => console.log(`  - [${p.category}] ${p.name}`));

  // Fetch pricing data
  const pricingDoc = await db.collection('eventConfig').doc('pricing').get();
  const pricingData = pricingDoc.data();
  const night9 = pricingData.nights?.['night-9'] || {};
  const pricingPois = night9.routeConfig?.pois || [];

  console.log(`\nPOIs in pricing/night-9: ${pricingPois.length}`);
  pricingPois.forEach(p => {
    if (typeof p === 'object' && p.category) {
      console.log(`  - [${p.category}] ${p.name}`);
    }
  });

  // Find POIs to migrate (real POIs not already in routes)
  const poisToMigrate = [];
  const existingNames = existingPois.map(p => normalizeName(p.name));

  pricingPois.forEach(poi => {
    // Only migrate real POIs (objects with category)
    if (typeof poi !== 'object' || !poi.category) return;

    // Check if already exists
    const normalized = normalizeName(poi.name);
    const exists = existingNames.some(n => n.includes(normalized) || normalized.includes(n));

    if (!exists) {
      poisToMigrate.push(poi);
    }
  });

  console.log(`\nPOIs to migrate: ${poisToMigrate.length}`);
  poisToMigrate.forEach(p => console.log(`  + [${p.category}] ${p.name}`));

  if (poisToMigrate.length === 0) {
    console.log('\nNo POIs to migrate. Done!');
    process.exit(0);
  }

  // Merge POIs
  const mergedPois = [...existingPois, ...poisToMigrate];
  console.log(`\nMerged POI count: ${mergedPois.length}`);

  // Update Firestore
  await routeRef.update({
    pois: mergedPois,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\n✓ Successfully migrated POIs to routes/day9!');
  console.log(`  Total POIs now: ${mergedPois.length}`);

  process.exit(0);
}

migratePOIs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
