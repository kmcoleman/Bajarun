/**
 * Generate a professional HTML itinerary document
 * Run: node functions/generate-itinerary-pdf.cjs
 * Then open the generated HTML file and print to PDF
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function generateItinerary() {
  console.log('Fetching itinerary data from Firestore...\n');

  // Fetch routes
  const routesSnapshot = await db
    .collection('events')
    .doc('bajarun2026')
    .collection('routes')
    .orderBy('day')
    .get();

  const routes = routesSnapshot.docs.map(doc => doc.data());

  // Fetch pricing/accommodation data
  const pricingDoc = await db.collection('eventConfig').doc('pricing').get();
  const pricingData = pricingDoc.exists ? pricingDoc.data() : {};
  const nights = pricingData.nights || {};

  // Calculate totals
  const totalMiles = routes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0);
  const ridingDays = routes.filter(r => r.estimatedDistance > 0).length;

  console.log(`Found ${routes.length} days, ${Math.round(totalMiles)} miles total\n`);

  // Generate HTML
  const html = generateHTML(routes, nights, totalMiles, ridingDays);

  // Write to file
  const outputPath = path.join(__dirname, '..', 'docs', 'baja-itinerary-2026.html');
  fs.writeFileSync(outputPath, html);
  console.log(`\nGenerated: ${outputPath}`);
  console.log('Open this file in a browser and use Print > Save as PDF');

  process.exit(0);
}

function generateHTML(routes, nights, totalMiles, ridingDays) {
  const startDate = routes[0]?.date || 'March 19, 2026';
  const endDate = routes[routes.length - 1]?.date || 'March 27, 2026';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baja California Adventure 2026 - Itinerary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
      background: white;
    }

    /* Print styles */
    @media print {
      body {
        font-size: 10pt;
      }

      .no-print {
        display: none !important;
      }

      .day-section {
        page-break-inside: avoid;
        page-break-before: always;
      }

      .day-section:first-of-type {
        page-break-before: auto;
      }

      .cover-page {
        page-break-after: always;
      }

      .summary-page {
        page-break-after: always;
      }
    }

    /* Cover Page */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: white;
    }

    .cover-logo {
      width: 120px;
      height: 120px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      font-size: 3rem;
    }

    .cover-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .cover-subtitle {
      font-size: 1.5rem;
      font-weight: 500;
      color: #60a5fa;
      margin-bottom: 2rem;
    }

    .cover-dates {
      font-size: 1.25rem;
      color: #94a3b8;
      margin-bottom: 3rem;
    }

    .cover-stats {
      display: flex;
      gap: 3rem;
      margin-top: 2rem;
    }

    .cover-stat {
      text-align: center;
    }

    .cover-stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #3b82f6;
    }

    .cover-stat-label {
      font-size: 0.875rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .cover-footer {
      margin-top: 4rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    /* Summary Page */
    .summary-page {
      padding: 2rem;
      min-height: 100vh;
    }

    .summary-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #3b82f6;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }

    .summary-table th {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }

    .summary-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-table tr:hover {
      background: #f8fafc;
    }

    .day-badge {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .rest-badge {
      background: #f59e0b;
    }

    /* Day Sections */
    .day-section {
      padding: 2rem;
      min-height: auto;
    }

    .day-header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .day-number {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .day-number-label {
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.8;
    }

    .day-number-value {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .day-info {
      flex: 1;
    }

    .day-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .day-date {
      color: #64748b;
      font-size: 0.875rem;
    }

    .day-rest-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }

    .stat-icon {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Route Info */
    .route-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .route-point {
      flex: 1;
    }

    .route-label {
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #3b82f6;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .route-name {
      font-weight: 600;
      color: #1e293b;
    }

    .route-arrow {
      color: #3b82f6;
      font-size: 1.5rem;
    }

    /* Description */
    .description {
      margin-bottom: 1.5rem;
    }

    .description-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .description-text {
      color: #334155;
      line-height: 1.7;
    }

    .description-text p {
      margin-bottom: 0.75rem;
    }

    .description-text ul, .description-text ol {
      margin-left: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .description-text li {
      margin-bottom: 0.25rem;
    }

    .description-text strong {
      color: #1e293b;
    }

    /* Accommodation */
    .accommodation {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .accommodation-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #166534;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .accommodation-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .accommodation-details {
      font-size: 0.875rem;
      color: #475569;
    }

    .accommodation-details a {
      color: #2563eb;
      text-decoration: none;
    }

    .accommodation-section {
      margin-bottom: 0.75rem;
    }

    .accommodation-section:last-child {
      margin-bottom: 0;
    }

    .accommodation-label {
      font-size: 0.75rem;
      color: #059669;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    /* Highlights */
    .highlights {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 8px;
      padding: 1rem;
    }

    .highlights-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #854d0e;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .highlights-list {
      list-style: none;
    }

    .highlights-list li {
      position: relative;
      padding-left: 1.25rem;
      margin-bottom: 0.5rem;
      color: #422006;
    }

    .highlights-list li::before {
      content: "★";
      position: absolute;
      left: 0;
      color: #eab308;
    }

    /* Footer */
    .page-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">🏍️</div>
    <h1 class="cover-title">Baja California Adventure</h1>
    <p class="cover-subtitle">2026 Itinerary</p>
    <p class="cover-dates">${startDate} – ${endDate}</p>

    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-value">${Math.round(totalMiles).toLocaleString()}</div>
        <div class="cover-stat-label">Total Miles</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-value">${routes.length}</div>
        <div class="cover-stat-label">Days</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-value">${ridingDays}</div>
        <div class="cover-stat-label">Riding Days</div>
      </div>
    </div>

    <div class="cover-footer">
      <p>NorCal Moto Adventure</p>
      <p>Temecula, CA → Death Valley via Baja Peninsula</p>
    </div>
  </div>

  <!-- Summary Page -->
  <div class="summary-page">
    <h2 class="summary-title">Trip Overview</h2>

    <table class="summary-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Date</th>
          <th>Route</th>
          <th>Distance</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${routes.map(route => {
          const isRest = !route.estimatedDistance || route.estimatedDistance === 0;
          return `
        <tr>
          <td><span class="day-badge ${isRest ? 'rest-badge' : ''}">Day ${route.day}</span></td>
          <td>${route.date || ''}</td>
          <td>${route.title || `${route.startName} to ${route.endName}`}</td>
          <td>${isRest ? 'Rest Day' : `${Math.round(route.estimatedDistance || 0)} mi`}</td>
          <td>${isRest ? '—' : (route.estimatedTime || '—')}</td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="page-footer">
      Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <!-- Day Sections -->
  ${routes.map(route => {
    const nightKey = `night-${route.day}`;
    const night = nights[nightKey] || {};
    const isRest = !route.estimatedDistance || route.estimatedDistance === 0;
    const description = route.rideSummary || route.description || '';

    return `
  <div class="day-section">
    <div class="day-header">
      <div class="day-number">
        <span class="day-number-label">Day</span>
        <span class="day-number-value">${route.day}</span>
      </div>
      <div class="day-info">
        <h2 class="day-title">
          ${route.title || `${route.startName} to ${route.endName}`}
          ${isRest ? '<span class="day-rest-badge">Rest Day</span>' : ''}
        </h2>
        <p class="day-date">${route.date || ''}</p>
      </div>
    </div>

    ${!isRest ? `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📍</div>
        <div class="stat-value">${Math.round(route.estimatedDistance || 0)} mi</div>
        <div class="stat-label">Distance</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">${route.estimatedTime || '—'}</div>
        <div class="stat-label">Riding Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏨</div>
        <div class="stat-value">${night.hotelName ? 'Hotel' : ''}${night.hotelName && night.campingAvailable ? ' / ' : ''}${night.campingAvailable ? 'Camping' : ''}</div>
        <div class="stat-label">Accommodation</div>
      </div>
    </div>

    <div class="route-info">
      <div class="route-point">
        <div class="route-label">From</div>
        <div class="route-name">${route.startName || '—'}</div>
      </div>
      <div class="route-arrow">→</div>
      <div class="route-point">
        <div class="route-label">To</div>
        <div class="route-name">${route.endName || '—'}</div>
      </div>
    </div>
    ` : ''}

    ${description ? `
    <div class="description">
      <h3 class="description-title">About This Day</h3>
      <div class="description-text">
        ${formatMarkdown(description)}
      </div>
    </div>
    ` : ''}

    ${(night.hotelName || night.campingName) ? `
    <div class="accommodation">
      <h3 class="accommodation-title">🏨 Accommodation</h3>

      ${night.hotelName ? `
      <div class="accommodation-section">
        <div class="accommodation-label">Hotel Option</div>
        <div class="accommodation-name">${night.hotelName}</div>
        <div class="accommodation-details">
          ${night.hotelAddress ? `<div>${night.hotelAddress}</div>` : ''}
          ${night.hotelPhone ? `<div>Phone: ${night.hotelPhone}</div>` : ''}
          ${night.hotelDescription ? `<div>${night.hotelDescription}</div>` : ''}
        </div>
      </div>
      ` : ''}

      ${night.campingName ? `
      <div class="accommodation-section">
        <div class="accommodation-label">Camping Option</div>
        <div class="accommodation-name">${night.campingName}</div>
        ${night.campingDescription ? `<div class="accommodation-details">${night.campingDescription}</div>` : ''}
      </div>
      ` : ''}
    </div>
    ` : ''}

    ${night.highlights && night.highlights.length > 0 ? `
    <div class="highlights">
      <h3 class="highlights-title">⭐ Highlights</h3>
      <ul class="highlights-list">
        ${night.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>`;
  }).join('')}

</body>
</html>`;
}

// Simple markdown to HTML converter
function formatMarkdown(text) {
  if (!text) return '';

  return text
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive list items in ul
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs (lines with content)
    .replace(/^(?!<[hulo])(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    // Line breaks
    .replace(/\n\n/g, '')
    .replace(/\n/g, '');
}

generateItinerary().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
