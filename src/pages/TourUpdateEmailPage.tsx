/**
 * TourUpdateEmailPage.tsx
 *
 * Admin page for sending personalized tour update emails.
 * Pulls rider data from Firestore and renders individualized emails.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { db, functions } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Admin UID
const ADMIN_UID = 'kGEO7bTgqMMsDfXmkumneI44S9H2';

interface Registration {
  uid: string;
  email: string;
  fullName: string;
  nickname?: string;
  tagline?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  bikeYear?: string;
  bikeModel?: string;
  yearsRiding?: string;
  offRoadExperience?: string;
  bajaTourExperience?: string;
  repairExperience?: string;
  hasPillion?: boolean;
  spanishLevel?: string;
  passportValid?: boolean;
  tshirtSize?: string;
  hasGarminInreach?: boolean;
  hasToolkit?: boolean;
  // Skills
  skillMechanical?: boolean;
  skillMedical?: boolean;
  skillPhotography?: boolean;
  skillOther?: boolean;
  skillOtherText?: string;
  // Emergency contact
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  // Preferences (from users collection)
  dietaryRestrictions?: string;
  preferredRoommate?: string;
}

interface NightSelection {
  accommodation?: string;
  breakfast?: boolean;
  dinner?: boolean;
  optionalActivitiesInterested?: string[];
  prefersFloorSleeping?: boolean;
  prefersSingleRoom?: boolean;
}

interface UserSelections {
  [night: string]: NightSelection;
}

interface RiderData {
  registration: Registration;
  selections: UserSelections;
}

interface NightConfig {
  hotelAvailable: boolean;
  campingAvailable: boolean;
  dinnerAvailable: boolean;
  breakfastAvailable: boolean;
  optionalActivities?: Array<{ id: string; title: string; cost: number; description: string }>;
}

export default function TourUpdateEmailPage() {
  const { user, loading: authLoading } = useAuth();
  const [riders, setRiders] = useState<RiderData[]>([]);
  const [nightConfigs, setNightConfigs] = useState<Record<string, NightConfig>>({});
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.uid === ADMIN_UID;

  // Fetch all registrations and user selections
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        // Fetch event pricing config (for night options)
        const configRef = doc(db, 'eventConfig', 'pricing');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.nights) {
            setNightConfigs(data.nights);
          }
        }

        // Fetch registrations
        const regsSnapshot = await getDocs(collection(db, 'registrations'));
        const registrations: Registration[] = regsSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as Registration));

        // Fetch user selections - index by both doc ID and email for matching
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userSelectionsByUid: Record<string, UserSelections> = {};
        const userSelectionsByEmail: Record<string, UserSelections> = {};
        const userPreferencesByEmail: Record<string, { preferredRoommate?: string; dietaryRestrictions?: string }> = {};

        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.accommodationSelections) {
            userSelectionsByUid[doc.id] = data.accommodationSelections;
            if (data.email) {
              userSelectionsByEmail[data.email.toLowerCase()] = data.accommodationSelections;
              userPreferencesByEmail[data.email.toLowerCase()] = {
                preferredRoommate: data.preferredRoommate,
                dietaryRestrictions: data.dietaryRestrictions
              };
            }
          }
        });

        // Combine data - try matching by uid first, then by email
        const riderData: RiderData[] = registrations.map(reg => {
          const emailKey = reg.email?.toLowerCase() || '';
          const selections = userSelectionsByUid[reg.uid] || userSelectionsByEmail[emailKey] || {};
          const prefs = userPreferencesByEmail[emailKey] || {};

          // Merge user preferences into registration if not already present
          const enrichedReg = {
            ...reg,
            preferredRoommate: reg.preferredRoommate || prefs.preferredRoommate,
            dietaryRestrictions: reg.dietaryRestrictions || prefs.dietaryRestrictions
          };

          return {
            registration: enrichedReg,
            selections
          };
        });

        // Sort by name
        riderData.sort((a, b) => a.registration.fullName.localeCompare(b.registration.fullName));

        setRiders(riderData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load rider data');
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Render email HTML for a specific rider
  const renderEmailHtml = (rider: RiderData): string => {
    const r = rider.registration;
    const firstName = r.nickname || r.fullName.split(' ')[0];

    // Build nightly selections HTML
    const nightsHtml = buildNightsHtml(rider.selections, nightConfigs);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Baja Tour 2026 - Update and Rider Info Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: #333;
      max-width: 650px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      font-size: 16px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      color: white;
      padding: 35px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 35px;
    }
    h2 {
      font-size: 20px;
      color: #1e3a5f;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    h2:first-of-type {
      margin-top: 25px;
    }
    h3 {
      font-size: 17px;
      color: #374151;
      margin: 20px 0 10px 0;
    }
    p {
      margin: 0 0 15px 0;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    .info-table {
      width: 100%;
      margin: 15px 0;
    }
    .info-table td {
      padding: 8px 0;
      vertical-align: top;
    }
    .info-table .label {
      width: 150px;
      color: #6b7280;
      font-weight: 500;
    }
    .info-table .value {
      color: #111827;
    }
    .night-row {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 12px 15px;
      margin-bottom: 10px;
    }
    .night-title {
      font-weight: 600;
      color: #1e3a5f;
      margin-bottom: 5px;
    }
    .night-details {
      color: #4b5563;
      font-size: 15px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 25px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Baja Tour 2026</h1>
      <p>Tour Update & Rider Information Confirmation</p>
    </div>

    <div class="content">
      <p>Hello <strong>${firstName}</strong>,</p>

      <p>Happy New Year! Thanks so much for registering for the Baja Tour, submitting your deposit on time, and taking the time to register (or re-register) and update your preferences on the website. Having everyone's information in a database makes it so much easier to manage the event - I really appreciate it. We have a great group of riders signed up.</p>

      <p>This email includes updates on tour planning as well as all of your registration information. Please review and let me know if you see any errors or want to make a change.</p>

      <h2>Ride Briefing - January 7, 2026</h2>
      <p>I am hosting a Google Meet to review the plans, answer any questions, and review feedback - keeping in mind that the itinerary is pretty firm at this point and difficult to change.</p>
      <p><strong>Wednesday, January 7th at 7:30 PM Pacific</strong></p>
      <p>Google Meet: <a href="https://meet.google.com/vxf-seuq-ozc">meet.google.com/vxf-seuq-ozc</a></p>
      <p><em>I will record it in case you can't make this time.</em></p>

      <h2>Our Group</h2>
      <p>We have <strong>29 riders</strong> signed up and one pillion. You can check out the roster at <a href="https://bajarun-2026.web.app/participants">bajarun-2026.web.app/participants</a>. There's a map showing the town of each rider, so take a look and find a rider close by to join up for the long ride to Temecula.</p>
      <p><strong>Quick Stats:</strong></p>
      <ul style="margin: 10px 0 15px 0; padding-left: 25px;">
        <li>48% are first-time Baja riders</li>
        <li>59% have 10+ years riding experience</li>
        <li>9 riders with mechanical skills, 2 medics, 10 photographers</li>
        <li>11 have Garmin InReach, 12 have toolkits</li>
      </ul>
      <p>While our group size is large, what happens is we organically break up into smaller groups of riders who ride at their own pace and make stops along the way. So it's not a group of 30 riders in a conga line! We connect up each night, share a campfire and meal, then do it again the next day.</p>
      <p><strong>Upload a headshot!</strong> It would be helpful to upload a photo to your profile so people can put a name to a face. Log in and click on your name in the upper right corner, then select "My Profile" to edit your profile and upload a photo: <a href="https://bajarun-2026.web.app/my-profile">bajarun-2026.web.app/my-profile</a></p>

      <h2>About Our Ride</h2>
      <p>I've completed most of the significant planning and confirmed our key locations. Here are some highlights I'm excited about:</p>
      <p><strong>Rancho Meling</strong> - A legendary Baja destination. This remote ranch in the Sierra San Pedro Mártir has been hosting adventurers for over 100 years. You're going to love it.</p>
      <p><strong>Ojo de Liebre Lagoon</strong> - This is a true adventure. The campground is several miles off the main road and quite secluded. If you've never visited the whales, I highly recommend it. No one is ever disappointed.</p>
      <p><strong>Bahia Concepcion</strong> - Camping on this beautiful bay will be awesome. The people are nice, and in the morning the locals come around selling tamales and refreshments. The next day you can explore Mulegé, Loreto, or San Javier - all great towns to visit. The scenery is spectacular and the riding just as good. We may need to be flexible finding campsites depending on how crowded the sites are.</p>
      <p><strong>Bahia de los Angeles</strong> - One of the most beautiful spots on the Sea of Cortez. Camp Archelon is a really great Baja-style resort with a small cafe and nice owners. Whether you're camping in the palapas or staying in one of the houses, it's a great spot.</p>
      <p><strong>Santuario Diegueño in Tecate</strong> - Our final night in Mexico will be at this four-star hotel. A perfect way to celebrate the end of an epic ride.</p>
      <p><strong>Indian Cove Campground in Twentynine Palms</strong> - One of my favorite campgrounds. A memorable way to wrap up the tour.</p>
      <p>You can check out the full itinerary with routes, gas stations, restaurants, and POIs at <a href="https://bajarun.ncmotoadv.com/itinerary">bajarun.ncmotoadv.com/itinerary</a>. I'll be making refinements and adding more details over the next month. If you have points of interest or great restaurants to share, let me know and I'll add them.</p>

      <h2>About the Deposit</h2>
      <p>Based on your selections, you may be over the $500 deposit amount. Once I finalize the costs of the meals and exact cost of the hotels, I will send requests for additional deposits if necessary.</p>

      <h2>Join the WhatsApp Group</h2>
      <p>I have set up a group chat and community on WhatsApp and <strong>15 of our 30 riders</strong> have joined so far. I would encourage everyone to set up WhatsApp and join the group chat as it greatly facilitates communication of time-sensitive or important updates while on the ride.</p>
      <p>If you haven't joined yet, please reply to this email and I'll send you the invite link.</p>

      <h2>Ride Mobile App</h2>
      <p>The Baja Tour 2026 mobile app will be released soon - first on iOS, then on Android. Here's what you'll be able to do:</p>
      <ul style="margin: 15px 0; padding-left: 25px;">
        <li><strong>GPS Routes & Navigation</strong> - Download GPS files and view the routes</li>
        <li><strong>Daily Itinerary</strong> - View each day's schedule, distances, and planned stops</li>
        <li><strong>Rider Directory</strong> - See who's on the tour with photos, bikes, and contact info</li>
        <li><strong>Ride Gallery</strong> - Share your favorite photos and videos for other riders to see and like. Maybe there will be prizes for the most liked photos!</li>
        <li><strong>Notifications</strong> - If you allow, you'll receive timely notifications of urgent and important info</li>
        <li><strong>Emergency Info</strong> - Quick access to emergency contacts, medical info, and important documents</li>
        <li><strong>Accommodation Details</strong> - View your nightly selections and hotel/campsite information</li>
      </ul>

      <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 35px 0;">

      <h2>Your Registration Information</h2>
      <p>Please review the details below and let me know if anything needs to be updated.</p>
      <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">When reviewing your accommodation, meal, and activity selections, keep in mind that for Night 1 (Temecula) and Night 7 (Tecate) I only offered Hotel, and for Nights 3 (Ojo de Liebre) and Nights 4 &amp; 5 (Mulegé) I only offered Camping. For meals, I only offered group dinners on Nights 2, 3, 6, and 8. I will probably have an option for us in Tecate and Playa El Burro later.</p>

      <h3>Personal Information</h3>
      <table class="info-table">
        <tr><td class="label">Full Name:</td><td class="value">${r.fullName || 'Not provided'}</td></tr>
        <tr><td class="label">Nickname:</td><td class="value">${r.nickname || 'Not provided'}</td></tr>
        <tr><td class="label">Tagline:</td><td class="value">${r.tagline || 'Not provided'}</td></tr>
        <tr><td class="label">Email:</td><td class="value">${r.email || 'Not provided'}</td></tr>
        <tr><td class="label">Location:</td><td class="value">${r.city || ''}${r.city && r.state ? ', ' : ''}${r.state || ''} ${r.zipCode || ''}</td></tr>
        <tr><td class="label">Phone:</td><td class="value">${r.phone || 'Not provided'}</td></tr>
      </table>

      <h3>Emergency Contact</h3>
      <table class="info-table">
        <tr><td class="label">Contact Name:</td><td class="value">${r.emergencyName || 'Not provided'}</td></tr>
        <tr><td class="label">Relationship:</td><td class="value">${r.emergencyRelation || 'Not provided'}</td></tr>
        <tr><td class="label">Phone:</td><td class="value">${r.emergencyPhone || 'Not provided'}</td></tr>
        <tr><td class="label">Medical Info:</td><td class="value">${r.medicalConditions || 'None provided'}</td></tr>
      </table>

      <h3>Motorcycle & Experience</h3>
      <table class="info-table">
        <tr><td class="label">Motorcycle:</td><td class="value">${r.bikeYear || ''} ${r.bikeModel || 'Not provided'}</td></tr>
        <tr><td class="label">Years Riding:</td><td class="value">${r.yearsRiding || 'Not provided'}</td></tr>
        <tr><td class="label">Off-Road Exp:</td><td class="value">${r.offRoadExperience || 'Not provided'}</td></tr>
        <tr><td class="label">Baja Experience:</td><td class="value">${r.bajaTourExperience || 'Not provided'}</td></tr>
        <tr><td class="label">Repair Skills:</td><td class="value">${r.repairExperience || 'Not provided'}</td></tr>
        <tr><td class="label">Pillion:</td><td class="value">${r.hasPillion ? 'Yes' : 'No'}</td></tr>
      </table>

      <h3>Other Information</h3>
      <table class="info-table">
        <tr><td class="label">Spanish Level:</td><td class="value">${r.spanishLevel || 'Not provided'}</td></tr>
        <tr><td class="label">Passport Valid:</td><td class="value">${r.passportValid ? 'Yes' : 'Not confirmed'}</td></tr>
        <tr><td class="label">T-Shirt Size:</td><td class="value">${r.tshirtSize || 'Not provided'}</td></tr>
        <tr><td class="label">Garmin InReach:</td><td class="value">${r.hasGarminInreach ? 'Yes' : 'No'}</td></tr>
        <tr><td class="label">Toolkit:</td><td class="value">${r.hasToolkit ? 'Yes' : 'No'}</td></tr>
        <tr><td class="label">Special Skills:</td><td class="value">${[
          r.skillMechanical ? 'Mechanical' : '',
          r.skillMedical ? 'Medical' : '',
          r.skillPhotography ? 'Photography' : '',
          r.skillOther && r.skillOtherText ? r.skillOtherText : ''
        ].filter(Boolean).join(', ') || 'None listed'}</td></tr>
      </table>

      <h3>Nightly Selections</h3>
      <table class="info-table" style="margin-bottom: 20px;">
        <tr><td class="label">Roommate Pref:</td><td class="value">${r.preferredRoommate || 'No preference'}</td></tr>
        <tr><td class="label">Dietary:</td><td class="value">${r.dietaryRestrictions || 'None'}</td></tr>
      </table>

      ${nightsHtml}

      <p style="margin-top: 30px;">
        If you see any errors and need to make changes please reply to this email and let me know the changes.
      </p>

      <p style="margin-top: 25px;">
        See you on the road!<br>
        <strong>Kevin Coleman</strong><br>
        Tour Organizer
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">Baja Tour 2026 | March 19-27, 2026</p>
      <p style="margin: 8px 0 0 0;"><a href="https://bajarun.ncmotoadv.com">bajarun.ncmotoadv.com</a></p>
    </div>
  </div>
</body>
</html>`;
  };

  // Build HTML for nightly selections
  const buildNightsHtml = (selections: UserSelections, configs: Record<string, NightConfig>): string => {
    const nights = [
      { key: 'night-1', label: 'Night 1', location: 'Temecula, CA' },
      { key: 'night-2', label: 'Night 2', location: 'Rancho Meling, BC' },
      { key: 'night-3', label: 'Night 3', location: 'Laguna Ojo de Liebre, BCS' },
      { key: 'night-4', label: 'Night 4', location: 'Playa El Burro, BCS' },
      { key: 'night-5', label: 'Night 5', location: 'Playa El Burro, BCS (Rest Day)' },
      { key: 'night-6', label: 'Night 6', location: 'Bahia de los Angeles, BC' },
      { key: 'night-7', label: 'Night 7', location: 'Tecate, BC' },
      { key: 'night-8', label: 'Night 8', location: 'Twentynine Palms, CA' },
    ];

    return nights.map(night => {
      const sel = selections[night.key] || {};
      const config = configs[night.key] || {};
      const accommodation = sel.accommodation || '';
      const isHotel = accommodation.toLowerCase() === 'hotel';
      const isOwn = accommodation.toLowerCase() === 'own';
      const isCamping = accommodation.toLowerCase() === 'camping';

      // Determine what options were available
      const hotelAvailable = config.hotelAvailable || false;
      const campingAvailable = config.campingAvailable || false;

      // Build "Available" text
      const availableOptions: string[] = [];
      if (hotelAvailable) availableOptions.push('Hotel');
      if (campingAvailable) availableOptions.push('Camping');
      availableOptions.push('Own arrangements'); // Always available

      let availableText = '';
      if (availableOptions.length === 2) {
        availableText = `${availableOptions[0]} or ${availableOptions[1]}`;
      } else {
        const last = availableOptions.pop();
        availableText = `${availableOptions.join(', ')}, or ${last}`;
      }

      // Determine selection text
      let selectionText = 'Not yet selected';
      if (isHotel) {
        selectionText = 'Hotel ✓';
      } else if (isCamping) {
        selectionText = 'Camping ✓';
      } else if (isOwn) {
        selectionText = 'Own arrangements ✓';
      }

      // Build meals section
      const dinnerAvailable = config.dinnerAvailable || false;
      const breakfastAvailable = config.breakfastAvailable || false;
      const hasMealOptions = dinnerAvailable || breakfastAvailable;

      let mealsHtml = '';
      if (hasMealOptions) {
        const mealsAvailable: string[] = [];
        if (dinnerAvailable) mealsAvailable.push('Dinner');
        if (breakfastAvailable) mealsAvailable.push('Breakfast');
        const mealsAvailableText = mealsAvailable.join(' and ');

        const mealsSelected: string[] = [];
        if (sel.dinner && dinnerAvailable) mealsSelected.push('Dinner ✓');
        if (sel.breakfast && breakfastAvailable) mealsSelected.push('Breakfast ✓');
        const mealsSelectedText = mealsSelected.length > 0 ? mealsSelected.join(', ') : 'None selected';

        mealsHtml = `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="color: #6b7280; font-size: 13px;">Meals available: ${mealsAvailableText}</div>
            <div style="color: #111827; font-weight: 500; margin-top: 2px;">Your selection: ${mealsSelectedText}</div>
          </div>
        `;
      }

      // Build activities section
      const activities = config.optionalActivities || [];
      const hasActivityOptions = activities.length > 0;

      let activitiesHtml = '';
      if (hasActivityOptions) {
        const activitiesAvailable = activities.map((a: any) => a.title).join(', ');

        const activitiesSelected: string[] = [];
        if (sel.optionalActivitiesInterested && sel.optionalActivitiesInterested.length > 0) {
          sel.optionalActivitiesInterested.forEach(activityId => {
            const activity = activities.find((a: any) => a.id === activityId);
            if (activity) {
              activitiesSelected.push(`${activity.title} ✓`);
            }
          });
        }
        const activitiesSelectedText = activitiesSelected.length > 0 ? activitiesSelected.join(', ') : 'None selected';

        activitiesHtml = `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="color: #6b7280; font-size: 13px;">Activities available: ${activitiesAvailable}</div>
            <div style="color: #111827; font-weight: 500; margin-top: 2px;">Your selection: ${activitiesSelectedText}</div>
          </div>
        `;
      }

      // Build preferences/notes
      const notes: string[] = [];
      if (sel.prefersSingleRoom) {
        notes.push('Single Room Requested');
      }
      const notesHtml = notes.length > 0
        ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #7c3aed; font-size: 13px; font-weight: 500;">Note: ${notes.join(', ')}</div>`
        : '';

      return `
        <div class="night-row">
          <div class="night-title">${night.label} - ${night.location}</div>
          <div class="night-available" style="color: #6b7280; font-size: 13px;">Accommodation available: ${availableText}</div>
          <div class="night-selection" style="color: #111827; font-weight: 500; margin-top: 2px;">Your selection: ${selectionText}</div>
          ${mealsHtml}
          ${activitiesHtml}
          ${notesHtml}
        </div>
      `;
    }).join('');
  };

  // Current rider for preview
  const currentRider = riders[previewIndex];
  const previewHtml = useMemo(() => {
    if (!currentRider) return '';
    return renderEmailHtml(currentRider);
  }, [currentRider]);

  // Send test email to self
  const sendTestEmail = async () => {
    if (!currentRider) return;

    setSending(true);
    setError(null);
    setSendResult(null);

    try {
      const sendFn = httpsCallable(functions, 'sendPersonalizedEmails');
      const response = await sendFn({
        emails: [{
          to: 'bmwriderkmc@gmail.com',
          subject: `[TEST] Baja Tour 2026 - Update for ${currentRider.registration.fullName}`,
          html: previewHtml
        }]
      });

      const data = response.data as { sent: number; failed: number };
      setSendResult(data);
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setError(err.message || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  // Send to all riders
  const sendToAll = async () => {
    const confirmMsg = `Are you sure you want to send personalized emails to all ${riders.length} riders?`;
    if (!confirm(confirmMsg)) return;

    setSending(true);
    setError(null);
    setSendResult(null);

    try {
      const emails = riders.map(rider => ({
        to: rider.registration.email,
        subject: 'Baja Tour 2026 - Tour Update & Registration Confirmation',
        html: renderEmailHtml(rider)
      }));

      const sendFn = httpsCallable(functions, 'sendPersonalizedEmails');
      const response = await sendFn({ emails });

      const data = response.data as { sent: number; failed: number };
      setSendResult(data);
    } catch (err: any) {
      console.error('Error sending emails:', err);
      setError(err.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <AdminLayout title="Tour Update Email">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tour Update Email">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">
          Send personalized tour update emails with rider data
        </p>
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="h-5 w-5" />
          <span>{riders.length} riders</span>
        </div>
      </div>

        {/* Status messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-600/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {sendResult && (
          <div className="mb-4 p-4 bg-green-600/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400">
              Sent: {sendResult.sent}, Failed: {sendResult.failed}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            {/* Rider selector */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Preview Rider</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-white font-medium">
                      {currentRider?.registration.fullName || 'No rider'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {previewIndex + 1} of {riders.length}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewIndex(Math.min(riders.length - 1, previewIndex + 1))}
                  disabled={previewIndex >= riders.length - 1}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Quick select */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Select</h3>
              <select
                value={previewIndex}
                onChange={(e) => setPreviewIndex(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              >
                {riders.map((rider, idx) => (
                  <option key={rider.registration.uid} value={idx}>
                    {rider.registration.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Actions</h3>

              <button
                onClick={sendTestEmail}
                disabled={sending || !currentRider}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Send Test to Self
              </button>

              <button
                onClick={sendToAll}
                disabled={sending || riders.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send to All ({riders.length})
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Email Preview</h3>
                  <span className="text-xs text-slate-500">
                    {currentRider?.registration.email}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 font-mono">
                  UID: {currentRider?.registration.uid} |
                  Selections: {Object.keys(currentRider?.selections || {}).length} nights
                </div>
              </div>
              <div className="bg-white" style={{ height: '70vh', overflow: 'auto' }}>
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
