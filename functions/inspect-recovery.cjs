/**
 * Inspect all fields in recovery database
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

const recoveryApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseId: 'recovery'
}, 'recovery');

const recoveryDb = admin.firestore(recoveryApp);

async function inspect() {
  console.log('Inspecting recovery database...\n');

  const pricing = await recoveryDb.collection('eventConfig').doc('pricing').get();

  if (!pricing.exists) {
    console.log('eventConfig/pricing does not exist in recovery database!');
    process.exit(1);
  }

  const data = pricing.data();
  const nights = data.nights || {};

  console.log('All fields in each night:\n');

  for (const [key, night] of Object.entries(nights).sort()) {
    console.log(key + ':');
    for (const [field, value] of Object.entries(night)) {
      let valStr;
      if (typeof value === 'string') {
        valStr = value.length > 80 ? value.substring(0, 80) + '...' : value;
        if (value.length > 100) {
          console.log('  ' + field + ' (' + value.length + ' chars): "' + valStr + '"');
        } else {
          console.log('  ' + field + ': "' + valStr + '"');
        }
      } else if (Array.isArray(value)) {
        console.log('  ' + field + ': [Array with ' + value.length + ' items]');
      } else if (typeof value === 'object') {
        console.log('  ' + field + ': {Object}');
      } else {
        console.log('  ' + field + ': ' + value);
      }
    }
    console.log('');
  }
  process.exit(0);
}

inspect().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
