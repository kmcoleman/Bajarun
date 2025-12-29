/**
 * export-auth-users.js
 *
 * Exports all Firebase Auth users (UID and email) to a JSON file.
 * Usage: node export-auth-users.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function exportAuthUsers() {
  const users = [];
  let nextPageToken;

  console.log('Fetching Firebase Auth users...\n');

  // Firebase Auth returns users in batches of up to 1000
  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

    listUsersResult.users.forEach((userRecord) => {
      users.push({
        uid: userRecord.uid,
        email: userRecord.email || null,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        createdAt: userRecord.metadata.creationTime
      });
    });

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  // Sort by email
  users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

  // Print to console
  console.log('UID                                      | Email');
  console.log('-'.repeat(80));
  users.forEach(u => {
    console.log(`${u.uid} | ${u.email || '(no email)'}`);
  });
  console.log('-'.repeat(80));
  console.log(`\nTotal: ${users.length} users\n`);

  // Save to JSON file
  const outputPath = './auth-users.json';
  fs.writeFileSync(outputPath, JSON.stringify(users, null, 2));
  console.log(`Saved to ${outputPath}`);

  // Also save a simple CSV
  const csvPath = './auth-users.csv';
  const csvContent = 'uid,email,displayName\n' +
    users.map(u => `${u.uid},${u.email || ''},${(u.displayName || '').replace(/,/g, ' ')}`).join('\n');
  fs.writeFileSync(csvPath, csvContent);
  console.log(`Saved to ${csvPath}`);
}

exportAuthUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
