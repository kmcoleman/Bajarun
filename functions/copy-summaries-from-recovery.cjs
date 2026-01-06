/**
 * Copy nightSummary fields from recovery database to routes collection
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

// Initialize main app
const mainApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
}, 'main');

// Initialize recovery app (pointing to recovery database)
const recoveryApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseId: 'recovery'
}, 'recovery');

const mainDb = admin.firestore(mainApp);
const recoveryDb = admin.firestore(recoveryApp);

async function copySummaries() {
  console.log('Reading nightSummary fields from recovery database...\n');

  // Read from recovery database
  const recoveryPricing = await recoveryDb.collection('eventConfig').doc('pricing').get();

  if (!recoveryPricing.exists) {
    console.error('ERROR: eventConfig/pricing not found in recovery database!');
    process.exit(1);
  }

  const recoveryData = recoveryPricing.data();
  const nights = recoveryData.nights || {};

  console.log('Found summaries in recovery database:\n');

  const summaries = {};

  // night-1 = Day 1, night-2 = Day 2, etc. (based on dates)
  for (const [key, night] of Object.entries(nights).sort()) {
    const summary = night.nightSummary || '';
    const nightNum = parseInt(key.replace('night-', ''));
    const dayNum = nightNum; // night-1 = day 1

    if (summary.length > 0) {
      console.log(`${key} → Day ${dayNum}: ${summary.length} chars`);
      console.log(`  "${summary.substring(0, 80)}..."\n`);
      summaries[dayNum] = summary;
    }
  }

  if (Object.keys(summaries).length === 0) {
    console.log('\nNo summaries found in recovery database!');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log(`Found ${Object.keys(summaries).length} summaries to restore`);
  console.log('='.repeat(60));

  // Copy to routes collection in main database
  console.log('\nCopying to routes collection in main database...\n');

  for (const [day, summary] of Object.entries(summaries)) {
    const routeRef = mainDb.collection('events').doc('bajarun2026').collection('routes').doc(`day${day}`);

    // Check if route exists
    const routeDoc = await routeRef.get();
    if (!routeDoc.exists) {
      console.log(`⚠ Day ${day}: Route doesn't exist, skipping`);
      continue;
    }

    await routeRef.update({
      description: summary,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✓ Day ${day}: Updated description (${summary.length} chars)`);
  }

  console.log('\n✅ Successfully restored all summaries to route descriptions!');
  console.log('\nView at: https://bajarun-2026.web.app/admin/routes');

  process.exit(0);
}

copySummaries().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
