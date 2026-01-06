/**
 * Copy dayDescription fields from recovery database to routes collection
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

async function copyDescriptions() {
  console.log('Reading dayDescription fields from recovery database...\n');

  // Read from recovery database
  const recoveryPricing = await recoveryDb.collection('eventConfig').doc('pricing').get();

  if (!recoveryPricing.exists) {
    console.error('ERROR: eventConfig/pricing not found in recovery database!');
    process.exit(1);
  }

  const recoveryData = recoveryPricing.data();
  const nights = recoveryData.nights || {};

  console.log('Found descriptions in recovery database:\n');

  const descriptions = {};

  for (const [key, night] of Object.entries(nights).sort()) {
    const desc = night.dayDescription || '';
    const nightNum = parseInt(key.replace('night-', ''));

    console.log(`${key} (Day ${nightNum + 1}): ${desc.length} chars`);
    if (desc.length > 0) {
      console.log(`  "${desc.substring(0, 100)}..."\n`);
      descriptions[nightNum + 1] = desc;
    }
  }

  if (Object.keys(descriptions).length === 0) {
    console.log('\nNo descriptions found in recovery database!');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Found ${Object.keys(descriptions).length} descriptions to restore`);
  console.log('='.repeat(60));

  // Copy to routes collection in main database
  console.log('\nCopying to routes collection in main database...\n');

  for (const [day, description] of Object.entries(descriptions)) {
    const routeRef = mainDb.collection('events').doc('bajarun2026').collection('routes').doc(`day${day}`);

    await routeRef.update({
      description: description,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✓ Day ${day}: Updated description (${description.length} chars)`);
  }

  console.log('\n✅ Successfully restored all descriptions!');
  console.log('\nView at: https://bajarun-2026.web.app/admin/routes');

  process.exit(0);
}

copyDescriptions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
