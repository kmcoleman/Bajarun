/**
 * Look up user in Firebase Auth by UID
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'EU4XfMcbHedqGBqqUAemyXSoEv83';

async function lookupUser() {
  console.log(`Looking up user: ${uid}\n`);

  try {
    const userRecord = await admin.auth().getUser(uid);

    console.log('Firebase Auth User Found:');
    console.log('='.repeat(50));
    console.log(`UID: ${userRecord.uid}`);
    console.log(`Email: ${userRecord.email || 'N/A'}`);
    console.log(`Display Name: ${userRecord.displayName || 'N/A'}`);
    console.log(`Phone: ${userRecord.phoneNumber || 'N/A'}`);
    console.log(`Provider: ${userRecord.providerData.map(p => p.providerId).join(', ')}`);
    console.log(`Created: ${userRecord.metadata.creationTime}`);
    console.log(`Last Sign In: ${userRecord.metadata.lastSignInTime}`);
    console.log(`Email Verified: ${userRecord.emailVerified}`);
    console.log(`Disabled: ${userRecord.disabled}`);

  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('User NOT found in Firebase Auth!');
      console.log('This UID has no associated authentication account.');
    } else {
      console.error('Error:', err.message);
    }
  }

  process.exit(0);
}

lookupUser();
