/**
 * Rename pointsOfInterest to highlights in eventConfig/pricing
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function rename() {
  console.log('Renaming pointsOfInterest to highlights in eventConfig/pricing...\n');

  const pricingRef = db.collection('eventConfig').doc('pricing');
  const pricingDoc = await pricingRef.get();

  if (!pricingDoc.exists) {
    console.error('eventConfig/pricing not found!');
    process.exit(1);
  }

  const data = pricingDoc.data();
  const nights = data.nights || {};

  for (const [nightKey, night] of Object.entries(nights)) {
    if (night.pointsOfInterest) {
      // Copy to highlights
      nights[nightKey].highlights = night.pointsOfInterest;
      // Remove old field
      delete nights[nightKey].pointsOfInterest;
      console.log(nightKey + ': Renamed pointsOfInterest → highlights (' + nights[nightKey].highlights.length + ' items)');
    }
  }

  // Save back to Firestore
  await pricingRef.update({ nights });
  console.log('\n✅ Successfully renamed pointsOfInterest to highlights!');

  process.exit(0);
}

rename().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
