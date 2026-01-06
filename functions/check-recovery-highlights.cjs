const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

const recoveryApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseId: 'recovery'
}, 'recovery');

const recoveryDb = admin.firestore(recoveryApp);

async function check() {
  const doc = await recoveryDb.collection('eventConfig').doc('pricing').get();
  if (!doc.exists) {
    console.log('pricing doc not found in recovery');
    process.exit(0);
    return;
  }
  const data = doc.data();
  const nights = data.nights || {};

  console.log('Checking recovery database for pointsOfInterest...\n');

  for (const [key, night] of Object.entries(nights).sort()) {
    const poi = night.pointsOfInterest;
    if (Array.isArray(poi) && poi.length > 0) {
      console.log(key + ': ' + poi.length + ' highlights');
      poi.forEach(p => console.log('  - ' + p));
      console.log('');
    }
  }
  process.exit(0);
}
check();
