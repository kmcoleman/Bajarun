/**
 * Check the relationship between users and registrations collections
 */

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkLinks() {
  console.log('Analyzing users and registrations collections...\n');

  // Fetch both collections
  const [regsSnap, usersSnap] = await Promise.all([
    db.collection('registrations').get(),
    db.collection('users').get()
  ]);

  const registrations = regsSnap.docs.map(doc => ({
    docId: doc.id,
    uid: doc.data().uid,
    fullName: doc.data().fullName || 'Unknown',
    email: doc.data().email || ''
  }));

  const users = new Map();
  usersSnap.docs.forEach(doc => {
    users.set(doc.id, {
      docId: doc.id,
      displayName: doc.data().displayName,
      hasAccommodations: !!doc.data().accommodationSelections
    });
  });

  console.log(`Found ${registrations.length} registrations`);
  console.log(`Found ${users.size} user documents\n`);

  // Analyze each registration
  const issues = [];
  const good = [];

  registrations.forEach(reg => {
    const docIdMatchesUid = reg.docId === reg.uid;
    const userDocExistsById = users.has(reg.docId);
    const userDocExistsByUid = users.has(reg.uid);

    const status = {
      fullName: reg.fullName,
      email: reg.email,
      regDocId: reg.docId,
      uidField: reg.uid,
      docIdMatchesUid,
      userDocExistsById,
      userDocExistsByUid,
      issues: []
    };

    if (!docIdMatchesUid) {
      status.issues.push('docId ≠ uid');
    }
    if (!userDocExistsByUid && reg.uid) {
      status.issues.push('No user doc for uid');
    }
    if (userDocExistsById && userDocExistsByUid && !docIdMatchesUid) {
      status.issues.push('Duplicate user docs');
    }

    if (status.issues.length > 0) {
      issues.push(status);
    } else {
      good.push(status);
    }
  });

  // Check for orphan user docs (users without registrations)
  const regUids = new Set(registrations.map(r => r.uid));
  const regDocIds = new Set(registrations.map(r => r.docId));
  const orphanUsers = [];

  users.forEach((userData, docId) => {
    if (!regUids.has(docId) && !regDocIds.has(docId)) {
      orphanUsers.push({
        docId,
        displayName: userData.displayName,
        hasAccommodations: userData.hasAccommodations
      });
    }
  });

  // Print results
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Good registrations: ${good.length}`);
  console.log(`⚠️  Registrations with issues: ${issues.length}`);
  console.log(`🔶 Orphan user docs: ${orphanUsers.length}`);
  console.log();

  if (issues.length > 0) {
    console.log('='.repeat(60));
    console.log('REGISTRATIONS WITH ISSUES');
    console.log('='.repeat(60));
    issues.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.fullName}`);
      console.log(`   Email: ${item.email}`);
      console.log(`   Registration Doc ID: ${item.regDocId}`);
      console.log(`   UID field value: ${item.uidField}`);
      console.log(`   Issues: ${item.issues.join(', ')}`);
      console.log(`   User doc by docId: ${item.userDocExistsById ? 'YES' : 'NO'}`);
      console.log(`   User doc by uid: ${item.userDocExistsByUid ? 'YES' : 'NO'}`);
    });
  }

  if (orphanUsers.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ORPHAN USER DOCS (no matching registration)');
    console.log('='.repeat(60));
    orphanUsers.forEach((item, i) => {
      console.log(`${i + 1}. Doc ID: ${item.docId}`);
      console.log(`   Display Name: ${item.displayName || 'N/A'}`);
      console.log(`   Has Accommodations: ${item.hasAccommodations ? 'YES' : 'NO'}`);
    });
  }

  if (good.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('GOOD REGISTRATIONS (properly linked)');
    console.log('='.repeat(60));
    good.forEach((item, i) => {
      console.log(`${i + 1}. ${item.fullName} - ${item.email}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('COLLECTION STRUCTURE');
  console.log('='.repeat(60));
  console.log(`
registrations/{docId}
  ├── uid: "{Firebase Auth UID}"
  ├── fullName, email, phone, etc.
  └── (profile & rider info)

users/{uid}
  ├── displayName
  ├── accommodationSelections: { night-1: {...}, night-2: {...} }
  └── (trip preferences)

ledger/{uid}/charges/{chargeId}
  └── (posted charges)

IDEAL: registration.docId === registration.uid === users.docId
`);

  process.exit(0);
}

checkLinks().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
