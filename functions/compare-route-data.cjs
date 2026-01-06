/**
 * Compare route data between collections to determine which has more complete data
 *
 * Compares:
 * - events/bajarun2026/routes/day{N} (new single source of truth)
 * - eventConfig/pricing.nights.night-{N} (old location)
 *
 * Run: node scripts/compare-route-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function comparePOIs() {
  console.log('='.repeat(100));
  console.log('POI COMPARISON BY DAY');
  console.log('='.repeat(100));
  console.log();

  // Fetch from events/bajarun2026/routes
  const routesSnapshot = await db.collection('events').doc('bajarun2026').collection('routes').get();
  const routesData = {};
  routesSnapshot.forEach(doc => {
    routesData[doc.id] = doc.data();
  });

  // Fetch from eventConfig/pricing
  const pricingDoc = await db.collection('eventConfig').doc('pricing').get();
  const pricingData = pricingDoc.exists ? pricingDoc.data() : {};
  const nightsData = pricingData.nights || {};

  for (let day = 1; day <= 9; day++) {
    const route = routesData[`day${day}`] || {};
    const night = nightsData[`night-${day}`] || {};
    const nightRouteConfig = night.routeConfig || {};

    // Get POIs from both sources
    const routePois = route.pois || [];
    const pricingPois = nightRouteConfig.pois || night.pointsOfInterest || [];

    console.log(`\n${'═'.repeat(100)}`);
    console.log(`DAY ${day}: ${route.title || night.dayTitle || '(no title)'}`);
    console.log('═'.repeat(100));

    console.log('\n┌' + '─'.repeat(48) + '┬' + '─'.repeat(49) + '┐');
    console.log('│' + ' ROUTES COLLECTION'.padEnd(48) + '│' + ' EVENTCONFIG/PRICING'.padEnd(49) + '│');
    console.log('├' + '─'.repeat(48) + '┼' + '─'.repeat(49) + '┤');

    const maxRows = Math.max(routePois.length, pricingPois.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const routePoi = routePois[i];
      const pricingPoi = pricingPois[i];

      let routeCell = '';
      let pricingCell = '';

      if (routePoi) {
        if (typeof routePoi === 'string') {
          routeCell = routePoi;
        } else {
          const cat = routePoi.category ? `[${routePoi.category}]` : '';
          routeCell = `${cat} ${routePoi.name || ''}`.trim();
        }
      }

      if (pricingPoi) {
        if (typeof pricingPoi === 'string') {
          pricingCell = pricingPoi;
        } else {
          const cat = pricingPoi.category ? `[${pricingPoi.category}]` : '';
          pricingCell = `${cat} ${pricingPoi.name || ''}`.trim();
        }
      }

      // Truncate if too long
      if (routeCell.length > 46) routeCell = routeCell.substring(0, 43) + '...';
      if (pricingCell.length > 47) pricingCell = pricingCell.substring(0, 44) + '...';

      console.log('│ ' + routeCell.padEnd(47) + '│ ' + pricingCell.padEnd(48) + '│');
    }

    if (maxRows === 0) {
      console.log('│ ' + '(no POIs)'.padEnd(47) + '│ ' + '(no POIs)'.padEnd(48) + '│');
    }

    console.log('└' + '─'.repeat(48) + '┴' + '─'.repeat(49) + '┘');
    console.log(`  Count: ${routePois.length} POIs`.padEnd(50) + `Count: ${pricingPois.length} POIs`);
  }

  console.log('\n');
  process.exit(0);
}

async function compareData() {
  console.log('='.repeat(80));
  console.log('ROUTE DATA COMPARISON');
  console.log('='.repeat(80));
  console.log();

  // Fetch from events/bajarun2026/routes
  console.log('Fetching from events/bajarun2026/routes...');
  const routesSnapshot = await db.collection('events').doc('bajarun2026').collection('routes').get();
  const routesData = {};
  routesSnapshot.forEach(doc => {
    routesData[doc.id] = doc.data();
  });
  console.log(`  Found ${Object.keys(routesData).length} documents\n`);

  // Fetch from eventConfig/pricing
  console.log('Fetching from eventConfig/pricing...');
  const pricingDoc = await db.collection('eventConfig').doc('pricing').get();
  const pricingData = pricingDoc.exists ? pricingDoc.data() : {};
  const nightsData = pricingData.nights || {};
  console.log(`  Found ${Object.keys(nightsData).length} nights configured\n`);

  // Compare each day
  console.log('='.repeat(80));
  console.log('DETAILED COMPARISON BY DAY');
  console.log('='.repeat(80));

  for (let day = 1; day <= 9; day++) {
    const routeKey = `day${day}`;
    const nightKey = `night-${day}`;

    const route = routesData[routeKey] || {};
    const night = nightsData[nightKey] || {};
    const nightRouteConfig = night.routeConfig || {};

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`DAY ${day}`);
    console.log('─'.repeat(80));

    // Helper to check field
    const checkField = (label, routeVal, nightVal) => {
      const routeHas = routeVal !== undefined && routeVal !== null && routeVal !== '';
      const nightHas = nightVal !== undefined && nightVal !== null && nightVal !== '';

      let routeDisplay = routeHas ? '✓' : '✗';
      let nightDisplay = nightHas ? '✓' : '✗';

      // Show preview for strings
      if (routeHas && typeof routeVal === 'string') {
        routeDisplay += ` "${routeVal.substring(0, 30)}${routeVal.length > 30 ? '...' : ''}"`;
      }
      if (nightHas && typeof nightVal === 'string') {
        nightDisplay += ` "${nightVal.substring(0, 30)}${nightVal.length > 30 ? '...' : ''}"`;
      }

      // Show count for arrays
      if (routeHas && Array.isArray(routeVal)) {
        routeDisplay += ` (${routeVal.length} items)`;
      }
      if (nightHas && Array.isArray(nightVal)) {
        nightDisplay += ` (${nightVal.length} items)`;
      }

      // Show preview for coordinates
      if (routeHas && typeof routeVal === 'object' && routeVal.lat !== undefined) {
        routeDisplay += ` (${routeVal.lat.toFixed(4)}, ${routeVal.lng.toFixed(4)})`;
      }
      if (nightHas && typeof nightVal === 'object' && nightVal.lat !== undefined) {
        nightDisplay += ` (${nightVal.lat.toFixed(4)}, ${nightVal.lng.toFixed(4)})`;
      }

      console.log(`  ${label.padEnd(25)} | Routes: ${routeDisplay.padEnd(40)} | Pricing: ${nightDisplay}`);
    };

    // Route/Itinerary fields
    console.log('\n  ROUTE DATA:');
    checkField('title', route.title, night.dayTitle || nightRouteConfig.title);
    checkField('description', route.description, night.dayDescription || nightRouteConfig.description);
    checkField('date', route.date, nightRouteConfig.date);
    checkField('startName', route.startName, nightRouteConfig.startName);
    checkField('endName', route.endName, nightRouteConfig.endName);
    checkField('startCoordinates', route.startCoordinates, nightRouteConfig.startCoordinates);
    checkField('endCoordinates', route.endCoordinates, nightRouteConfig.endCoordinates);
    checkField('waypoints', route.waypoints, nightRouteConfig.waypoints);
    checkField('pois', route.pois, nightRouteConfig.pois || night.pointsOfInterest);
    checkField('estimatedDistance', route.estimatedDistance, nightRouteConfig.estimatedDistance);
    checkField('estimatedTime', route.estimatedTime, nightRouteConfig.estimatedTime);
    checkField('routeGeometry', route.routeGeometry, nightRouteConfig.routeGeometry);
    checkField('accommodation', route.accommodation, nightRouteConfig.accommodation);
    checkField('accommodationType', route.accommodationType, nightRouteConfig.accommodationType);

    // Accommodation/Pricing fields (should stay in eventConfig/pricing)
    console.log('\n  ACCOMMODATION/PRICING DATA (stays in eventConfig/pricing):');
    console.log(`  ${'hotelName'.padEnd(25)} | ${night.hotelName || '(not set)'}`);
    console.log(`  ${'hotelAddress'.padEnd(25)} | ${night.hotelAddress || '(not set)'}`);
    console.log(`  ${'hotelCost'.padEnd(25)} | ${night.hotelCost !== undefined ? '$' + night.hotelCost : '(not set)'}`);
    console.log(`  ${'campingName'.padEnd(25)} | ${night.campingName || '(not set)'}`);
    console.log(`  ${'campingCost'.padEnd(25)} | ${night.campingCost !== undefined ? '$' + night.campingCost : '(not set)'}`);
    console.log(`  ${'dinnerCost'.padEnd(25)} | ${night.dinnerCost !== undefined ? '$' + night.dinnerCost : '(not set)'}`);
    console.log(`  ${'breakfastCost'.padEnd(25)} | ${night.breakfastCost !== undefined ? '$' + night.breakfastCost : '(not set)'}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  let routesComplete = 0;
  let pricingComplete = 0;

  for (let day = 1; day <= 9; day++) {
    const route = routesData[`day${day}`] || {};
    const night = nightsData[`night-${day}`] || {};
    const nightRouteConfig = night.routeConfig || {};

    // Check if routes collection has essential fields
    const routeHasEssentials = route.title && route.startCoordinates && route.endCoordinates;
    // Check if pricing collection has route data
    const pricingHasRouteData = (night.dayTitle || nightRouteConfig.title) &&
                                 (nightRouteConfig.startCoordinates || night.routeConfig);

    if (routeHasEssentials) routesComplete++;
    if (pricingHasRouteData) pricingComplete++;
  }

  console.log(`\nevents/bajarun2026/routes: ${routesComplete}/9 days with essential route data`);
  console.log(`eventConfig/pricing: ${pricingComplete}/9 nights with route data\n`);

  if (routesComplete >= pricingComplete) {
    console.log('RECOMMENDATION: Routes collection appears to be the more complete source.');
    console.log('You can safely remove redundant route fields from eventConfig/pricing.');
  } else {
    console.log('RECOMMENDATION: Pricing collection has more route data.');
    console.log('Consider migrating route data from eventConfig/pricing to routes collection first.');
  }

  console.log();
  process.exit(0);
}

// Run POI comparison (change to compareData() for full comparison)
comparePOIs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
