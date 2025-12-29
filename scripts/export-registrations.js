/**
 * export-registrations.js
 *
 * Exports all registration data from production Firestore to CSV.
 *
 * Usage: node scripts/export-registrations.js
 */

import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../functions/service-account-key.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to format experience values
function formatExperience(key, value) {
  const mappings = {
    yearsRiding: {
      'less1': 'Less than 1 year',
      '1to5': '1-5 years',
      '5to10': '5-10 years',
      '10plus': '10+ years'
    },
    offRoadExperience: {
      'none': 'None',
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    },
    bajaTourExperience: {
      'no': 'First time',
      'once': 'Once before',
      'twice': 'Twice before',
      'many': 'Many times'
    },
    repairExperience: {
      'none': 'None',
      'basic': 'Basic',
      'comfortable': 'Comfortable',
      'macgyver': 'MacGyver level'
    },
    spanishLevel: {
      'gringo': 'Gringo - No Spanish',
      'read': 'Can read a bit',
      'simple': 'Simple conversations',
      'fluent': 'Fluent'
    }
  };

  return mappings[key]?.[value] || value || '';
}

async function exportRegistrations() {
  console.log('Fetching registrations from production Firestore...');

  try {
    // Fetch all registrations
    const registrationsSnap = await db.collection('registrations').get();
    const registrations = [];

    registrationsSnap.forEach(doc => {
      registrations.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${registrations.length} registrations`);

    // Fetch user preferences for each registration
    const fullData = [];

    for (const reg of registrations) {
      const uid = reg.uid || reg.id;
      let userPrefs = {};

      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          userPrefs = userDoc.data();
        }
      } catch (e) {
        console.log(`  Could not fetch preferences for ${reg.fullName}`);
      }

      fullData.push({
        ...reg,
        preferences: userPrefs
      });

      console.log(`  Loaded: ${reg.fullName}`);
    }

    // Build CSV
    const headers = [
      'Full Name',
      'Nickname',
      'Tagline',
      'Email',
      'City',
      'State',
      'ZIP',
      'Phone',
      'Emergency Name',
      'Emergency Phone',
      'Emergency Relation',
      'Medical Conditions',
      'Bike Model',
      'Bike Year',
      'Years Riding',
      'Off-Road Exp',
      'Baja Exp',
      'Repair Exp',
      'Has Pillion',
      'Pillion Name',
      'Pillion Phone',
      'Pillion Email',
      'Spanish Level',
      'Passport Valid',
      'T-Shirt Size',
      'Garmin InReach',
      'Toolkit',
      'Skill Mechanical',
      'Skill Medical',
      'Skill Photography',
      'Skill Other',
      'Preferred Roommate',
      'Dietary Restrictions',
      'Night 1 Accom',
      'Night 2 Accom',
      'Night 3 Accom',
      'Night 4 Accom',
      'Night 5 Accom',
      'Night 6 Accom',
      'Night 7 Accom',
      'Night 8 Accom',
      'Deposit Required',
      'Amount Collected'
    ];

    const rows = fullData.map(data => {
      const prefs = data.preferences || {};
      const selections = prefs.accommodationSelections || {};

      return [
        data.fullName || '',
        data.nickname || '',
        data.tagline || '',
        data.email || '',
        data.city || '',
        data.state || '',
        data.zipCode || '',
        data.phone || '',
        data.emergencyName || '',
        data.emergencyPhone || '',
        data.emergencyRelation || '',
        data.medicalConditions || '',
        data.bikeModel || '',
        data.bikeYear || '',
        formatExperience('yearsRiding', data.yearsRiding),
        formatExperience('offRoadExperience', data.offRoadExperience),
        formatExperience('bajaTourExperience', data.bajaTourExperience),
        formatExperience('repairExperience', data.repairExperience),
        data.hasPillion ? 'Yes' : 'No',
        data.pillionName || '',
        data.pillionPhone || '',
        data.pillionEmail || '',
        formatExperience('spanishLevel', data.spanishLevel),
        data.passportValid ? 'Yes' : 'No',
        data.tshirtSize || '',
        data.hasGarminInreach ? 'Yes' : 'No',
        data.hasToolkit ? 'Yes' : 'No',
        data.skillMechanical ? 'Yes' : 'No',
        data.skillMedical ? 'Yes' : 'No',
        data.skillPhotography ? 'Yes' : 'No',
        data.skillOther ? data.skillOtherText || 'Yes' : 'No',
        prefs.preferredRoommate || '',
        prefs.dietaryRestrictions || '',
        selections['night-1']?.accommodation || '',
        selections['night-2']?.accommodation || '',
        selections['night-3']?.accommodation || '',
        selections['night-4']?.accommodation || '',
        selections['night-5']?.accommodation || '',
        selections['night-6']?.accommodation || '',
        selections['night-7']?.accommodation || '',
        selections['night-8']?.accommodation || '',
        data.depositRequired || '',
        data.amtCollected || 0
      ].map(escapeCSV);
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const filename = `registrations-export-${new Date().toISOString().split('T')[0]}.csv`;
    writeFileSync(filename, csv);

    console.log(`\nExported to: ${filename}`);
    console.log(`Total registrations: ${fullData.length}`);

    process.exit(0);

  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportRegistrations();
