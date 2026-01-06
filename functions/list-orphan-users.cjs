/**
 * List detailed info about orphan user documents
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const ORPHAN_IDS = [
  '3DEbR6471DQkdiJ11n22S51dlKB3',
  'AUtsfbM6VdPP6VIEdBVW7fHmJ9r1',
  'EU4XfMcbHedqGBqqUAemyXSoEv83',
  'MGnwYl4j3hXI9cJbfbXYRpdTZ4N2',
  'VYPPJZrR5thRTv0R2QIIk51jC4C2',
  'mkYji6lhejWkWMRB3TgRhNRrWQd2',
  'x0k8vxIdJpRi37MJsnpNxQRC6Hf1',
  'x2DG4dZb5Xaf2a9sSP9Id12EVdp2'
];

async function listOrphans() {
  console.log('Fetching orphan user documents...\n');

  for (const uid of ORPHAN_IDS) {
    const docRef = db.collection('users').doc(uid);
    const docSnap = await docRef.get();

    console.log('='.repeat(60));
    console.log(`Document ID: ${uid}`);

    if (docSnap.exists) {
      const data = docSnap.data();
      console.log('Data:', JSON.stringify(data, null, 2));

      // Check for subcollections or related data
      const ledgerRef = db.collection('ledger').doc(uid);
      const ledgerSnap = await ledgerRef.get();

      if (ledgerSnap.exists) {
        console.log('Has ledger document: YES');
      } else {
        // Check for charges subcollection
        const chargesSnap = await db.collection('ledger').doc(uid).collection('charges').limit(1).get();
        if (!chargesSnap.empty) {
          console.log('Has ledger charges: YES');
        } else {
          console.log('Has ledger: NO');
        }
      }
    } else {
      console.log('Document does not exist!');
    }
    console.log();
  }

  process.exit(0);
}

listOrphans().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
