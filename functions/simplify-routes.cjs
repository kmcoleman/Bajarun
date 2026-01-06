/**
 * Simplify existing route geometries in Firestore
 * Uses Douglas-Peucker algorithm to reduce coordinate count while preserving shape
 */

const admin = require('firebase-admin');
const path = require('path');
const simplify = require('@turf/simplify').default;
const { lineString } = require('@turf/helpers');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Tolerance for simplification (0.0005 ≈ ~50m accuracy)
const TOLERANCE = 0.0005;

async function simplifyRoutes() {
  console.log('Simplifying route geometries...\n');
  console.log(`Tolerance: ${TOLERANCE} (~50m accuracy)\n`);

  const snapshot = await db.collection('events').doc('bajarun2026').collection('routes').get();

  let totalBefore = 0;
  let totalAfter = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const coords = data.routeGeometry?.coordinates;

    if (!coords || coords.length === 0) {
      console.log(`${docSnap.id}: No geometry, skipping`);
      continue;
    }

    const originalCount = coords.length;
    totalBefore += originalCount;

    // Convert Firestore format {lng, lat} to GeoJSON [lng, lat]
    const geoJsonCoords = coords.map(c =>
      Array.isArray(c) ? c : [c.lng, c.lat]
    );

    // Create LineString and simplify
    const line = lineString(geoJsonCoords);
    const simplified = simplify(line, { tolerance: TOLERANCE, highQuality: true });
    const simplifiedCoords = simplified.geometry.coordinates;
    const newCount = simplifiedCoords.length;
    totalAfter += newCount;

    const reduction = Math.round((1 - newCount / originalCount) * 100);
    console.log(`${docSnap.id}: ${originalCount} → ${newCount} points (${reduction}% reduction)`);

    // Convert back to Firestore format {lng, lat}
    const firestoreCoords = simplifiedCoords.map(c => ({
      lng: c[0],
      lat: c[1]
    }));

    // Update Firestore
    await docSnap.ref.update({
      'routeGeometry.coordinates': firestoreCoords,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  const totalReduction = Math.round((1 - totalAfter / totalBefore) * 100);
  console.log('\n-------------------');
  console.log(`Total: ${totalBefore} → ${totalAfter} points (${totalReduction}% reduction)`);
  console.log(`Estimated size: ~${Math.round(totalBefore * 50 / 1024)}KB → ~${Math.round(totalAfter * 50 / 1024)}KB`);
  console.log('\n✅ All routes simplified!');

  process.exit(0);
}

simplifyRoutes().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
