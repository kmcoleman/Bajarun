/**
 * Delete dayTitle and dayDescription fields from eventConfig/pricing
 * These fields are no longer used - ride info is now in the routes collection
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteFields() {
  console.log('Deleting dayTitle and dayDescription from eventConfig/pricing...\n');

  const docRef = db.collection('eventConfig').doc('pricing');
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.log('No pricing document found!');
    process.exit(1);
  }

  const data = docSnap.data();
  const nights = data.nights || {};
  const updates = {};
  let count = 0;

  for (const [nightKey, nightConfig] of Object.entries(nights)) {
    if (nightConfig.dayTitle !== undefined || nightConfig.dayDescription !== undefined) {
      // Mark fields for deletion using FieldValue.delete()
      updates[`nights.${nightKey}.dayTitle`] = admin.firestore.FieldValue.delete();
      updates[`nights.${nightKey}.dayDescription`] = admin.firestore.FieldValue.delete();

      console.log(`${nightKey}: Removing dayTitle="${nightConfig.dayTitle?.substring(0, 30) || ''}..." and dayDescription`);
      count++;
    }
  }

  if (count === 0) {
    console.log('No dayTitle or dayDescription fields found to delete.');
    process.exit(0);
  }

  // Apply all updates in a single batch
  await docRef.update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`\nDeleted fields from ${count} nights.`);
  process.exit(0);
}

deleteFields().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
