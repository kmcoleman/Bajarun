/**
 * sync-auth-emails.js
 *
 * Syncs Firebase Auth emails to the users collection in Firestore.
 * Usage: node sync-auth-emails.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncAuthEmails() {
  console.log('Fetching Firebase Auth users...\n');

  // Get all auth users
  const authUsers = [];
  let nextPageToken;

  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    listUsersResult.users.forEach((userRecord) => {
      authUsers.push({
        uid: userRecord.uid,
        email: userRecord.email || null,
        displayName: userRecord.displayName || null
      });
    });
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`Found ${authUsers.length} auth users\n`);

  // Update each user document in Firestore
  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const authUser of authUsers) {
    const userRef = db.collection('users').doc(authUser.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing document with email
      const currentData = userDoc.data();
      if (currentData.email !== authUser.email) {
        await userRef.update({
          email: authUser.email,
          displayName: authUser.displayName || currentData.displayName || null
        });
        console.log(`Updated: ${authUser.email} (${authUser.uid})`);
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Create new user document
      await userRef.set({
        email: authUser.email,
        displayName: authUser.displayName || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Created: ${authUser.email} (${authUser.uid})`);
      created++;
    }
  }

  console.log('\n' + '-'.repeat(50));
  console.log(`Updated: ${updated}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already synced): ${skipped}`);
  console.log(`Total: ${authUsers.length}`);
}

syncAuthEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
