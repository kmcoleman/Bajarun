/**
 * Generate HTML report of POIs in pricing that are NOT in routes
 * Run: node generate-poi-report.cjs
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Normalize POI name for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
}

// Check if a POI name exists in a list
function poiExistsInList(poiName, poiList) {
  const normalized = normalizeName(poiName);
  return poiList.some(p => {
    const otherName = typeof p === 'string' ? p : p.name;
    return normalizeName(otherName).includes(normalized) ||
           normalized.includes(normalizeName(otherName));
  });
}

// Check if POI is a real POI (has coordinates or category) vs a highlight description
function isRealPOI(poi) {
  if (typeof poi === 'string') {
    return false; // Plain strings are highlights, not POIs
  }
  // Has coordinates or a category = real POI
  return (poi.coordinates && poi.coordinates.lat && poi.coordinates.lng) || poi.category;
}

async function generateReport() {
  console.log('Fetching data...');

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

  let html = `<!DOCTYPE html>
<html>
<head>
  <title>POI Migration Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 40px; }
    .day-section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .day-title { font-size: 1.3em; color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0066cc; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:hover { background: #f8f8f8; }
    .routes-col { width: 45%; }
    .pricing-col { width: 45%; }
    .unique-col { width: 10%; text-align: center; }
    .poi-item { margin: 4px 0; padding: 6px 10px; border-radius: 4px; font-size: 0.9em; }
    .poi-gas { background: #fff3cd; }
    .poi-restaurant { background: #ffe5d0; }
    .poi-viewpoint { background: #d4edda; }
    .poi-photo { background: #e2d5f1; }
    .poi-poi { background: #cce5ff; }
    .poi-border { background: #f8d7da; }
    .poi-emergency { background: #f8d7da; }
    .highlight { background: #f0f0f0; color: #888; font-style: italic; }
    .migrate-yes { color: #28a745; font-weight: bold; font-size: 1.2em; }
    .migrate-no { color: #6c757d; }
    .migrate-skip { color: #aaa; font-size: 0.8em; }
    .category { font-weight: bold; color: #666; font-size: 0.8em; }
    .summary { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #28a745; }
    .legend { display: flex; gap: 15px; flex-wrap: wrap; margin: 20px 0; }
    .legend-item { padding: 5px 10px; border-radius: 4px; font-size: 0.85em; }
    .no-migration { background: #f8f9fa; padding: 10px; border-radius: 4px; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>POI Migration Report</h1>
  <p>This report shows <strong>actual POIs</strong> (with coordinates/categories) from <strong>eventConfig/pricing</strong> that should be migrated to <strong>events/bajarun2026/routes</strong>.</p>
  <p><em>Note: Descriptive highlights (plain text without coordinates) are NOT considered POIs and are shown greyed out.</em></p>

  <div class="legend">
    <span class="legend-item poi-gas">[gas] Gas Station</span>
    <span class="legend-item poi-restaurant">[restaurant] Restaurant</span>
    <span class="legend-item poi-viewpoint">[viewpoint] Viewpoint</span>
    <span class="legend-item poi-photo">[photo] Photo Op</span>
    <span class="legend-item poi-poi">[poi] Point of Interest</span>
    <span class="legend-item poi-border">[border] Border Crossing</span>
    <span class="legend-item highlight">Highlight (not a POI)</span>
  </div>
`;

  let totalUnique = 0;
  const uniqueByDay = {};

  for (let day = 1; day <= 9; day++) {
    const route = routesData[`day${day}`] || {};
    const night = nightsData[`night-${day}`] || {};
    const nightRouteConfig = night.routeConfig || {};

    const routePois = route.pois || [];
    const pricingPois = nightRouteConfig.pois || night.pointsOfInterest || [];

    const title = route.title || night.dayTitle || '(no title)';

    // Find unique REAL POIs in pricing that don't exist in routes
    // (Highlights/descriptions are not considered for migration)
    const uniqueInPricing = [];
    pricingPois.forEach(poi => {
      if (!isRealPOI(poi)) return; // Skip highlights
      const poiName = poi.name;
      if (!poiExistsInList(poiName, routePois)) {
        uniqueInPricing.push(poi);
      }
    });

    uniqueByDay[day] = uniqueInPricing;
    totalUnique += uniqueInPricing.length;

    // Count highlights vs real POIs in pricing
    const pricingRealPois = pricingPois.filter(p => isRealPOI(p));
    const pricingHighlights = pricingPois.filter(p => !isRealPOI(p));

    html += `
  <div class="day-section">
    <div class="day-title">Day ${day}: ${title}</div>
    <table>
      <tr>
        <th class="routes-col">Routes Collection (${routePois.length} POIs)</th>
        <th class="pricing-col">Pricing Collection (${pricingRealPois.length} POIs + ${pricingHighlights.length} highlights)</th>
        <th class="unique-col">Migrate?</th>
      </tr>
`;

    const maxRows = Math.max(routePois.length, pricingPois.length, 1);

    for (let i = 0; i < maxRows; i++) {
      const routePoi = routePois[i];
      const pricingPoi = pricingPois[i];

      let routeCell = '';
      let pricingCell = '';
      let migrateCell = '';

      if (routePoi) {
        const name = typeof routePoi === 'string' ? routePoi : routePoi.name;
        const cat = typeof routePoi === 'object' && routePoi.category ? routePoi.category : 'poi';
        routeCell = `<div class="poi-item poi-${cat}"><span class="category">[${cat}]</span> ${name}</div>`;
      }

      if (pricingPoi) {
        const name = typeof pricingPoi === 'string' ? pricingPoi : pricingPoi.name;
        const isReal = isRealPOI(pricingPoi);

        if (isReal) {
          // Real POI with category
          const cat = pricingPoi.category || 'poi';
          pricingCell = `<div class="poi-item poi-${cat}"><span class="category">[${cat}]</span> ${name}</div>`;

          // Check if this real POI is unique (not in routes)
          const isUnique = !poiExistsInList(name, routePois);
          migrateCell = isUnique ? '<span class="migrate-yes">YES</span>' : '<span class="migrate-no">exists</span>';
        } else {
          // Highlight (not a real POI)
          pricingCell = `<div class="poi-item highlight">${name}</div>`;
          migrateCell = '<span class="migrate-skip">highlight</span>';
        }
      }

      html += `
      <tr>
        <td>${routeCell}</td>
        <td>${pricingCell}</td>
        <td>${migrateCell}</td>
      </tr>`;
    }

    if (maxRows === 0) {
      html += `
      <tr>
        <td><em>No POIs</em></td>
        <td><em>No POIs</em></td>
        <td></td>
      </tr>`;
    }

    html += `
    </table>
  </div>
`;
  }

  // Summary section
  html += `
  <div class="summary">
    <h2>Summary: Real POIs to Migrate</h2>
`;

  if (totalUnique === 0) {
    html += `<p>No real POIs need to be migrated. All POIs with coordinates/categories already exist in routes.</p>`;
  } else {
    html += `<p><strong>${totalUnique}</strong> real POI(s) in pricing should be migrated to routes:</p>
    <ul>
`;
    for (let day = 1; day <= 9; day++) {
      const unique = uniqueByDay[day];
      if (unique.length > 0) {
        html += `      <li><strong>Day ${day}:</strong> ${unique.length} POI(s)<ul>`;
        unique.forEach(poi => {
          const cat = poi.category ? `[${poi.category}]` : '';
          html += `<li>${cat} ${poi.name}</li>`;
        });
        html += `</ul></li>\n`;
      }
    }
    html += `    </ul>`;
  }

  html += `
  </div>
</body>
</html>`;

  // Write HTML file
  const outputPath = path.join(__dirname, '..', 'poi-migration-report.html');
  fs.writeFileSync(outputPath, html);
  console.log(`\nReport generated: ${outputPath}`);
  console.log(`Open in browser: file://${outputPath}`);

  // Also print summary to console
  console.log(`\n${'='.repeat(60)}`);
  console.log('REAL POIs TO MIGRATE (not highlights):');
  console.log('='.repeat(60));

  if (totalUnique === 0) {
    console.log('\nNo real POIs need migration!');
    console.log('All POIs with coordinates/categories already exist in routes.');
  } else {
    for (let day = 1; day <= 9; day++) {
      const unique = uniqueByDay[day];
      if (unique.length > 0) {
        console.log(`\nDay ${day}: (${unique.length} to migrate)`);
        unique.forEach(poi => {
          const cat = poi.category ? `[${poi.category}]` : '[poi]';
          console.log(`  ${cat} ${poi.name}`);
        });
      }
    }
    console.log(`\nTotal: ${totalUnique} real POIs to migrate`);
  }

  process.exit(0);
}

generateReport().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
