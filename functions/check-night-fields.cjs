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

  // Just show one night's fields as example
  const night3 = nights['night-3'];
  if (night3) {
    console.log('Fields in night-3:');
    for (const [field, value] of Object.entries(night3)) {
      if (typeof value === 'string') {
        console.log('  ' + field + ': "' + value.substring(0, 50) + (value.length > 50 ? '...' : '') + '"');
      } else if (Array.isArray(value)) {
        console.log('  ' + field + ': [Array with ' + value.length + ' items]');
        if (value.length > 0) {
          console.log('    first item:', typeof value[0] === 'string' ? value[0].substring(0, 50) : JSON.stringify(value[0]).substring(0, 80));
        }
      } else {
        console.log('  ' + field + ':', value);
      }
    }
  }
  process.exit(0);
}
check();
