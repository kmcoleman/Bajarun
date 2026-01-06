#!/usr/bin/env node
/**
 * Upload route config JSON to eventConfig/pricing/nights/{nightKey}/routeConfig
 *
 * Usage:
 *   node functions/upload-route-config.js <night-number> <json-file>
 *
 * Examples:
 *   node functions/upload-route-config.js 9 /Users/kev/Downloads/route-furnace-creek-campground.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Find service account key
const keyPath = path.join(__dirname, 'service-account-key.json');
if (!fs.existsSync(keyPath)) {
  console.error('Error: serviceAccountKey.json not found at', keyPath);
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadRouteConfig() {
  const nightNumber = process.argv[2];
  const jsonFile = process.argv[3];

  if (!nightNumber || !jsonFile) {
    console.log('Usage: node functions/upload-route-config.js <night-number> <json-file>');
    console.log('');
    console.log('Example:');
    console.log('  node functions/upload-route-config.js 9 /Users/kev/Downloads/route-furnace-creek-campground.json');
    process.exit(1);
  }

  if (!fs.existsSync(jsonFile)) {
    console.error('Error: File not found:', jsonFile);
    process.exit(1);
  }

  const nightKey = `night-${nightNumber}`;
  const routeConfig = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

  console.log(`\nUploading route config to ${nightKey}...`);
  console.log(`  📍 Start: ${routeConfig.startName}`);
  console.log(`  📍 End:   ${routeConfig.endName}`);
  console.log(`  📏 Distance: ${routeConfig.estimatedDistance} miles`);
  console.log(`  ⏱️  Time: ${routeConfig.estimatedTime}`);
  console.log(`  📌 POIs: ${routeConfig.pois?.length || 0}`);
  console.log(`  🛤️  Waypoints: ${routeConfig.waypoints?.length || 0}`);

  await db.collection('eventConfig').doc('pricing').set({
    nights: {
      [nightKey]: {
        routeConfig: routeConfig
      }
    }
  }, { merge: true });

  console.log(`\n✅ Route config uploaded to eventConfig/pricing/nights/${nightKey}/routeConfig`);
  process.exit(0);
}

uploadRouteConfig().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
