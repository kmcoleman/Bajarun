# Digital Signature Platform Specification

## Overview

Implementation spec for digital waiver signing system for the Baja Tour 2026 application using Zoho Sign API.

---

## Zoho Sign API Details

**Base URL:** `https://sign.zoho.com/api/v1`

**Authentication:** OAuth 2.0
- Authorizes applications without exposing passwords
- Requires `Zoho-oauthtoken <token>` header

**Pricing:** $0.50 per signature request
- Credits purchased in packs of 500
- No subscription fee or per-user licensing
- 50 free test envelopes per month

**Security:**
- AES-256 encryption at rest
- SSL/TLS encryption in transit
- Multi-factor verification
- Blockchain timestamping
- Audit trails

---

## Key API Endpoints

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create Document | POST | `/requests` |
| Update Document | POST | `/requests/{id}` |
| Submit for Signature | POST | `/requests/{id}/submit` |
| Get Document Status | GET | `/requests/{id}` |
| Get Field Types | GET | `/fieldtypes` |
| Get Documents List | GET | `/requests` |

---

## Workflow: Sending Document for Signature

### Step 1: Retrieve Field Types
```
GET https://sign.zoho.com/api/v1/fieldtypes
```

### Step 2: Upload Document with Recipient Details
```
POST https://sign.zoho.com/api/v1/requests
Content-Type: multipart/form-data
Authorization: Zoho-oauthtoken <token>
```

### Step 3: Add Fields and Submit
```
POST https://sign.zoho.com/api/v1/requests/{id}/submit
```

---

## Request Payload Structure

### Create Document Request
```json
{
  "requests": {
    "request_name": "Baja Tour 2026 Liability Waiver",
    "expiration_days": 30,
    "is_sequential": true,
    "email_reminders": true,
    "reminder_period": 7,
    "actions": [
      {
        "recipient_name": "Rider Name",
        "recipient_email": "rider@example.com",
        "action_type": "SIGN",
        "signing_order": 0,
        "verify_recipient": true,
        "verification_type": "EMAIL"
      }
    ]
  }
}
```

### Field Configuration
```json
{
  "field_type_name": "Signature",
  "x_coord": 100,
  "y_coord": 500,
  "page_no": 1,
  "abs_width": 200,
  "abs_height": 50,
  "is_mandatory": true,
  "document_id": "doc_id_here"
}
```

**Supported Field Types:**
- Signature
- Date
- Textfield
- Email
- Initials
- Checkbox

---

## Implementation Options

### Option A: Embedded Signing (Recommended)

1. Pre-create a waiver template in Zoho Sign with signature/date fields positioned
2. When user registers, call API to create a signing request using template
3. Redirect user to Zoho's signing page OR embed signing in iframe
4. Webhook callback notifies app when signed
5. Store signed document URL + completion timestamp in Firestore

**Pros:**
- Legally robust (audit trail, timestamping, blockchain)
- Professional signing experience
- Email notifications and reminders built-in

**Cons:**
- External dependency
- Cost per signature ($0.50)

### Option B: In-App Signature Pad

1. Use `react-signature-canvas` library for capturing signatures
2. Generate PDF with waiver text + embedded signature image
3. Upload to Firebase Storage
4. Store reference in Firestore

**Pros:**
- No external dependency
- No per-signature cost
- Full control over UX

**Cons:**
- Less legally robust (no audit trail, timestamping)
- Must build PDF generation
- No automatic reminders

---

## Recommended Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Registration   │────▶│  Cloud Function  │────▶│  Zoho Sign  │
│  (after terms)  │     │  createWaiver()  │     │     API     │
└─────────────────┘     └──────────────────┘     └─────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Firestore     │◀────│  Webhook Handler │◀────│  Callback   │
│  waivers/{uid}  │     │  waiverSigned()  │     │  (signed)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

---

## Firestore Schema

### Collection: `waivers/{odUserId}`

```typescript
interface Waiver {
  odUserId: string;
  odName: string;
  odEmail: string;
  zohoRequestId: string;
  status: 'pending' | 'signed' | 'declined' | 'expired';
  signedAt?: Timestamp;
  signedDocumentUrl?: string;
  documentType: 'liability_waiver' | 'photo_release';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `waiverTemplates/{templateId}`

```typescript
interface WaiverTemplate {
  templateId: string;
  zohoTemplateId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp;
}
```

---

## User Flow

1. **Registration Complete** → User sees "Sign Waiver" button
2. **Click Sign** → Cloud Function creates Zoho request
3. **Redirect** → User taken to Zoho signing page
4. **Sign** → User reviews and signs document
5. **Callback** → Webhook updates Firestore status
6. **Complete** → User sees "Waiver Signed ✓" in profile

---

## Admin Features

- View all waivers and their status
- Resend signing reminders
- Download signed documents
- Track who hasn't signed yet
- Bulk send waivers to all registered riders

---

## Cloud Functions Required

### 1. `createWaiverRequest`
- Triggered: When rider clicks "Sign Waiver"
- Actions: Creates Zoho Sign request, stores in Firestore
- Returns: Signing URL for redirect

### 2. `handleWaiverWebhook`
- Triggered: Zoho Sign webhook on status change
- Actions: Updates Firestore waiver status
- Stores: Signed document URL

### 3. `sendWaiverReminders`
- Triggered: Scheduled (daily)
- Actions: Check for unsigned waivers, send reminders

---

## Cost Estimate

| Item | Count | Cost |
|------|-------|------|
| Rider Waivers | ~25 | $12.50 |
| Pillion Waivers | ~5 | $2.50 |
| **Total** | ~30 | **$15.00** |

*Based on $0.50 per signature request*

---

## Security Considerations

1. Store Zoho OAuth credentials in Firebase environment config
2. Validate webhook signatures to prevent spoofing
3. Restrict waiver document access to owner and admin
4. Use HTTPS for all API calls
5. Audit log all waiver-related actions

---

## References

- [Zoho Sign API Reference](https://www.zoho.com/sign/api/)
- [API Introduction](https://www.zoho.com/sign/api/introduction.html)
- [Sending Documents Use Case](https://www.zoho.com/sign/api/use-cases/sending-a-document-for-signature.html)
- [API Pricing](https://www.zoho.com/sign/pricing-api.html)
- [Postman Collection](https://www.postman.com/zohosign/zoho-sign-api/documentation/71s1xhr/zoho-sign-api)

---

## Next Steps

1. [ ] Create Zoho Sign account and get API credentials
2. [ ] Design waiver PDF template with field placements
3. [ ] Upload template to Zoho Sign
4. [ ] Create Cloud Functions for API integration
5. [ ] Add "Sign Waiver" button to user profile/registration
6. [ ] Set up webhook endpoint for status updates
7. [ ] Add waiver status to admin dashboard
8. [ ] Test end-to-end flow with sandbox environment
