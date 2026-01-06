/**
 * List registrations where docId != uid field
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function listMismatches() {
  console.log('Finding registrations with ID mismatches...\n');

  const regsSnap = await db.collection('registrations').get();
  const usersSnap = await db.collection('users').get();

  // Build users map
  const users = new Map();
  usersSnap.docs.forEach(doc => {
    users.set(doc.id, doc.data());
  });

  const mismatches = [];

  regsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (doc.id !== data.uid) {
      mismatches.push({
        fullName: data.fullName,
        email: data.email,
        regDocId: doc.id,
        uid: data.uid,
        userDocAtUid: users.has(data.uid),
        userDocAtRegId: users.has(doc.id)
      });
    }
  });

  // Sort by name
  mismatches.sort((a, b) => a.fullName.localeCompare(b.fullName));

  console.log(`Found ${mismatches.length} registrations with ID mismatches:\n`);
  console.log('| # | Name | Email | Reg Doc ID | UID | User@UID |');
  console.log('|---|------|-------|------------|-----|----------|');

  mismatches.forEach((m, i) => {
    console.log(`| ${i + 1} | ${m.fullName} | ${m.email} | ${m.regDocId.substring(0, 8)}... | ${m.uid.substring(0, 8)}... | ${m.userDocAtUid ? 'YES' : 'NO'} |`);
  });

  console.log('\n\nDetailed list:\n');
  mismatches.forEach((m, i) => {
    console.log(`${i + 1}. ${m.fullName}`);
    console.log(`   Email: ${m.email}`);
    console.log(`   Registration Doc ID: ${m.regDocId}`);
    console.log(`   UID field: ${m.uid}`);
    console.log(`   User doc exists at UID: ${m.userDocAtUid ? 'YES' : 'NO'}`);
    console.log(`   User doc exists at RegDocId: ${m.userDocAtRegId ? 'YES' : 'NO'}`);
    console.log();
  });

  process.exit(0);
}

listMismatches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
