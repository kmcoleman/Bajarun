/**
 * seed-emulator.js
 *
 * Populates Firebase Emulator with test data for local development.
 *
 * Usage:
 *   1. Start emulators: npm run emulators
 *   2. Run this script: npm run seed
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

// Firebase config (same as app)
const firebaseConfig = {
  apiKey: "AIzaSyAQz1vuHv_dvf30dsWYY8Ox0-5QLtrK26I",
  authDomain: "bajarun-2026.firebaseapp.com",
  projectId: "bajarun-2026",
  storageBucket: "bajarun-2026.firebasestorage.app",
  messagingSenderId: "73531449020",
  appId: "1:73531449020:web:981ec8300eb4fbfa077ab9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

console.log('Connected to Firebase Emulators');

// ============================================
// TEST DATA
// ============================================

const testUsers = [
  {
    email: 'admin@test.com',
    password: 'password123',
    displayName: 'Kevin Admin',
    isAdmin: true,
    registration: {
      fullName: 'Kevin Admin',
      nickname: 'Kev',
      tagline: 'Tour Organizer',
      city: 'San Diego',
      state: 'CA',
      zipCode: '92101',
      phone: '(555) 100-0001',
      emergencyName: 'Jane Admin',
      emergencyPhone: '(555) 100-0002',
      emergencyRelation: 'Spouse',
      motorcycleMake: 'BMW',
      motorcycleModel: 'R 1250 GS Adventure',
      motorcycleYear: '2024',
      experienceLevel: 'expert',
      hasPillion: false,
      tshirtSize: 'L',
      participationType: 'groupPlan',
      amtCollected: 500,
    }
  },
  {
    email: 'rider1@test.com',
    password: 'password123',
    displayName: 'Mike Thompson',
    registration: {
      fullName: 'Mike Thompson',
      nickname: 'Throttle Mike',
      tagline: 'Adventure seeker since 1995',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      phone: '(555) 200-0001',
      emergencyName: 'Sarah Thompson',
      emergencyPhone: '(555) 200-0002',
      emergencyRelation: 'Wife',
      motorcycleMake: 'BMW',
      motorcycleModel: 'F 850 GS',
      motorcycleYear: '2023',
      experienceLevel: 'intermediate',
      hasPillion: false,
      tshirtSize: 'XL',
      participationType: 'groupPlan',
      amtCollected: 500,
    }
  },
  {
    email: 'rider2@test.com',
    password: 'password123',
    displayName: 'Sarah Chen',
    registration: {
      fullName: 'Sarah Chen',
      nickname: 'Desert Rose',
      tagline: 'First Baja trip!',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      phone: '(555) 300-0001',
      emergencyName: 'David Chen',
      emergencyPhone: '(555) 300-0002',
      emergencyRelation: 'Brother',
      motorcycleMake: 'Honda',
      motorcycleModel: 'Africa Twin',
      motorcycleYear: '2022',
      experienceLevel: 'intermediate',
      hasPillion: false,
      tshirtSize: 'M',
      participationType: 'groupPlan',
      amtCollected: 250,
    }
  },
  {
    email: 'rider3@test.com',
    password: 'password123',
    displayName: 'Bob Martinez',
    registration: {
      fullName: 'Bob Martinez',
      nickname: 'Big Bob',
      tagline: '20 years of adventure riding',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202',
      phone: '(555) 400-0001',
      emergencyName: 'Maria Martinez',
      emergencyPhone: '(555) 400-0002',
      emergencyRelation: 'Wife',
      motorcycleMake: 'KTM',
      motorcycleModel: '1290 Super Adventure R',
      motorcycleYear: '2024',
      experienceLevel: 'expert',
      hasPillion: true,
      pillionName: 'Maria Martinez',
      pillionEmail: 'maria@test.com',
      pillionPhone: '(555) 400-0003',
      tshirtSize: 'XXL',
      participationType: 'independent',
      amtCollected: 100,
    }
  },
  {
    email: 'rider4@test.com',
    password: 'password123',
    displayName: 'Emily Watson',
    registration: {
      fullName: 'Emily Watson',
      nickname: 'Em',
      tagline: 'Solo rider, group adventurer',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      phone: '(555) 500-0001',
      emergencyName: 'Tom Watson',
      emergencyPhone: '(555) 500-0002',
      emergencyRelation: 'Father',
      motorcycleMake: 'Triumph',
      motorcycleModel: 'Tiger 900 Rally Pro',
      motorcycleYear: '2023',
      experienceLevel: 'intermediate',
      hasPillion: false,
      tshirtSize: 'S',
      participationType: 'groupPlan',
      amtCollected: 0,
    }
  },
  {
    email: 'rider5@test.com',
    password: 'password123',
    displayName: 'James Wilson',
    registration: {
      fullName: 'James Wilson',
      nickname: 'JW',
      tagline: 'Love the open road',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      phone: '(555) 600-0001',
      emergencyName: 'Linda Wilson',
      emergencyPhone: '(555) 600-0002',
      emergencyRelation: 'Mother',
      motorcycleMake: 'BMW',
      motorcycleModel: 'R 1300 GS',
      motorcycleYear: '2024',
      experienceLevel: 'advanced',
      hasPillion: false,
      tshirtSize: 'L',
      participationType: 'groupPlan',
      amtCollected: 500,
    }
  }
];

const discussionPosts = [
  {
    title: 'Tire recommendations for Baja?',
    content: 'Hey everyone! Looking for tire recommendations for the trip. I have an R 1250 GS and wondering if I should go with 50/50 or more street-oriented tires. What are you all running?',
    authorName: 'Mike Thompson',
  },
  {
    title: 'Packing list suggestions',
    content: 'First timer here! Can anyone share their packing list? Trying to figure out what to bring and what to leave behind. How much luggage space do we need?',
    authorName: 'Sarah Chen',
  },
  {
    title: 'Border crossing tips',
    content: 'For those who have done this before - any tips for the Tecate border crossing? Documents needed? How long does it usually take?',
    authorName: 'Emily Watson',
  },
];

const eventConfig = {
  eventName: 'BMW Baja Tour 2026',
  eventFee: 150,
  tshirtCost: 35,
  depositGroupPlan: 500,
  depositIndependent: 100,
  registrationOpen: true,
  registrationDeadline: '2025-12-24',
};

const announcements = [
  {
    title: 'Registration Now Open!',
    content: 'We are excited to announce that registration for the BMW Baja Tour 2026 is now open! Secure your spot early as space is limited to 20 riders.',
    priority: 'high',
    createdAt: new Date('2024-10-01'),
  },
  {
    title: 'Route Preview Available',
    content: 'Check out the full 9-day itinerary on the website. We have an amazing route planned from Temecula through Baja California and ending in Death Valley!',
    priority: 'normal',
    createdAt: new Date('2024-10-15'),
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function createTestUsers() {
  console.log('\n--- Creating Test Users ---');
  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      await updateProfile(userCredential.user, {
        displayName: userData.displayName
      });

      const uid = userCredential.user.uid;
      console.log(`Created user: ${userData.email} (${uid})`);

      createdUsers.push({
        ...userData,
        uid
      });

    } catch (error) {
      console.error(`Failed to create user ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function createRegistrations(users) {
  console.log('\n--- Creating Registrations ---');

  for (const user of users) {
    try {
      const regData = {
        ...user.registration,
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use UID as doc ID (matches app behavior)
      await setDoc(doc(db, 'registrations', user.uid), regData);
      console.log(`Created registration for: ${user.registration.fullName}`);

    } catch (error) {
      console.error(`Failed to create registration for ${user.email}:`, error.message);
    }
  }
}

async function createUserPreferences(users) {
  console.log('\n--- Creating User Preferences ---');

  const preferences = ['hotel', 'camping', 'own'];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      const userPrefs = {
        preferredRoommate: i > 0 ? users[i - 1].registration.fullName : '',
        dietaryRestrictions: i === 2 ? 'Vegetarian' : '',
        accommodationSelections: {
          day1: preferences[i % 3],
          day2: i === 3 ? 'camping' : 'hotel',
          day6: preferences[(i + 1) % 3],
          day7: 'hotel',
          day8: 'hotel',
        },
        // Pre-accept terms for test users
        termsAcceptance: {
          acceptedAt: new Date(),
          privacyVersion: '1.0',
          termsVersion: '1.0',
        },
        // Set isAdmin flag for admin user
        ...(user.isAdmin ? { isAdmin: true } : {}),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userPrefs);
      console.log(`Created preferences for: ${user.registration.fullName}${user.isAdmin ? ' (ADMIN)' : ''}`);

    } catch (error) {
      console.error(`Failed to create preferences for ${user.email}:`, error.message);
    }
  }
}

async function createDiscussionPosts(users) {
  console.log('\n--- Creating Discussion Posts ---');

  for (let i = 0; i < discussionPosts.length; i++) {
    const post = discussionPosts[i];
    const author = users.find(u => u.registration.fullName === post.authorName) || users[0];

    try {
      const postData = {
        title: post.title,
        content: post.content,
        authorUid: author.uid,
        authorName: author.registration.fullName,
        authorNickname: author.registration.nickname,
        createdAt: serverTimestamp(),
        likes: [],
        replies: [],
      };

      await addDoc(collection(db, 'discussionPosts'), postData);
      console.log(`Created post: "${post.title}"`);

    } catch (error) {
      console.error(`Failed to create post "${post.title}":`, error.message);
    }
  }
}

async function createEventConfig() {
  console.log('\n--- Creating Event Config ---');

  try {
    await setDoc(doc(db, 'eventConfig', 'baja2026'), {
      ...eventConfig,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Created event config');
  } catch (error) {
    console.error('Failed to create event config:', error.message);
  }
}

async function createAnnouncements(adminUid) {
  console.log('\n--- Creating Announcements ---');

  for (const announcement of announcements) {
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcement,
        authorUid: adminUid,
        createdAt: announcement.createdAt,
        updatedAt: serverTimestamp(),
      });
      console.log(`Created announcement: "${announcement.title}"`);
    } catch (error) {
      console.error(`Failed to create announcement:`, error.message);
    }
  }
}

async function createTermsConfig() {
  console.log('\n--- Creating Terms Config ---');

  try {
    await setDoc(doc(db, 'config', 'terms'), {
      privacyVersion: '1.0',
      termsVersion: '1.0',
      privacyUrl: 'https://example.com/privacy',
      termsUrl: 'https://example.com/terms',
    });
    console.log('Created terms config');
  } catch (error) {
    console.error('Failed to create terms config:', error.message);
  }
}

async function createTourData() {
  console.log('\n--- Creating Tour Data ---');

  try {
    await setDoc(doc(db, 'tours', 'baja2026'), {
      id: 'baja2026',
      name: 'BMW Baja Tour 2026',
      shortName: 'BAJA 2026',
      description: 'Epic 9-day motorcycle adventure through Baja California and Death Valley',
      startDate: '2026-03-19',
      endDate: '2026-03-27',
      status: 'open',
      maxRiders: 20,
      currentRiders: 6,
      createdAt: serverTimestamp(),
    });
    console.log('Created tour: BMW Baja Tour 2026');
  } catch (error) {
    console.error('Failed to create tour:', error.message);
  }
}

// ============================================
// MAIN
// ============================================

async function seed() {
  console.log('='.repeat(50));
  console.log('SEEDING FIREBASE EMULATOR');
  console.log('='.repeat(50));

  try {
    // Create users first
    const users = await createTestUsers();

    if (users.length === 0) {
      console.error('No users created, aborting seed');
      process.exit(1);
    }

    // Find admin user
    const adminUser = users.find(u => u.isAdmin);

    // Create all data
    await createTermsConfig();
    await createRegistrations(users);
    await createUserPreferences(users);
    await createDiscussionPosts(users);
    await createEventConfig();
    await createAnnouncements(adminUser?.uid || users[0].uid);
    await createTourData();

    console.log('\n' + '='.repeat(50));
    console.log('SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log('\nTest accounts:');
    console.log('  Admin: admin@test.com / password123');
    console.log('  Rider: rider1@test.com / password123');
    console.log('  (rider2-5@test.com also available)');
    console.log('\nEmulator UI: http://localhost:4000');

    process.exit(0);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
