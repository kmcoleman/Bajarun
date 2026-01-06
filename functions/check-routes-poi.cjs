const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('events').doc('bajarun2026').collection('routes').get();

  console.log('Checking routes collection for highlights...\n');

  snapshot.forEach(doc => {
    const data = doc.data();
    // Check both 'pois' (coordinate-based) and 'highlights' or 'pointsOfInterest' (text-based)
    console.log(doc.id + ':');
    console.log('  pois:', data.pois ? data.pois.length + ' items' : 'none');
    console.log('  highlights:', data.highlights ? data.highlights.length + ' items' : 'none');
    console.log('  pointsOfInterest:', data.pointsOfInterest ? data.pointsOfInterest.length + ' items' : 'none');
  });

  process.exit(0);
}
check();
