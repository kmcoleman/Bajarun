/**
 * Delete orphan user documents (terms acceptance only, no registration)
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Only the 7 with terms acceptance only (NOT the one with documents)
const ORPHAN_IDS = [
  '3DEbR6471DQkdiJ11n22S51dlKB3',
  'AUtsfbM6VdPP6VIEdBVW7fHmJ9r1',
  // 'EU4XfMcbHedqGBqqUAemyXSoEv83', // SKIP - has documents
  'MGnwYl4j3hXI9cJbfbXYRpdTZ4N2',
  'VYPPJZrR5thRTv0R2QIIk51jC4C2',
  'mkYji6lhejWkWMRB3TgRhNRrWQd2',
  'x0k8vxIdJpRi37MJsnpNxQRC6Hf1',
  'x2DG4dZb5Xaf2a9sSP9Id12EVdp2'
];

async function deleteOrphans() {
  console.log('Deleting 7 orphan user documents...\n');

  for (const uid of ORPHAN_IDS) {
    try {
      await db.collection('users').doc(uid).delete();
      console.log(`✅ Deleted: ${uid}`);
    } catch (err) {
      console.log(`❌ Failed to delete ${uid}: ${err.message}`);
    }
  }

  console.log('\nDone! Deleted 7 orphan user documents.');
  console.log('Remaining orphan with documents: EU4XfMcbHedqGBqqUAemyXSoEv83');

  process.exit(0);
}

deleteOrphans().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
