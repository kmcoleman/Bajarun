# BMW Baja Tour 2026 Website
## Functionality Summary & User Guide

**Trip Dates:** March 19-27, 2026
**Route:** Temecula, CA → Baja California, Mexico → Death Valley, CA
**Website:** https://bajarun.ncmotoadv.com

---

## Overview

The BMW Baja Tour 2026 website is a comprehensive tour management platform that handles rider registration, accommodation coordination, financial tracking, document storage, and group communication. Built with React, TypeScript, and Firebase, it provides a seamless experience for organizing a multi-day motorcycle adventure.

---

## User Personas

### 1. The Public Visitor
**Who they are:** Anyone interested in learning about the Baja Tour—potential riders, friends, family, or curious motorcyclists.

**What they can do:**
- **Home Page** - View trip overview, countdown timer, route highlights, and key statistics
- **Itinerary** - Explore the day-by-day route with distances, accommodations, and points of interest
- **FAQ** - Read frequently asked questions about the trip requirements, costs, and logistics
- **Logistics** - Access important travel information:
  - How to obtain an FMM tourist card online (required for Mexico entry)
  - Motorcycle insurance options for Mexico
  - Border crossing tips
- **Register/Sign In** - Create an account to join the tour

**User Flow:**
```
Visit Website → Browse Itinerary → Read FAQ → View Logistics → Create Account → Register for Tour
```

---

### 2. The Registered Rider
**Who they are:** Motorcyclists who have created an account and completed their tour registration.

**What they can do:**

#### Profile & Account
- **Profile Management** - Edit name, phone number, and upload/update headshot photo
- **View Announcements** - Receive priority notifications from the tour organizer (normal, important, urgent)

#### Tour Planning
- **Tour Details (My Selections)** - Select preferences for each of the 8 nights:
  - Accommodation type: Hotel, Camping, or Own arrangements
  - Meals: Dinner and breakfast where available
  - Optional activities: Whale watching, side trips, etc.
  - Roommate preference
  - Dietary restrictions
- **View Participants** - See fellow riders with their:
  - Profile photos and nicknames
  - Motorcycle make/model/year
  - Riding experience level
  - Special skills (mechanical, medical, photography)
  - Location

#### Communication
- **Discussion Forum** - Engage with the group:
  - Create discussion posts
  - Reply to other riders' posts
  - Like/unlike posts
  - Share ideas, ask questions, coordinate plans

#### Documents & Finances
- **My Documents** - Upload and store travel documents:
  - Passport photo page
  - Driver's license
  - FMM card and payment receipt
  - Mexico motorcycle insurance
  - US motorcycle insurance
- **My Ledger** - View personal financial summary:
  - Estimated charges based on selections
  - Posted charges (finalized costs)
  - Payments made
  - Current balance (owed or credit)

**User Flow:**
```
Sign In → Complete Registration → Pay Deposit →
Select Accommodations → Upload Documents →
Participate in Discussion → Monitor Ledger
```

---

### 3. The Admin (Tour Organizer)
**Who they are:** The tour organizer responsible for managing all aspects of the trip logistics, finances, and communications.

**What they can do:**

#### Registration Management
- **View All Registrations** - See complete list of registered riders with all their details
- **Record Deposits** - Log payments received via Venmo, Zelle, or cash
- **Export Data** - Download participant email list for external communications

#### Tour Configuration
- **Daily Config** - Configure options for each of the 8 nights:
  - Hotel details: name, website, maps link, cost per person
  - Camping details: location, cost
  - Meal options: dinner and breakfast with costs
  - Single room availability and pricing
  - Floor sleeping (budget) option
  - Optional activities with descriptions and costs

#### Financial Management
- **Ledger Management** - For each rider:
  - View estimated charges based on their selections
  - Post actual charges (accommodation, meals, fees, adjustments)
  - Record payments received
  - Track balance owed or credit
- **All Riders Summary** - View aggregate totals:
  - Total payments received
  - Total estimated charges
  - Total posted charges
  - Overall balance

#### Accommodation Coordination
- **Rider Preferences View** - See all riders' accommodation selections organized by night
- **Room Assignments** - Assign roommates and room numbers
- **Accommodation Counts** - View how many chose hotel vs camping vs own for each night

#### Communications
- **Announcements** - Post announcements with priority levels:
  - Normal - General updates
  - Important - Action items
  - Urgent - Critical information
- **Bulk Email** - Send emails to all registered riders or selected individuals

**User Flow:**
```
Configure Nightly Options → Monitor Registrations →
Record Deposits → Review Accommodation Selections →
Assign Roommates → Post Charges → Send Communications
```

---

## Key Features

### Registration System
- Comprehensive 6-section registration form
- Personal info, emergency contact, motorcycle details, travel preferences
- Headshot photo upload for participant directory
- Pillion (passenger) support with automatic deposit doubling
- Dynamic deposit calculation ($500 group plan / $100 independent)
- QR codes for Venmo and Zelle payments

### Accommodation Selection
- 8 configurable nights with flexible options
- Real-time cost estimates as selections are made
- Roommate preference matching
- Dietary restriction tracking
- Optional activity sign-ups

### Financial Tracking
- Automatic estimate calculation from selections
- Admin-posted actual charges
- Payment recording with multiple methods
- Per-rider and aggregate balance tracking
- Transparent ledger visible to riders

### Document Storage
- Secure upload to Firebase Storage
- Support for passport, license, insurance, FMM documents
- Mobile-accessible during the trip
- Automatic deletion after tour completion

### Discussion Forum
- Registration-verified access
- Threaded discussions with replies
- Like functionality
- Author attribution with photos
- Organizer badge for admin posts

### Announcement System
- Three-tier priority (normal/important/urgent)
- Unread notification badges
- Persistent read tracking
- Real-time updates

---

## Security & Privacy

- **Authentication:** Email/password and Google OAuth
- **Data Access:** Users can only modify their own data
- **Admin Controls:** Single admin UID with elevated permissions
- **Document Privacy:** Users can only access their own uploaded documents
- **Financial Privacy:** Ledger data visible only to the individual rider and admin

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| File Storage | Firebase Cloud Storage |
| Hosting | Firebase Hosting |
| Email | SendGrid (via Cloud Functions) |
| Icons | Lucide React |

---

## Data Collections

| Collection | Purpose |
|------------|---------|
| `registrations` | Rider registration data and profiles |
| `users` | Accommodation selections and preferences |
| `discussionPosts` | Forum posts, replies, and likes |
| `announcements` | Admin announcements with priority |
| `eventConfig` | Nightly accommodation/meal configuration |
| `ledger` | Financial charges and payments per user |
| `riderDocuments` | Document upload metadata |

---

## Contact & Support

For questions about the tour or website, riders can:
- Post in the Discussion Forum
- Reply to announcement emails
- Contact the organizer directly

---

*Last Updated: December 2024*
