/**
 * Investigate the duplicate record issue for nic@freefrog.com
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// From the earlier analysis:
// Registration Doc ID: zPHmYDRBOplfGTJkO56S
// UID field value: rKhWNMdEZDcJ54vkBZfqbotD7Df1

const REG_DOC_ID = 'zPHmYDRBOplfGTJkO56S';
const UID = 'rKhWNMdEZDcJ54vkBZfqbotD7Df1';

async function investigate() {
  console.log('Investigating nic@freefrog.com (Nicolas Solberg)\n');
  console.log('Registration Doc ID:', REG_DOC_ID);
  console.log('UID:', UID);
  console.log('='.repeat(60));

  // 1. Get the registration document
  console.log('\n1. REGISTRATION DOCUMENT');
  console.log('-'.repeat(40));
  const regDoc = await db.collection('registrations').doc(REG_DOC_ID).get();
  if (regDoc.exists) {
    const data = regDoc.data();
    console.log('Full Name:', data.fullName);
    console.log('Email:', data.email);
    console.log('UID field:', data.uid);
    console.log('Phone:', data.phone);
    console.log('Created:', data.createdAt?.toDate?.() || 'N/A');
  } else {
    console.log('NOT FOUND!');
  }

  // 2. Check user doc at registration doc ID
  console.log('\n2. USER DOC AT REGISTRATION DOC ID (zPHmYDRBOplfGTJkO56S)');
  console.log('-'.repeat(40));
  const userDocByRegId = await db.collection('users').doc(REG_DOC_ID).get();
  if (userDocByRegId.exists) {
    const data = userDocByRegId.data();
    console.log('EXISTS!');
    console.log('Data:', JSON.stringify(data, null, 2));
  } else {
    console.log('Does not exist');
  }

  // 3. Check user doc at UID
  console.log('\n3. USER DOC AT UID (rKhWNMdEZDcJ54vkBZfqbotD7Df1)');
  console.log('-'.repeat(40));
  const userDocByUid = await db.collection('users').doc(UID).get();
  if (userDocByUid.exists) {
    const data = userDocByUid.data();
    console.log('EXISTS!');
    console.log('Data:', JSON.stringify(data, null, 2));
  } else {
    console.log('Does not exist');
  }

  // 4. Check ledger at registration doc ID
  console.log('\n4. LEDGER AT REGISTRATION DOC ID');
  console.log('-'.repeat(40));
  const ledgerByRegId = await db.collection('ledger').doc(REG_DOC_ID).collection('charges').get();
  if (!ledgerByRegId.empty) {
    console.log(`Found ${ledgerByRegId.size} charges`);
    ledgerByRegId.docs.forEach(doc => {
      const d = doc.data();
      console.log(`  - ${d.description}: $${d.amount}`);
    });
  } else {
    console.log('No charges');
  }

  // 5. Check ledger at UID
  console.log('\n5. LEDGER AT UID');
  console.log('-'.repeat(40));
  const ledgerByUid = await db.collection('ledger').doc(UID).collection('charges').get();
  if (!ledgerByUid.empty) {
    console.log(`Found ${ledgerByUid.size} charges`);
    ledgerByUid.docs.forEach(doc => {
      const d = doc.data();
      console.log(`  - ${d.description}: $${d.amount}`);
    });
  } else {
    console.log('No charges');
  }

  // 6. Check Firebase Auth
  console.log('\n6. FIREBASE AUTH');
  console.log('-'.repeat(40));
  try {
    const authUser = await admin.auth().getUser(UID);
    console.log('Email:', authUser.email);
    console.log('Display Name:', authUser.displayName);
    console.log('Provider:', authUser.providerData.map(p => p.providerId).join(', '));
    console.log('Created:', authUser.metadata.creationTime);
    console.log('Last Sign In:', authUser.metadata.lastSignInTime);
  } catch (err) {
    console.log('Not found in Auth:', err.message);
  }

  // 7. Summary & Recommendation
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY & RECOMMENDATION');
  console.log('='.repeat(60));

  const hasUserDocByRegId = userDocByRegId.exists;
  const hasUserDocByUid = userDocByUid.exists;

  if (hasUserDocByRegId && hasUserDocByUid) {
    console.log('\nPROBLEM: Duplicate user docs exist!');
    console.log('- User doc at registration docId: YES');
    console.log('- User doc at UID: YES');
    console.log('\nRECOMMENDATION:');
    console.log('1. Compare both user docs to see which has accommodation data');
    console.log('2. Keep the one at UID (correct location)');
    console.log('3. Merge any data from the one at regDocId if needed');
    console.log('4. Delete the user doc at regDocId');
  }

  process.exit(0);
}

investigate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
