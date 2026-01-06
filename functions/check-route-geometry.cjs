const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('events').doc('bajarun2026').collection('routes').get();

  console.log('Route geometry storage analysis:\n');

  let totalCoords = 0;
  let totalBytes = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const coords = data.routeGeometry?.coordinates || [];
    const coordCount = coords.length;
    totalCoords += coordCount;

    // Estimate storage: each coord is {lng: number, lat: number}
    // ~50 bytes per coordinate in Firestore
    const estimatedBytes = coordCount * 50;
    totalBytes += estimatedBytes;

    console.log(`${doc.id}: ${coordCount} coordinates (~${Math.round(estimatedBytes/1024)}KB)`);
  });

  console.log('\n-------------------');
  console.log(`Total: ${totalCoords} coordinates (~${Math.round(totalBytes/1024)}KB)`);
  console.log('\nFirestore charges per document read, not by size.');
  console.log('But large docs = slower loads & more bandwidth.');

  process.exit(0);
}
check();
