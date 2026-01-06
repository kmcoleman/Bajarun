/**
 * Recover dayDescription fields from Firestore PITR
 *
 * Steps:
 * 1. First, use gcloud to export the data from a point in time before cleanup
 * 2. Then run this script to read the exported data and restore the descriptions
 *
 * STEP 1 - Run this in terminal to export from before cleanup (adjust timestamp):
 *
 * gcloud firestore export gs://bajarun-2026.appspot.com/pitr-recovery-$(date +%s) \
 *   --database="(default)" \
 *   --snapshot-time="2025-01-03T00:00:00Z" \
 *   --collection-ids="eventConfig"
 *
 * Or use the Firebase Console:
 * 1. Go to Firebase Console > Firestore > Backups
 * 2. Click "Restore data"
 * 3. Select a time before the cleanup (before ~5pm today)
 * 4. Restore to a new database (e.g., "recovery")
 * 5. Then run this script with --from-db=recovery
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkCurrentDescriptions() {
  console.log('Checking current dayDescription fields in eventConfig/pricing...\n');

  const pricingDoc = await db.collection('eventConfig').doc('pricing').get();

  if (!pricingDoc.exists) {
    console.log('eventConfig/pricing does not exist!');
    return;
  }

  const data = pricingDoc.data();
  const nights = data.nights || {};

  for (const [key, night] of Object.entries(nights).sort()) {
    const desc = night.dayDescription || '';
    console.log(`${key}: dayDescription = ${desc.length} chars`);
    if (desc.length > 0) {
      console.log(`  "${desc.substring(0, 80)}..."`);
    }
  }
}

async function showRecoveryInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('RECOVERY INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log(`
To recover the dayDescription fields using Firebase PITR:

OPTION 1: Firebase Console (Easier)
-----------------------------------
1. Go to: https://console.firebase.google.com/project/bajarun-2026/firestore/backups
2. Click "Restore data"
3. Select timestamp BEFORE the cleanup (before ~5pm Jan 3, 2025)
4. Restore to a NEW database named "recovery"
5. Then run: node recover-day-descriptions.cjs --copy-from-recovery

OPTION 2: gcloud CLI
--------------------
1. Export from a point in time:

   gcloud firestore export gs://bajarun-2026.appspot.com/pitr-recovery \\
     --database="(default)" \\
     --snapshot-time="2025-01-03T12:00:00Z" \\
     --collection-ids="eventConfig"

2. Import to a temporary database or read directly

OPTION 3: Manual Entry
----------------------
If you have the narratives saved elsewhere, you can:
1. Go to https://bajarun-2026.web.app/admin/routes
2. Expand each day and paste the narrative into the Description field
3. Click Save
`);
}

async function copyFromRecoveryDb() {
  console.log('Attempting to copy dayDescription from recovery database...\n');

  // Connect to recovery database
  const recoveryDb = admin.firestore();
  // Note: To connect to a different database, you'd need to initialize a separate app
  // For now, this shows what the data structure would look like

  console.log('NOTE: To use a recovery database, you need to:');
  console.log('1. Create the recovery database in Firebase Console');
  console.log('2. Modify this script to connect to that database');
  console.log('3. Copy the dayDescription fields to the routes collection\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--copy-from-recovery')) {
    await copyFromRecoveryDb();
  } else {
    await checkCurrentDescriptions();
    await showRecoveryInstructions();
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
