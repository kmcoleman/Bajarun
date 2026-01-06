/**
 * Fix Nicolas Solberg's user doc
 * 1. Update night-3 to hotel + breakfast + dinner
 * 2. Delete duplicate user doc at registration docId
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const UID = 'rKhWNMdEZDcJ54vkBZfqbotD7Df1';
const REG_DOC_ID = 'zPHmYDRBOplfGTJkO56S';

async function fix() {
  console.log('Fixing Nicolas Solberg user doc...\n');

  // Step 1: Update night-3 in the correct user doc
  console.log('Step 1: Updating night-3 at UID location');
  console.log(`  Document: users/${UID}`);

  const userRef = db.collection('users').doc(UID);
  await userRef.update({
    'accommodationSelections.night-3.accommodation': 'hotel',
    'accommodationSelections.night-3.breakfast': true,
    'accommodationSelections.night-3.dinner': true,
    'selectionsUpdatedAt': admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('  ✅ Updated night-3: hotel + breakfast + dinner\n');

  // Step 2: Delete duplicate user doc at registration docId
  console.log('Step 2: Deleting duplicate user doc');
  console.log(`  Document: users/${REG_DOC_ID}`);

  await db.collection('users').doc(REG_DOC_ID).delete();
  console.log('  ✅ Deleted duplicate\n');

  // Verify
  console.log('Verifying...');
  const updatedDoc = await userRef.get();
  const night3 = updatedDoc.data().accommodationSelections['night-3'];
  console.log('  night-3 now:', JSON.stringify(night3, null, 2));

  const deletedDoc = await db.collection('users').doc(REG_DOC_ID).get();
  console.log('  Duplicate exists:', deletedDoc.exists ? 'YES (problem!)' : 'NO (good!)');

  console.log('\n✅ Fix complete!');
  process.exit(0);
}

fix().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
