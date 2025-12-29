/**
 * Seed legal documents to Firebase Storage and config to Firestore
 * Run with: node seed-legal.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'bajarun-2026.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function seedLegal() {
  console.log('Uploading legal documents to Storage...');

  // Upload privacy policy
  const privacyPath = path.join(__dirname, 'legal', 'privacy-policy.md');
  const privacyContent = fs.readFileSync(privacyPath, 'utf8');
  const privacyFile = bucket.file('legal/privacy-policy.md');
  await privacyFile.save(privacyContent, {
    contentType: 'text/markdown',
    metadata: {
      cacheControl: 'public, max-age=3600' // Cache for 1 hour
    }
  });
  await privacyFile.makePublic();
  const privacyUrl = `https://storage.googleapis.com/bajarun-2026.firebasestorage.app/legal/privacy-policy.md`;
  console.log('Uploaded privacy policy:', privacyUrl);

  // Upload terms of service
  const termsPath = path.join(__dirname, 'legal', 'terms-of-service.md');
  const termsContent = fs.readFileSync(termsPath, 'utf8');
  const termsFile = bucket.file('legal/terms-of-service.md');
  await termsFile.save(termsContent, {
    contentType: 'text/markdown',
    metadata: {
      cacheControl: 'public, max-age=3600' // Cache for 1 hour
    }
  });
  await termsFile.makePublic();
  const termsUrl = `https://storage.googleapis.com/bajarun-2026.firebasestorage.app/legal/terms-of-service.md`;
  console.log('Uploaded terms of service:', termsUrl);

  // Set config in Firestore
  console.log('Setting terms config in Firestore...');
  await db.collection('config').doc('terms').set({
    privacyVersion: '1.0',
    termsVersion: '1.0',
    privacyUrl: privacyUrl,
    termsUrl: termsUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Terms config saved to Firestore');

  console.log('\nDone! To update terms in the future:');
  console.log('1. Edit the markdown files in functions/legal/');
  console.log('2. Update the version numbers in this script');
  console.log('3. Run: node seed-legal.js');
  console.log('\nUsers with older versions will be prompted to re-accept.');

  process.exit(0);
}

seedLegal().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
