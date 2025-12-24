/**
 * Rider Demographics Query Script
 *
 * Run with: node rider-demographics.js
 * Outputs: rider-demographics.html (infographic)
 *
 * Requires: Firebase Admin SDK credentials
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Initialize Firebase Admin
const keyPaths = [
  path.join(__dirname, 'service-account-key.json'),
  path.join(__dirname, '../service-account-key.json'),
];

let serviceAccount = null;
for (const keyPath of keyPaths) {
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
    console.log(`Using service account from: ${keyPath}`);
    break;
  }
}

if (!serviceAccount) {
  console.error(`
❌ Service account key not found!

To get one:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the file as 'service-account-key.json' in the functions folder

`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'bajarun-2026'
});

const db = admin.firestore();

async function getRiderDemographics() {
  console.log('Fetching rider data...');

  const snapshot = await db.collection('registrations').get();
  const riders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Calculate all stats
  const stats = {
    total: riders.length,
    withPillion: riders.filter(r => r.hasPillion === true),
    hasGarmin: riders.filter(r => r.hasGarminInreach === true).length,
    hasToolkit: riders.filter(r => r.hasToolkit === true).length,
    skillMechanical: riders.filter(r => r.skillMechanical === true),
    skillMedical: riders.filter(r => r.skillMedical === true),
    skillPhotography: riders.filter(r => r.skillPhotography === true),
    skillOther: riders.filter(r => r.skillOther === true && r.skillOtherText),
    repairExperience: { none: 0, basic: 0, comfortable: 0, macgyver: 0 },
    spanishLevel: { gringo: 0, read: 0, simple: 0, fluent: 0 },
    yearsRiding: { less1: 0, '1to5': 0, '5to10': 0, '10plus': 0 },
    offRoad: { none: 0, beginner: 0, intermediate: 0, advanced: 0 },
    bajaExperience: { no: 0, once: 0, twice: 0, many: 0 },
    accommodation: { camping: 0, hotels: 0, either: 0 },
    groupPlan: { yes: 0, no: 0 },
    tshirtSizes: {},
  };

  riders.forEach(r => {
    if (r.repairExperience && stats.repairExperience.hasOwnProperty(r.repairExperience)) {
      stats.repairExperience[r.repairExperience]++;
    }
    if (r.spanishLevel && stats.spanishLevel.hasOwnProperty(r.spanishLevel)) {
      stats.spanishLevel[r.spanishLevel]++;
    }
    if (r.yearsRiding && stats.yearsRiding.hasOwnProperty(r.yearsRiding)) {
      stats.yearsRiding[r.yearsRiding]++;
    }
    if (r.offRoadExperience && stats.offRoad.hasOwnProperty(r.offRoadExperience)) {
      stats.offRoad[r.offRoadExperience]++;
    }
    if (r.bajaTourExperience && stats.bajaExperience.hasOwnProperty(r.bajaTourExperience)) {
      stats.bajaExperience[r.bajaTourExperience]++;
    }
    if (r.accommodationPreference && stats.accommodation.hasOwnProperty(r.accommodationPreference)) {
      stats.accommodation[r.accommodationPreference]++;
    }
    if (r.participateGroup === true) stats.groupPlan.yes++;
    if (r.participateGroup === false) stats.groupPlan.no++;
    if (r.tshirtSize) {
      stats.tshirtSizes[r.tshirtSize] = (stats.tshirtSizes[r.tshirtSize] || 0) + 1;
    }
  });

  // Generate HTML
  const html = generateHTML(stats, riders);

  const htmlPath = path.join(__dirname, 'rider-demographics.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`\n✅ HTML saved to: ${htmlPath}`);

  // Generate PDF
  console.log('Generating PDF...');
  const pdfPath = path.join(__dirname, 'rider-demographics.pdf');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport to landscape proportions
  await page.setViewport({ width: 1100, height: 850 });

  // Load the HTML file
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // Generate PDF - 8.5x11 landscape
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    landscape: true,
    printBackground: true,
    margin: { top: '0.1in', right: '0.6in', bottom: '0.1in', left: '0.6in' },
    scale: 0.9, // Fill more space
  });

  await browser.close();

  console.log(`✅ PDF saved to: ${pdfPath}\n`);

  process.exit(0);
}

function generateHTML(stats, riders) {
  const timestamp = new Date().toLocaleString();

  // Helper to create bar chart
  const barChart = (data, labels, colors) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return '<p class="text-slate-500 text-sm">No data</p>';

    return Object.entries(data).map(([key, value]) => {
      const pct = total > 0 ? (value / total * 100) : 0;
      const label = labels[key] || key;
      const color = colors[key] || 'bg-blue-500';
      return `
        <div class="mb-3">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-slate-300">${label}</span>
            <span class="text-white font-medium">${value} <span class="text-slate-500">(${pct.toFixed(0)}%)</span></span>
          </div>
          <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div class="${color} h-full rounded-full transition-all" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  };

  // Helper for stat card
  const statCard = (icon, label, value, color = 'blue') => `
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-${color}-600/20 rounded-lg flex items-center justify-center text-2xl">
          ${icon}
        </div>
        <div>
          <p class="text-3xl font-bold text-white">${value}</p>
          <p class="text-slate-400 text-sm">${label}</p>
        </div>
      </div>
    </div>
  `;

  // Helper for list card
  const listCard = (title, icon, items, emptyMsg = 'None') => `
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">${icon}</span>
        <h3 class="text-lg font-semibold text-white">${title}</h3>
        <span class="ml-auto bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-sm font-medium">${items.length}</span>
      </div>
      ${items.length > 0 ? `
        <ul class="space-y-2">
          ${items.map(item => `<li class="text-slate-300 text-sm flex items-center gap-2"><span class="text-blue-400">•</span>${item}</li>`).join('')}
        </ul>
      ` : `<p class="text-slate-500 text-sm">${emptyMsg}</p>`}
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rider Demographics - Baja Tour 2026</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            slate: {
              800: '#1e293b',
              900: '#0f172a',
            }
          }
        }
      }
    }
  </script>
  <style>
    body { background: linear-gradient(to bottom, #0f172a, #1e293b); }
    @media print {
      body {
        background: #0f172a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Fix gradient text for print - use solid cyan color */
      .gradient-text {
        background: none !important;
        -webkit-background-clip: unset !important;
        background-clip: unset !important;
        -webkit-text-fill-color: #06b6d4 !important;
        color: #06b6d4 !important;
      }
      /* Hero section - larger and more prominent */
      .hero-bg {
        padding-top: 0.25rem !important;
        padding-bottom: 0.25rem !important;
      }
      .hero-bg .py-16 {
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
      }
      .hero-bg img {
        width: 158px !important;
        height: 158px !important;
        margin-bottom: 0.5rem !important;
      }
      .hero-bg h1 {
        font-size: 1.8rem !important;
        margin-bottom: 0.2rem !important;
      }
      .hero-bg .text-2xl {
        font-size: 1rem !important;
        margin-top: 0.2rem !important;
      }
      /* Content - fill space */
      .max-w-7xl {
        padding: 0.35rem !important;
      }
      .gap-4 {
        gap: 0.5rem !important;
      }
      .gap-6 {
        gap: 0.5rem !important;
      }
      .mb-8 {
        margin-bottom: 0.75rem !important;
      }
      .p-6 {
        padding: 0.5rem !important;
      }
      .mb-4 {
        margin-bottom: 0.2rem !important;
      }
      .mb-3 {
        margin-bottom: 0.15rem !important;
      }
      .text-lg {
        font-size: 0.9rem !important;
      }
      .text-sm {
        font-size: 0.8rem !important;
      }
      .text-3xl {
        font-size: 1.25rem !important;
      }
      .h-3 {
        height: 0.35rem !important;
      }
      /* Page break before skills section */
      .skills-section {
        page-break-before: always;
        padding-top: 4rem;
      }
      .skills-section .text-2xl {
        font-size: 1.75rem !important;
        margin-bottom: 1.5rem !important;
      }
      .skills-section .gap-6 {
        gap: 1.25rem !important;
      }
      .skills-section .p-6 {
        padding: 1.25rem !important;
      }
      .skills-section .text-lg {
        font-size: 1.1rem !important;
      }
      .skills-section .text-sm {
        font-size: 0.95rem !important;
      }
      .skills-section .mb-8 {
        margin-bottom: 1.25rem !important;
      }
      .skills-section .space-y-2 > li {
        margin-bottom: 0.5rem !important;
      }
      /* NorCal callout - larger */
      .norcal-callout {
        padding: 0.5rem !important;
      }
      .norcal-callout .text-lg {
        font-size: 0.85rem !important;
      }
      .norcal-callout .text-sm {
        font-size: 0.75rem !important;
      }
      .norcal-callout .text-xs {
        font-size: 0.65rem !important;
      }
      /* Roster section - Page 3 */
      .roster-section {
        page-break-before: always;
        padding-top: 2rem;
      }
      .roster-section .text-2xl {
        font-size: 1.75rem !important;
        margin-bottom: 1.5rem !important;
      }
      .roster-section .p-6 {
        padding: 1rem !important;
      }
      .roster-section .p-3 {
        padding: 0.75rem !important;
      }
      .roster-section .gap-4 {
        gap: 0.75rem !important;
      }
      .roster-section .text-xs {
        font-size: 0.7rem !important;
      }
    }
    /* Skills section marker for page break */
    .skills-section {
      /* normal styles */
    }
    .roster-section {
      /* normal styles */
    }
    @keyframes gradient-shift {
      0%, 100% { background-position: 0% center; }
      50% { background-position: 100% center; }
    }
    .gradient-text {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 3s ease infinite;
    }
    .hero-bg {
      background-image: url('../public/baja-hero.png'), linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%);
      background-size: cover;
      background-position: center;
    }
  </style>
</head>
<body class="min-h-screen text-white">
  <!-- Hero Header with Background -->
  <div class="hero-bg relative">
    <div class="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900"></div>

    <!-- NorCal Moto Adventure Callout - Upper Left -->
    <div class="norcal-callout absolute top-20 left-6 z-20 border border-sky-500/30 rounded-xl p-4 bg-slate-900/80">
      <p class="text-sky-400 font-bold text-sm">Brought to you by</p>
      <p class="text-white font-bold text-lg">NorCal Moto Adventure</p>
      <p class="text-slate-300 text-xs mt-1">Northern California's Premier Organizer<br/>of Motorcycle Adventures</p>
    </div>

    <div class="relative z-10 text-center py-16 px-8">
      <img src="../public/baja2026sticker.png" alt="Baja 2026 Sticker" class="w-48 h-48 mx-auto mb-6 drop-shadow-2xl" />
      <h1 class="font-bold text-5xl md:text-7xl text-white leading-[0.95] tracking-tight mb-4">
        Baja California
        <span class="block gradient-text">Adventure 2026</span>
      </h1>
      <p class="text-2xl md:text-3xl font-semibold text-white mt-6">Tour Demographics</p>
    </div>
  </div>

  <div class="max-w-7xl mx-auto p-8">

    <!-- Key Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${statCard('👥', 'Total Riders', stats.total, 'blue')}
      ${statCard('👫', 'With Pillion', stats.withPillion.length, 'purple')}
      ${statCard('📡', 'Garmin InReach', stats.hasGarmin, 'green')}
      ${statCard('🔧', 'Has Toolkit', stats.hasToolkit, 'amber')}
    </div>

    <!-- Main Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

      <!-- Years Riding -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🏁</span> Years Riding
        </h3>
        ${barChart(stats.yearsRiding, {
          less1: 'Less than 1 year',
          '1to5': '1-5 years',
          '5to10': '5-10 years',
          '10plus': '10+ years'
        }, {
          less1: 'bg-red-500',
          '1to5': 'bg-amber-500',
          '5to10': 'bg-blue-500',
          '10plus': 'bg-green-500'
        })}
      </div>

      <!-- Off-Road Experience -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🏔️</span> Off-Road Experience
        </h3>
        ${barChart(stats.offRoad, {
          none: 'No experience',
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced'
        }, {
          none: 'bg-slate-500',
          beginner: 'bg-amber-500',
          intermediate: 'bg-blue-500',
          advanced: 'bg-green-500'
        })}
      </div>

      <!-- Repair Experience -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🔧</span> Repair Experience
        </h3>
        ${barChart(stats.repairExperience, {
          none: 'None (dealer)',
          basic: 'Basic (patch tire)',
          comfortable: 'Comfortable',
          macgyver: 'MacGyver level'
        }, {
          none: 'bg-slate-500',
          basic: 'bg-amber-500',
          comfortable: 'bg-blue-500',
          macgyver: 'bg-green-500'
        })}
      </div>

      <!-- Spanish Level -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🇲🇽</span> Spanish Level
        </h3>
        ${barChart(stats.spanishLevel, {
          gringo: 'Gringo (none)',
          read: 'Can read a bit',
          simple: 'Simple conversations',
          fluent: 'Fluent'
        }, {
          gringo: 'bg-slate-500',
          read: 'bg-amber-500',
          simple: 'bg-blue-500',
          fluent: 'bg-green-500'
        })}
      </div>

      <!-- Baja Experience -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🌵</span> Baja Tour Experience
        </h3>
        ${barChart(stats.bajaExperience, {
          no: 'First time',
          once: 'Once before',
          twice: 'Twice before',
          many: 'Many times'
        }, {
          no: 'bg-blue-500',
          once: 'bg-amber-500',
          twice: 'bg-purple-500',
          many: 'bg-green-500'
        })}
      </div>

      <!-- Accommodation Preference -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🏨</span> Accommodation Preference
        </h3>
        ${barChart(stats.accommodation, {
          camping: 'Prefer Camping',
          hotels: 'Prefer Hotels',
          either: 'Either is fine'
        }, {
          camping: 'bg-green-500',
          hotels: 'bg-purple-500',
          either: 'bg-blue-500'
        })}
      </div>

    </div>

    <!-- Skills & Lists Section - Page 2 -->
    <div class="skills-section">
      <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span>🛠️</span> Rider Skills & Capabilities
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        ${listCard('Mechanical Skills', '🔧', stats.skillMechanical.map(r => r.fullName || r.nickname || 'Unknown'))}
        ${listCard('Medical Training', '🏥', stats.skillMedical.map(r => r.fullName || r.nickname || 'Unknown'))}
        ${listCard('Photography', '📷', stats.skillPhotography.map(r => r.fullName || r.nickname || 'Unknown'))}
      </div>

      <!-- Other Skills -->
      ${stats.skillOther.length > 0 ? `
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>✨</span> Other Skills
        </h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${stats.skillOther.map(r => `
            <div class="bg-slate-900 rounded-lg p-4">
              <p class="text-white font-medium">${r.fullName || r.nickname || 'Unknown'}</p>
              <p class="text-slate-400 text-sm mt-1">"${r.skillOtherText}"</p>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Rider Roster - Page 3 -->
    <div class="roster-section">
      <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span>📋</span> Rider Roster
      </h2>
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          ${riders.sort((a, b) => {
            // Sort by last name
            const aName = a.fullName || '';
            const bName = b.fullName || '';
            const aLast = aName.split(' ').slice(-1)[0] || '';
            const bLast = bName.split(' ').slice(-1)[0] || '';
            return aLast.localeCompare(bLast);
          }).map(r => `
            <div class="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
              <p class="text-white font-medium">${r.fullName || r.nickname || 'Unknown'}</p>
              ${r.city || r.hometown ? `<p class="text-slate-400 text-xs mt-1">📍 ${r.city || r.hometown}</p>` : ''}
              ${r.bikeModel ? `<p class="text-slate-500 text-xs">🏍️ ${r.bikeModel}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Generated Timestamp - Lower Right -->
    <div class="text-right mt-8">
      <p class="text-slate-500 text-xs">Generated: ${timestamp}</p>
    </div>

  </div>
</body>
</html>`;
}

getRiderDemographics().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
