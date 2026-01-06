const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function check() {
  const doc = await db.collection('eventConfig').doc('pricing').get();
  if (!doc.exists) {
    console.log('pricing doc not found');
    return;
  }
  const data = doc.data();
  const nights = data.nights || {};

  for (const [key, night] of Object.entries(nights).sort()) {
    const poi = night.pointsOfInterest;
    console.log(key + ': pointsOfInterest =', Array.isArray(poi) ? poi.length + ' items' : typeof poi);
    if (Array.isArray(poi) && poi.length > 0) {
      poi.slice(0, 2).forEach(p => console.log('  -', typeof p === 'string' ? p.substring(0, 60) : JSON.stringify(p).substring(0, 60)));
    }
  }
  process.exit(0);
}
check();
