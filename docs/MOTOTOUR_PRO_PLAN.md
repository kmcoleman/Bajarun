# MotoTour Pro - Product Specification

## Vision

A SaaS platform where **motorcycle tour operators** can create accounts, set up events (tours, rides, meetups), collect payments, and manage participants. Simple enough for a solo guide running day rides, powerful enough for established operators running multi-day adventures.

**Platform Name:** MotoTour Pro
**Target Launch:** Q2 2026 (after Baja tour)
**Tech Stack:** DigitalOcean App Platform, Next.js, PostgreSQL, Stripe

---

## Table of Contents

1. [Market Analysis](#market-analysis)
2. [Customer Segments](#customer-segments)
3. [Business Model](#business-model)
4. [Tech Stack Decision](#tech-stack-decision)
5. [Data Model](#data-model)
6. [Feature Tiers](#feature-tiers)
7. [MVP Scope](#mvp-scope)
8. [Development Timeline](#development-timeline)
9. [Competitive Landscape](#competitive-landscape)
10. [Key Decisions](#key-decisions)
11. [Action Items](#action-items)

---

## Market Analysis

### Tour Types (Simplest → Most Complex)

| Type | Duration | Accommodation | Meals | Complexity | Market Size |
|------|----------|---------------|-------|------------|-------------|
| **Day Ride** | 1 day | None | Maybe lunch | Very Low | Large |
| **Overnighter** | 2 days | 1 hotel | Optional | Low | Medium |
| **Multi-day Guided** | 3-14 days | All included | Most included | Medium | Medium |
| **Multi-day Self-guided** | 3-14 days | Rider books | None | Low | Small |
| **Adventure/Expedition** | 7-30 days | Mixed (hotels + camping) | Some included | Very High | Small |
| **Rally/Event** | 1-3 days | Rider arranges | None | Low | Medium |
| **Track Day** | 1 day | None | None | Low | Medium |

**Key Insight:** 80%+ of the market is day rides, overnighters, and simple multi-day tours. The Baja tour model (mixed camping/hotels, nightly selections, complex pricing) represents <5% of the market.

### Accommodation Models in the Wild

| Model | How It Works | Operator Effort | Our Complexity |
|-------|--------------|-----------------|----------------|
| **All-inclusive** | "Price includes everything" | Books everything, rider shows up | Low |
| **Recommended list** | "Here are hotels near our stops" | Just share info | Very Low |
| **Group rate code** | "Use code MOTOTOUR at Marriott" | Negotiate rate, rider books | Low |
| **Rider books own** | "Be at Hotel X by 6pm" | None | Very Low |
| **Operator assigns** | "You're in Room 214 with Bob" | Full control | Medium |
| **Rider chooses** | "Hotel or camping? Single or shared?" | Very high | High |

**Key Insight:** Models 1-4 cover 80%+ of operators. Complex selection/assignment systems (Baja model) are premium features, not MVP requirements.

---

## Customer Segments

### Target Customer Analysis

| Segment | Size | Pain Level | Willingness to Pay | Tech Savvy | Priority |
|---------|------|------------|-------------------|------------|----------|
| **Solo guides** | Large | High | Low ($10-20/mo) | Low | Secondary |
| **Small operators** (1-5 tours/yr) | Medium | High | Medium ($30-50/mo) | Medium | **Primary** |
| **Established operators** (10+ tours/yr) | Small | Medium | High ($100-200/mo) | High | Growth |
| **Big companies** (Edelweiss, Ayres) | Tiny | Low (have systems) | Very high | High | Not target |

### Ideal Customer Profile (ICP)

- Runs 3-15 motorcycle tours per year
- Currently uses spreadsheets + email + Venmo/PayPal
- Tours range from day rides to week-long adventures
- 10-50 riders per tour
- Frustrated with manual tracking and chasing payments
- Not technical enough to build custom solution
- Willing to pay $30-80/month for a solution that "just works"

---

## Business Model

### Pricing Strategy

| Plan | Price | Tours/Year | Riders/Tour | Features |
|------|-------|------------|-------------|----------|
| **Free Trial** | $0 (14 days) | 1 | 10 | All core features |
| **Starter** | $29/mo | 5 | 25 | Core + email |
| **Pro** | $79/mo | 15 | 50 | + accommodations, reports |
| **Business** | $149/mo | Unlimited | 100 | + room assignments, API |
| **Enterprise** | Custom | Unlimited | Unlimited | White-label, priority support |

### Revenue Streams

1. **Primary:** Monthly subscriptions
2. **Secondary:** Payment processing margin (if using Stripe Connect)
3. **Future:** Marketplace commission (public event listings)

### Pricing Model Comparison

| Model | Pros | Cons | Recommendation |
|-------|------|------|----------------|
| Per-rider fee ($2-5) | Scales with value | Operators hate "tax on customers" | Avoid |
| Monthly subscription | Predictable, simple | Pay during off-season | **Use this** |
| Per-tour fee ($20-50) | Pay for what you use | Unpredictable | Consider for starter |
| Transaction fee (%) | Low barrier | Race to bottom | Avoid as primary |

### Payment Processing Options

| Option | How It Works | Complexity | Recommendation |
|--------|--------------|------------|----------------|
| **Stripe Connect** | Money flows direct to operator | High (KYC, payouts) | Phase 2 |
| **Simple Stripe** | We collect, pay out manually | Medium | **MVP** |
| **External only** | Operators use own Venmo/PayPal | Low | Support but don't build |

---

## Tech Stack Decision

### Why DigitalOcean + PostgreSQL (Not Firebase)

#### Lessons Learned from Baja App

| What We Built | Firebase Pain | PostgreSQL Solution |
|---------------|---------------|---------------------|
| Room assignments | Manual logic, no JOINs | `SELECT * FROM riders JOIN rooms...` |
| Financial reporting | Aggregate in Cloud Functions | `SUM(), GROUP BY, views` |
| Accommodation selections | Denormalized, duplicated data | Proper foreign keys |
| "Who owes money" query | Full collection scan | `WHERE balance > 0` |
| Multi-tenant isolation | Collection prefixes, messy | Row-level security |

#### Stack Comparison

| Aspect | Firebase | DigitalOcean + Postgres | Winner |
|--------|----------|-------------------------|--------|
| Complex queries | Hard | Easy (SQL) | DO |
| Relational data | Awkward | Natural | DO |
| Stripe billing | Build yourself | Starter has it | DO |
| Real-time updates | Built-in | Extra work (Socket.io) | Firebase |
| Mobile offline | Built-in | Manual | Firebase |
| Cost at scale | Unpredictable | Predictable | DO |
| Vendor lock-in | High | Low | DO |

#### Final Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      MOTOTOUR PRO                            │
├─────────────────────────────────────────────────────────────┤
│  Frontend        │  Next.js 14 + React + Tailwind CSS       │
│  Backend         │  Next.js API Routes + Prisma             │
│  Database        │  PostgreSQL (DO Managed)                 │
│  Auth            │  NextAuth (magic links + Google)         │
│  Payments        │  Stripe (subscriptions + Connect)        │
│  Email           │  Resend or SendGrid                      │
│  File Storage    │  DigitalOcean Spaces                     │
│  Mobile          │  PWA first, native app later             │
│  Hosting         │  DigitalOcean App Platform               │
│  Starter Kit     │  sea-notes-saas-starter-kit (modified)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### MVP Schema (Simplified)

This is what 90% of operators actually need. Forget the Baja complexity.

```prisma
// ============ MULTI-TENANT ============
model Organization {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique  // mototourpro.com/org-slug
  logo             String?
  contactEmail     String
  stripeCustomerId String?

  owner            User     @relation("OrgOwner", fields: [ownerId], references: [id])
  ownerId          String

  subscription     Subscription?
  members          OrgMember[]
  tours            Tour[]

  createdAt        DateTime @default(now())
}

model OrgMember {
  id             String       @id @default(uuid())
  organization   Organization @relation(fields: [orgId], references: [id])
  orgId          String
  user           User         @relation(fields: [userId], references: [id])
  userId         String
  role           OrgRole      @default(MEMBER)

  @@unique([orgId, userId])
}

enum OrgRole { OWNER, ADMIN, MEMBER }

// ============ USERS ============
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  name            String
  phone           String?
  passwordHash    String?
  image           String?
  emailVerified   DateTime?

  ownedOrgs       Organization[] @relation("OrgOwner")
  memberships     OrgMember[]
  registrations   Registration[]

  createdAt       DateTime  @default(now())
}

// ============ TOURS (MVP - SIMPLE) ============
model Tour {
  id               String     @id @default(uuid())
  organization     Organization @relation(fields: [orgId], references: [id])
  orgId            String

  // Basics
  name             String
  slug             String
  description      String?
  startDate        DateTime
  endDate          DateTime
  status           TourStatus @default(DRAFT)

  // Capacity
  maxRiders        Int

  // Pricing (SIMPLE - single price)
  price            Decimal
  depositAmount    Decimal
  depositRequired  Boolean    @default(true)

  // Registration
  registrationOpen     Boolean   @default(false)
  registrationDeadline DateTime?
  inviteCode           String?   @unique

  // Info for riders
  meetingPoint     String?
  meetingTime      DateTime?
  itineraryUrl     String?
  gpxFileUrl       String?

  registrations    Registration[]

  createdAt        DateTime @default(now())

  @@unique([orgId, slug])
}

enum TourStatus { DRAFT, OPEN, CLOSED, COMPLETED, CANCELED }

// ============ REGISTRATIONS ============
model Registration {
  id              String   @id @default(uuid())
  tour            Tour     @relation(fields: [tourId], references: [id])
  tourId          String
  rider           User     @relation(fields: [riderId], references: [id])
  riderId         String

  // Rider info (snapshot at registration time)
  fullName        String
  email           String
  phone           String?

  // Emergency contact
  emergencyName   String?
  emergencyPhone  String?

  // Bike info (optional, freeform)
  bikeInfo        String?

  // Status
  status          RegStatus @default(PENDING)

  // Payments (SIMPLE)
  amountDue       Decimal
  amountPaid      Decimal   @default(0)

  // Notes
  notes           String?

  payments        Payment[]

  createdAt       DateTime  @default(now())

  @@unique([tourId, riderId])
}

enum RegStatus { PENDING, CONFIRMED, WAITLIST, CANCELED }

// ============ PAYMENTS ============
model Payment {
  id              String   @id @default(uuid())
  registration    Registration @relation(fields: [registrationId], references: [id])
  registrationId  String

  amount          Decimal
  method          PaymentMethod
  stripePaymentId String?
  note            String?
  recordedBy      String

  createdAt       DateTime @default(now())
}

enum PaymentMethod { STRIPE, CASH, CHECK, VENMO, ZELLE, OTHER }

// ============ OPERATOR SUBSCRIPTIONS ============
model Subscription {
  id               String       @id @default(uuid())
  organization     Organization @relation(fields: [orgId], references: [id])
  orgId            String       @unique

  status           SubStatus
  plan             SubPlan
  stripeSubId      String?
  currentPeriodEnd DateTime?

  createdAt        DateTime @default(now())
}

enum SubStatus { TRIALING, ACTIVE, PAST_DUE, CANCELED }
enum SubPlan { FREE, STARTER, PRO, BUSINESS }
```

### Pro/Business Tier Schema Extensions

Add these ONLY when paying customers request them:

```prisma
// ============ PRO FEATURES ============

// Night-by-night configuration (like Baja)
model Night {
  id               String   @id @default(uuid())
  tour             Tour     @relation(fields: [tourId], references: [id])
  tourId           String

  nightNumber      Int
  date             DateTime
  location         String

  // Accommodation options
  hotelAvailable   Boolean  @default(false)
  hotelName        String?
  hotelCost        Decimal?
  campingAvailable Boolean  @default(false)
  campingCost      Decimal?

  // Meals
  dinnerAvailable  Boolean  @default(false)
  dinnerCost       Decimal?

  selections       NightSelection[]

  @@unique([tourId, nightNumber])
}

model NightSelection {
  id              String   @id @default(uuid())
  registration    Registration @relation(fields: [registrationId], references: [id])
  registrationId  String
  night           Night    @relation(fields: [nightId], references: [id])
  nightId         String

  accommodation   AccommodationType?
  dinner          Boolean  @default(false)

  @@unique([registrationId, nightId])
}

enum AccommodationType { HOTEL, CAMPING, OWN }

// ============ BUSINESS FEATURES ============

// Room assignments
model Room {
  id           String   @id @default(uuid())
  tour         Tour     @relation(fields: [tourId], references: [id])
  tourId       String
  nightId      String
  roomNumber   String
  roomType     RoomType
  occupants    Registration[]
}

enum RoomType { SINGLE, DOUBLE, TRIPLE }
```

---

## Feature Tiers

### What Goes Where

| Feature | Free Trial | Starter | Pro | Business |
|---------|------------|---------|-----|----------|
| Create tours | 1 tour | 5/year | 15/year | Unlimited |
| Riders per tour | 10 | 25 | 50 | 100 |
| Registration form | ✅ | ✅ | ✅ | ✅ |
| Stripe payments | ✅ | ✅ | ✅ | ✅ |
| Email confirmations | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| CSV export | ❌ | ✅ | ✅ | ✅ |
| Waitlist | ❌ | ✅ | ✅ | ✅ |
| Bulk email | ❌ | ✅ | ✅ | ✅ |
| Rider portal | ❌ | ✅ | ✅ | ✅ |
| Clone tour | ❌ | ✅ | ✅ | ✅ |
| Team members | 1 | 2 | 5 | Unlimited |
| Accommodation options | ❌ | ❌ | ✅ | ✅ |
| Financial reports | ❌ | ❌ | ✅ | ✅ |
| Room assignments | ❌ | ❌ | ❌ | ✅ |
| Custom fields | ❌ | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ❌ | Add-on |

### Feature Development Priority

```
MUST HAVE (MVP)           SHOULD HAVE (v1.1)       NICE TO HAVE (v2+)
─────────────────         ──────────────────       ──────────────────
✓ Operator signup         ○ Waitlist               ○ Room assignments
✓ Stripe billing          ○ Manual payments        ○ Accommodation picker
✓ Create tour             ○ Bulk email             ○ Waivers/e-sign
✓ Registration form       ○ Rider portal           ○ Mobile app
✓ Collect deposits        ○ CSV export             ○ API
✓ Payment dashboard       ○ Clone tour             ○ Marketplace
✓ Email confirmations     ○ Team members           ○ White-label
```

---

## MVP Scope

### What We're Building First (6 weeks)

```
┌─────────────────────────────────────────────────────────────┐
│                     MOTOTOUR PRO MVP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  OPERATOR SIGNS UP                                           │
│  └─ Create account, pick plan, enter Stripe billing         │
│  └─ Create organization (name, logo)                        │
│                                                              │
│  OPERATOR CREATES TOUR                                       │
│  └─ Name, dates, price, deposit, capacity                   │
│  └─ Meeting point, itinerary link (optional)                │
│  └─ Get shareable registration link                         │
│                                                              │
│  RIDER REGISTERS                                             │
│  └─ Fill form (name, email, phone, emergency contact)       │
│  └─ Pay deposit via Stripe                                  │
│  └─ Get confirmation email                                  │
│                                                              │
│  OPERATOR MANAGES                                            │
│  └─ Dashboard: see registrations, payment status            │
│  └─ Mark manual payments (cash, check)                      │
│  └─ Email all riders (simple compose)                       │
│  └─ Export list to CSV                                      │
│                                                              │
│  That's it. Ship it.                                         │
└─────────────────────────────────────────────────────────────┘
```

### MVP User Stories

**As an operator, I can:**
- [ ] Sign up and subscribe to a plan
- [ ] Create a tour with basic info and pricing
- [ ] Share a registration link with riders
- [ ] See who registered and who paid
- [ ] Record offline payments (cash, check)
- [ ] Send email to all registered riders
- [ ] Export registration list to CSV

**As a rider, I can:**
- [ ] Register for a tour via shared link
- [ ] Pay deposit with credit card
- [ ] Receive confirmation email
- [ ] View my registration details

---

## Development Timeline

### Phase 1: Foundation (Weeks 1-2)

```
Week 1:
├─ Fork DO starter kit
├─ Replace Material UI with Tailwind
├─ Set up PostgreSQL + Prisma
├─ Deploy empty shell to DO App Platform
├─ Configure Stripe for operator billing
└─ Basic auth (magic links)

Week 2:
├─ Organization CRUD
├─ Multi-tenant middleware
├─ Operator dashboard shell
└─ Subscription management
```

### Phase 2: Tours (Weeks 3-4)

```
Week 3:
├─ Tour CRUD (create, edit, list)
├─ Tour settings page
├─ Registration link generation
└─ Tour status management

Week 4:
├─ Public registration page
├─ Stripe Checkout for deposits
├─ Confirmation emails
└─ Registration dashboard
```

### Phase 3: Management (Weeks 5-6)

```
Week 5:
├─ Payment recording (manual)
├─ Payment dashboard
├─ Balance calculations
└─ Simple email composer

Week 6:
├─ CSV export
├─ Polish and bug fixes
├─ Landing page
└─ Documentation
```

### Post-MVP Phases

```
Phase 4 (Weeks 7-8): Waitlist, rider portal, clone tour
Phase 5 (Weeks 9-10): Bulk email, team members, reports
Phase 6 (Weeks 11-12): Accommodation options (Pro tier)
Phase 7 (Weeks 13-14): Room assignments (Business tier)
```

---

## Competitive Landscape

| Competitor | Focus | Price | Strengths | Weaknesses |
|------------|-------|-------|-----------|------------|
| **WeTravel** | Group travel | 2.9% + fees | Polished, established | Expensive, not moto-specific |
| **TourRadar** | Marketplace | Commission | Discovery, SEO | Not a tool, takes commission |
| **Eventbrite** | Events | Per-ticket fee | Well-known | Not for multi-day tours |
| **Checkfront** | Tours/rentals | $49-199/mo | Full-featured | Complex, overkill for small ops |
| **FareHarbor** | Tours/activities | Commission | Beautiful | Expensive, not moto-specific |
| **Spreadsheets** | DIY | Free | Familiar | Manual everything, error-prone |

### Our Positioning

**"The simple, affordable tour management platform built for motorcycle operators."**

- Simpler than Checkfront/FareHarbor
- Cheaper than WeTravel
- More purpose-built than Eventbrite
- More professional than spreadsheets

---

## Key Decisions

### Decided

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tech stack | DO + PostgreSQL | Better for relational data, queries |
| Starter kit | sea-notes-saas | Stripe billing included |
| UI framework | Tailwind (not Material) | Familiarity, flexibility |
| Mobile | PWA first | Faster to market, reassess later |
| Pricing | Subscription tiers | Predictable, scalable |
| MVP scope | Simple tours only | Ship fast, validate |

### To Decide

| Decision | Options | Needs |
|----------|---------|-------|
| Payment collection | Stripe Connect vs simple | Validate operator preference |
| Free tier | Yes/No/Trial only | Market testing |
| Domain | mototourpro.com? | Check availability |
| Branding | Logo, colors | Design work |

---

## Validated Pain Points (Operator Research)

### Tier 1: Everyone Needs This
- [ ] Collect rider info without Google Forms
- [ ] Collect deposits without chasing Venmo
- [ ] Track who paid without spreadsheets
- [ ] Email all riders without BCC lists
- [ ] Share itinerary without email attachments
- [ ] Emergency contacts accessible quickly

### Tier 2: Growing Operators Need This
- [ ] Waitlist when tours fill up
- [ ] Waivers without paper
- [ ] See rider history across tours
- [ ] Clone previous tour settings

### Tier 3: Large Operators Need This
- [ ] Room assignments (complex)
- [ ] Per-night accommodation options
- [ ] Financial reporting
- [ ] Team member access
- [ ] API for integrations

---

## Action Items

### Before Building

- [ ] **Talk to 5-10 tour operators** - validate pain points
- [ ] **Define ICP clearly** - who exactly is the customer?
- [ ] **Price test** - would they pay $29/mo? $49/mo?
- [ ] **Secure domain** - mototourpro.com or alternative
- [ ] **Create basic branding** - logo, colors

### Week 1 Kickoff

```
Day 1-2: Setup
├─ Fork DO starter
├─ Replace Material UI with Tailwind
├─ Set up local Postgres + Prisma
└─ Deploy empty shell to DO

Day 3-4: Database
├─ Implement MVP schema
├─ Run migrations
└─ Seed test data

Day 5-7: Multi-tenant
├─ Organization CRUD
├─ User ↔ Org relationships
└─ Tenant isolation middleware
```

### Success Metrics

| Metric | Target (Month 1) | Target (Month 6) |
|--------|------------------|------------------|
| Operators signed up | 10 | 50 |
| Paying customers | 3 | 20 |
| Tours created | 15 | 100 |
| Riders registered | 100 | 1,000 |
| MRR | $100 | $1,000 |

---

## Appendix: Baja Learnings

### What Worked
- Rider-facing UI/UX (keep the patterns)
- Real-time updates (nice but not critical)
- Email system (Resend/SendGrid)
- Mobile app for during-tour use

### What Was Over-Engineered
- Per-night accommodation selections
- Camping + hotel options
- Complex pricing calculations
- Room assignment system
- Per-meal selections

### What to Keep for Pro Tier
- Night-by-night configuration
- Accommodation picker
- Room assignments
- Financial ledger per rider

### What to Drop Entirely
- Manual Venmo/Zelle tracking (Stripe only)
- Complex per-person pricing calculations
- Push notifications (email is enough)

---

*Last Updated: December 2024*
