"use strict";
/**
 * index.ts
 *
 * Cloud Functions for BMW Baja Tour 2026.
 * Handles bulk email sending via SendGrid.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTours = exports.seedProducts = exports.confirmOrder = exports.createPaymentIntent = exports.generateThumbnail = exports.sendPushNotification = exports.seedItinerary = exports.onNewRegistration = exports.sendPersonalizedEmails = exports.sendBulkEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const storage_1 = require("firebase-functions/v2/storage");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const params_1 = require("firebase-functions/params");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Firebase Admin
admin.initializeApp();
// ============================================================
// CONFIGURATION
// ============================================================
// SendGrid API key stored as a secret
const sendgridApiKey = (0, params_1.defineSecret)("SENDGRID_API_KEY");
// Stripe API key stored as a secret
const stripeSecretKey = (0, params_1.defineSecret)("STRIPE_SECRET_KEY");
// Admin UID - only this user can send emails
const ADMIN_UID = "kGEO7bTgqMMsDfXmkumneI44S9H2";
// From email address (must be verified in SendGrid)
const FROM_EMAIL = "kevin@futurepathdevelopment.com";
const FROM_NAME = "Baja Moto Tour 2026";
const REPLY_TO_EMAIL = "bmwriderkmc@gmail.com";
// ============================================================
// HELPER FUNCTIONS
// ============================================================
/**
 * Check if the requesting user is an admin
 */
function isAdmin(uid) {
    if (!uid)
        return false;
    return uid === ADMIN_UID;
}
/**
 * Verify admin access and throw if unauthorized
 */
function requireAdmin(auth) {
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in.");
    }
    if (!isAdmin(auth.uid)) {
        logger.warn("[BajaEmail] Unauthorized access attempt", { uid: auth.uid });
        throw new https_1.HttpsError("permission-denied", "Not authorized.");
    }
}
// ============================================================
// CLOUD FUNCTIONS
// ============================================================
/**
 * Send bulk email to Baja Tour participants
 */
exports.sendBulkEmail = (0, https_1.onCall)({
    secrets: [sendgridApiKey],
}, async (request) => {
    var _a;
    requireAdmin(request.auth);
    const { subject, body, recipientUids } = request.data;
    // Validate input
    if (!subject || !body) {
        throw new https_1.HttpsError("invalid-argument", "Subject and body are required");
    }
    logger.info("[BajaEmail] sendBulkEmail called", {
        uid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
        subject,
        bodyLength: (body === null || body === void 0 ? void 0 : body.length) || 0,
        recipientUids: recipientUids === "all" ? "all" : `${recipientUids.length} selected`,
    });
    const db = admin.firestore();
    try {
        // Initialize SendGrid
        mail_1.default.setApiKey(sendgridApiKey.value());
        // 1. Get recipients from registrations collection
        const registrationsSnapshot = await db.collection("registrations").get();
        let recipients = [];
        registrationsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.email) {
                // If specific UIDs provided, filter by them
                if (recipientUids === "all" || recipientUids.includes(data.uid)) {
                    recipients.push({
                        email: data.email,
                        fullName: data.fullName || "Rider",
                        uid: data.uid,
                    });
                }
            }
        });
        // Remove duplicates by email
        const uniqueEmails = new Map();
        recipients.forEach((r) => {
            uniqueEmails.set(r.email.toLowerCase(), { email: r.email, fullName: r.fullName });
        });
        recipients = Array.from(uniqueEmails.values()).map((r) => (Object.assign(Object.assign({}, r), { uid: "" })));
        logger.info("[BajaEmail] Sending to recipients", { count: recipients.length });
        if (recipients.length === 0) {
            return { sent: 0, failed: 0, errors: ["No recipients found"] };
        }
        // 2. Send emails
        let sent = 0;
        let failed = 0;
        const errors = [];
        for (const recipient of recipients) {
            try {
                // Extract first name
                const firstName = recipient.fullName.split(" ")[0] || "Rider";
                // Build HTML content
                const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Baja Moto Tour 2026</h1>
                </div>

                <!-- Body -->
                <div style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hi ${firstName},</p>
                  <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                    ${body.replace(/\n/g, "<br />")}
                  </div>
                </div>

                <!-- Footer -->
                <div style="padding: 20px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">Baja Moto Tour 2026</p>
                  <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">March 19-27, 2026</p>
                </div>
              </div>
            </body>
            </html>
          `;
                const emailData = {
                    to: recipient.email,
                    from: {
                        email: FROM_EMAIL,
                        name: FROM_NAME,
                    },
                    replyTo: REPLY_TO_EMAIL,
                    subject: subject,
                    html: htmlContent,
                };
                await mail_1.default.send(emailData);
                sent++;
                logger.info("[BajaEmail] Email sent to", { email: recipient.email });
            }
            catch (e) {
                failed++;
                const errorMessage = e instanceof Error ? e.message : "Unknown error";
                errors.push(`${recipient.email}: ${errorMessage}`);
                logger.error("[BajaEmail] Failed to send to", { email: recipient.email, error: errorMessage });
            }
        }
        logger.info("[BajaEmail] sendBulkEmail completed", { sent, failed });
        return { sent, failed, errors: errors.slice(0, 10) };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[BajaEmail] sendBulkEmail failed", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to send bulk email");
    }
});
/**
 * Send personalized emails with pre-rendered HTML content per recipient
 * Used for tour update emails with individual rider data
 */
exports.sendPersonalizedEmails = (0, https_1.onCall)({
    secrets: [sendgridApiKey],
}, async (request) => {
    var _a;
    requireAdmin(request.auth);
    const { emails } = request.data;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        throw new https_1.HttpsError("invalid-argument", "Emails array is required");
    }
    logger.info("[BajaEmail] sendPersonalizedEmails called", {
        uid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
        count: emails.length,
    });
    try {
        mail_1.default.setApiKey(sendgridApiKey.value());
        let sent = 0;
        let failed = 0;
        const errors = [];
        for (const email of emails) {
            try {
                const emailData = {
                    to: email.to,
                    from: {
                        email: FROM_EMAIL,
                        name: FROM_NAME,
                    },
                    replyTo: REPLY_TO_EMAIL,
                    subject: email.subject,
                    html: email.html,
                };
                await mail_1.default.send(emailData);
                sent++;
                logger.info("[BajaEmail] Personalized email sent", { to: email.to });
            }
            catch (e) {
                failed++;
                const errorMessage = e instanceof Error ? e.message : "Unknown error";
                errors.push(`${email.to}: ${errorMessage}`);
                logger.error("[BajaEmail] Failed to send personalized email", {
                    to: email.to,
                    error: errorMessage,
                });
            }
        }
        logger.info("[BajaEmail] sendPersonalizedEmails completed", { sent, failed });
        return { sent, failed, errors: errors.slice(0, 10) };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[BajaEmail] sendPersonalizedEmails failed", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to send personalized emails");
    }
});
/**
 * Automatically send welcome email when a new registration is created
 */
exports.onNewRegistration = (0, firestore_1.onDocumentCreated)({
    document: "registrations/{registrationId}",
    secrets: [sendgridApiKey],
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.warn("[BajaEmail] No data in registration event");
        return;
    }
    const data = snapshot.data();
    const email = data.email;
    const fullName = data.fullName || "Rider";
    const firstName = fullName.split(" ")[0];
    if (!email) {
        logger.warn("[BajaEmail] No email in registration");
        return;
    }
    logger.info("[BajaEmail] Sending welcome email", { email, fullName });
    try {
        // Initialize SendGrid
        mail_1.default.setApiKey(sendgridApiKey.value());
        // Format data for the email
        const bikeInfo = data.bikeYear && data.bikeModel
            ? `${data.bikeYear} ${data.bikeModel}`
            : "Not specified";
        const location = data.city && data.state
            ? `${data.city}, ${data.state}`
            : "Not specified";
        const participateGroup = data.participateGroup === true
            ? "Yes - Group accommodations and meals"
            : data.participateGroup === false
                ? "No - I'll handle my own"
                : "Undecided";
        const accommodationPref = data.accommodationPreference || "Not specified";
        // Use stored depositRequired if available, otherwise calculate
        // This ensures the email matches what was shown during registration
        let depositAmount;
        if (data.depositRequired && data.depositRequired > 0) {
            depositAmount = data.depositRequired;
        }
        else {
            const hasPillion = data.hasPillion === true;
            const baseDeposit = data.participateGroup === true ? 500 : 100;
            depositAmount = hasPillion ? baseDeposit * 2 : baseDeposit;
        }
        const depositRequired = `$${depositAmount}`;
        // Build HTML content
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Baja Moto Tour 2026</h1>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
              <h2 style="color: #1e40af; margin: 0 0 20px 0;">Welcome, ${firstName}!</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for registering for the Baja Moto Tour 2026! We're excited to have you join us for this epic adventure.
              </p>

              <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px;">Your Registration Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Name:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Location:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${location}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Motorcycle:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${bikeInfo}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Group Plan:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${participateGroup}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Accommodation Preference:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 500;">${accommodationPref}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #6b7280;">Deposit Required:</td>
                  <td style="padding: 10px; color: #1e40af; font-weight: 600;">${depositRequired}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px;">
                  <strong>Next Step:</strong> Please submit your deposit of ${depositRequired} to secure your spot.
                </p>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Venmo:</strong> @kevmc<br/>
                  <strong>Zelle:</strong> 9258908449
                </p>
              </div>

              <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px;">Tour Preferences:</h3>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                Please log in to the tour website and complete your selections so I can secure our reservations. Note there may be some further changes to specifics in a few of the locations but the overall plan is sound and won't change materially.
              </p>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                I have updated the Itinerary with more specifics about the route and added some helpful details in the Preference Selection page as well.
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;"><strong>What to do:</strong></p>
              <ol style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0 0 15px 0; padding-left: 20px;">
                <li>Go to <a href="https://bajarun.ncmotoadv.com/" style="color: #1e40af;">bajarun.ncmotoadv.com</a></li>
                <li>Click "Create Account / Sign In" (top right)</li>
                <li>Use the same email you registered with</li>
                <li>Once logged in, click "Tour Details" in the navigation menu or go to <a href="https://bajarun.ncmotoadv.com/my-selections" style="color: #1e40af;">My Selections</a></li>
              </ol>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;"><strong>What you'll select:</strong></p>
              <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0 0 15px 0; padding-left: 20px;">
                <li>Accommodation for each night (hotel, camping, or arrange your own)</li>
                <li>Group meals (dinners and breakfasts where available)</li>
                <li>Preferred roommate (or select "No preference")</li>
                <li>Dietary restrictions (vegetarian, allergies, etc.)</li>
                <li>Optional activities (whale watching tour, rest day side trips)</li>
              </ul>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;"><strong>Important notes:</strong></p>
              <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0 0 15px 0; padding-left: 20px;">
                <li>All prices shown are estimates (within +/- 10-15% of final cost)</li>
                <li>Single rooms are available on request in some locations but subject to availability</li>
                <li>You must select accommodation for each night before saving</li>
                <li>Based on what you select I may need to collect a small additional deposit from you. If that's the case I will send a separate email.</li>
              </ul>

              <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px;">Website Enhancements:</h3>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">My Ledger</strong> (Profile Menu)<br/>
                View your personal ledger by clicking your profile photo and selecting "My Ledger." This shows estimated charges based on your tour selections, posted charges (once costs are finalized), payments received, and your current account balance. This gives you visibility into where you stand financially for the trip. If you show a balance due, I'll be asking for additional deposits in the future so hold off on sending any money right now.
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">My Documents</strong> (Profile Menu)<br/>
                Upload and store important trip-related documents - things like a photo of your passport, insurance cards, vehicle registration, etc. This is completely optional, but can be a handy place to keep electronic copies of important info accessible from your phone during the trip. <em>Note: All documents will be permanently deleted after the ride ends.</em>
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">Logistics Tab</strong> (Main Menu)<br/>
                A new Logistics section in the main navigation with info on how to obtain your FMM tourist card online (required for Mexico entry) and motorcycle insurance options. I'll continue adding helpful information here as we get closer to the trip.
              </p>

              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                <strong style="color: #1e40af;">User Guide</strong> (Support Menu)<br/>
                Need help navigating the website? Check out our <a href="https://bajarun.ncmotoadv.com/guide" style="color: #1e40af;">User Guide</a> which provides helpful details on all the website functionality including step-by-step instructions for each feature.
              </p>

              <h3 style="color: #374151; margin: 30px 0 15px 0; font-size: 18px;">Other Info:</h3>
              <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>I will organize a call in early January to discuss the tour and help us get organized.</li>
                <li>Use the tour <a href="https://bajarun.ncmotoadv.com/discussion" style="color: #1e40af;">Forum page</a> if you have ideas or input you want to share with the group.</li>
              </ul>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                Check out the website at <a href="https://bajarun.ncmotoadv.com/" style="color: #1e40af;">bajarun.ncmotoadv.com</a>
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                If you have any questions, feel free to reply to this email or check out the FAQ on our website.
              </p>

              <p style="color: #374151; font-size: 16px; margin-top: 20px;">
                See you on the road!<br/>
                <strong>Baja Moto Tour Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Baja Moto Tour 2026</p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">March 19-27, 2026</p>
            </div>
          </div>
        </body>
        </html>
      `;
        const emailData = {
            to: email,
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME,
            },
            replyTo: REPLY_TO_EMAIL,
            subject: "Welcome to Baja Moto Tour 2026!",
            html: htmlContent,
        };
        await mail_1.default.send(emailData);
        logger.info("[BajaEmail] Welcome email sent", { email });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[BajaEmail] Failed to send welcome email", { email, error: errorMessage });
    }
});
/**
 * Seed itinerary data to Firestore
 * Admin-only function to populate eventConfig/itinerary document
 */
exports.seedItinerary = (0, https_1.onCall)(async (request) => {
    var _a;
    requireAdmin(request.auth);
    const db = admin.firestore();
    // Itinerary data
    const itineraryDays = [
        {
            day: 1,
            date: "March 19, 2026",
            title: "Arrival & Meet in Temecula",
            description: "Riders make their way to Temecula, California on their own to meet up for orientation, bike checks, and welcome dinner. We'll review the route, safety protocols, and get to know fellow riders before heading south together.",
            miles: 0,
            ridingTime: "N/A",
            startPoint: "Temecula, CA",
            endPoint: "Temecula, CA",
            accommodation: "Best Western Plus Temecula",
            accommodationType: "hotel",
            accommodationLinks: [
                { name: "Best Western Plus Temecula", url: "https://bestwesternplustemecula.bookonline.com/hotel/best-western-plus-temecula-wine-country-hotel-&suites?id2=129193716631", type: "hotel" },
            ],
            pointsOfInterest: [
                "Welcome dinner and orientation",
                "Bike inspection and preparation",
                "Route briefing and safety review",
                "Document check (passport, insurance, registration)",
            ],
            coordinates: { start: [33.4936, -117.1484], end: [33.4936, -117.1484] },
        },
        {
            day: 2,
            date: "March 20, 2026",
            title: "Temecula to Rancho Meling",
            description: "This journey begins in the rolling vineyards of Temecula, climbing through the scenic mountain twisties of San Diego County before crossing the border at the relaxed, high-altitude Tecate gate. Once in Mexico, you'll head south on Highway 3 through the world-class wineries of the Valle de Guadalupe and into the rugged ranch lands of the Sierra de San Pedro Mártir. The ride concludes at the historic Rancho Meling, a 10,000-acre working cattle ranch nestled in an oak-dotted valley at the foot of Baja's highest peaks.",
            miles: 273,
            ridingTime: "6 hours",
            startPoint: "Temecula, CA",
            endPoint: "Rancho Meling, BC",
            accommodation: "Shared Room ($55-70 PP) or Camping ($15)",
            accommodationType: "mixed",
            accommodationLinks: [{ name: "Rancho Meling", url: "https://ranchomeling.staydirectly.com", type: "hotel" }],
            pointsOfInterest: [
                "Tecate Border Crossing: Less-congested alternative to Tijuana into Baja's mountain scenery",
                "Valle de Guadalupe: The Napa Valley of Mexico with stunning vineyard vistas",
                "Ensenada Malecon: Vibrant waterfront boardwalk with massive Mexican flag",
                "Hussong's Cantina: Oldest cantina in Baja (est. 1892), birthplace of the Margarita",
                "La Bufadora: Marine geyser shooting seawater over 100 feet into the air",
                "Ojos Negros: Traditional ranching community famous for artisanal cheeses",
            ],
            coordinates: { start: [33.4936, -117.1484], end: [30.9667, -115.7500] },
            waypoints: [[32.576815, -116.627541]],
        },
        {
            day: 3,
            date: "March 21, 2026",
            title: "Rancho Meling to Laguna Ojo de Liebre",
            description: "Big riding day south through the Vizcaíno Desert to Guerrero Negro area. Camp at the famous Laguna Ojo de Liebre whale sanctuary where gray whales come to breed and give birth.",
            miles: 343,
            ridingTime: "7 hours",
            startPoint: "Rancho Meling, BC",
            endPoint: "Laguna Ojo de Liebre, BCS",
            accommodation: "Rustic Camping at Whale Preserve ($15)",
            accommodationType: "camping",
            pointsOfInterest: [
                "Vizcaíno Desert landscapes",
                "28th Parallel - Baja California Sur border",
                "Salt evaporation ponds",
                "Laguna Ojo de Liebre whale sanctuary",
                "Gray whale watching (seasonal)",
            ],
            coordinates: { start: [30.9667, -115.7500], end: [27.7500, -114.0333] },
        },
        {
            day: 4,
            date: "March 22, 2026",
            title: "Laguna Ojo de Liebre to Playa El Burro",
            description: "Leaving the Pacific salt flats of Ojo de Liebre, you will traverse the vast Vizcaíno Desert before ascending the volcanic switchbacks of the Cuesta del Infierno. The route then transforms into a lush river valley oasis at Mulegé, finally opening up to the jaw-dropping turquoise waters and white sand beaches of Bahía Concepción.",
            miles: 197,
            ridingTime: "4.25 hours",
            startPoint: "Laguna Ojo de Liebre, BCS",
            endPoint: "Playa El Burro, BCS",
            accommodation: "Beach Camping at Playa El Burro",
            accommodationType: "camping",
            pointsOfInterest: [
                "Guerrero Negro Salt Works: Largest sea salt evaporative pond in the world",
                "San Ignacio Oasis: Palm-fringed town with stunning 18th-century stone mission",
                "Volcán Las Tres Vírgenes: Towering dormant volcanoes near the Sea of Cortez",
                "Cuesta del Infierno: Thrilling steep switchbacks dropping to the coast",
                "Santa Rosalía: French-influenced mining town with Eiffel-designed iron church",
                "Panaderia El Boleo: Century-old bakery famous for French-style breads",
                "Mulegé River Overlook: Panoramic view of palm oasis meeting the sea",
            ],
            coordinates: { start: [27.7500, -114.0333], end: [26.729599, -111.907063] },
        },
        {
            day: 5,
            date: "March 23, 2026",
            title: "Bahía Concepción - Rest Day",
            description: "Rest day to explore the stunning beaches and coves of Bahía Concepción. Relax on the beach, take a short 30-minute ride into the charming town of Mulegé, or venture on a longer 90-minute ride south to the beautiful colonial town of Loreto.",
            miles: 0,
            ridingTime: "Rest day",
            startPoint: "Playa El Burro, BCS",
            endPoint: "Playa El Burro, BCS",
            accommodation: "Beach Camping at Playa El Burro",
            accommodationType: "camping",
            pointsOfInterest: [
                "Kayaking and snorkeling in crystal-clear waters",
                "Explore nearby beaches: Playa Santispac, Playa Coyote, Playa Requeson",
                "Visit the historic town of Mulegé (30 min ride)",
                "Visit the town of Loreto or head up to the historic Mission San Javier",
                "Fresh seafood at beachside palapas",
                "Optional: Cave paintings tour at Sierra de Guadalupe",
            ],
            coordinates: { start: [26.729599, -111.907063], end: [26.729599, -111.907063] },
        },
        {
            day: 6,
            date: "March 24, 2026",
            title: "Playa El Burro to Bahía de los Ángeles",
            description: "Head north along the Sea of Cortez to the remote fishing village of Bahía de los Ángeles. This isolated bay offers incredible scenery and a true Baja adventure experience.",
            miles: 311,
            ridingTime: "6.5 hours",
            startPoint: "Playa El Burro, BCS",
            endPoint: "Bahía de los Ángeles, BC",
            accommodation: "Camp Archelon or Los Vientos Hotel ($50-90 PP double)",
            accommodationType: "mixed",
            accommodationLinks: [
                { name: "Camp Archelon", url: "https://www.campoarchelon.com/about-us/", type: "camping" },
                { name: "Los Vientos Hotel", url: "https://www.hotelsone.com/bahia-de-los-angeles-hotels-mx/los-vientos-hotel.html", type: "hotel" },
            ],
            pointsOfInterest: [
                "Coastal Highway 1 scenery",
                "Remote desert landscapes on Highway 12",
                "Bahía de los Ángeles bay views",
                "Island views in the Sea of Cortez",
                "Camp Archelon sea turtle conservation",
            ],
            coordinates: { start: [26.729599, -111.907063], end: [28.9500, -113.5500] },
        },
        {
            day: 7,
            date: "March 25, 2026",
            title: "Bahía de los Ángeles to Tecate",
            description: "Traveling via Highway 5 offers a stunningly paved alternative to the interior route, following the dramatic coastline of the Sea of Cortez through some of Baja's most pristine landscapes.",
            miles: 390,
            ridingTime: "7.5 hours",
            startPoint: "Bahía de los Ángeles, BC",
            endPoint: "Tecate, BC",
            accommodation: "Santuario Diegueño",
            accommodationType: "hotel",
            accommodationLinks: [{ name: "Santuario Diegueño", url: "https://santuariodiegueno.com/en/", type: "hotel" }],
            pointsOfInterest: [
                "Gonzaga Bay",
                "The Puertecitos Twisties",
                "Valley of the Giants",
                "La Rumorosa Grade",
                "San Felipe Malecon",
            ],
            coordinates: { start: [28.9500, -113.5500], end: [32.576069, -116.619630] },
        },
        {
            day: 8,
            date: "March 26, 2026",
            title: "Tecate to Twentynine Palms",
            description: "Crossing the border into California, you will climb through the twisty mountain pines of Julian and the sweeping vistas of the Sunrise Scenic Byway before descending into the vast Anza-Borrego Desert.",
            miles: 200,
            ridingTime: "4.25 hours",
            startPoint: "Tecate, BC",
            endPoint: "Twentynine Palms, CA",
            accommodation: "Fairfield Inn & Suites Twentynine Palms",
            accommodationType: "hotel",
            accommodationLinks: [{ name: "Fairfield Inn & Suites Twentynine Palms", url: "https://www.marriott.com/hotels/travel/pspfi-fairfield-inn-and-suites-twentynine-palms-joshua-tree-national-park/", type: "hotel" }],
            pointsOfInterest: [
                "Julian: Historic gold-mining charm and legendary apple pies",
                "Sunrise Scenic Byway: High-elevation sweepers through Cleveland National Forest",
                "Anza-Borrego Desert State Park: Badlands and Sky Art sculptures",
                "Box Canyon Road: Dramatic narrow passage through colorful rock layers",
                "Joshua Tree National Park: Rock monoliths and iconic Joshua trees",
            ],
            coordinates: { start: [32.576069, -116.619630], end: [34.1356, -116.0542] },
            waypoints: [[33.076266, -116.598577]],
        },
        {
            day: 9,
            date: "March 27, 2026",
            title: "Twentynine Palms to Furnace Creek",
            description: "This route takes you from the high desert of Twentynine Palms into the heart of the Mojave National Preserve, where the paved road cuts through a silent, prehistoric landscape of cinder cones and vast sand dunes.",
            miles: 240,
            ridingTime: "4 hours",
            startPoint: "Twentynine Palms, CA",
            endPoint: "Furnace Creek, Death Valley",
            accommodation: "Camping at Furnace Creek",
            accommodationType: "camping",
            pointsOfInterest: [
                "Amboy Road & Ironage: Desolate desert straightaway with wide-open horizons",
                "Kelso Depot: Restored 1924 Spanish-style train station and visitor center",
                "Kelso Dunes: Massive singing sand dunes rising 600+ feet",
                "Mojave Cinder Cones: Field of 30+ dormant volcanic cones and lava flows",
                "Baker: World's Tallest Thermometer and last fuel stop before Death Valley",
            ],
            coordinates: { start: [34.1356, -116.0542], end: [36.4572, -116.8658] },
        },
    ];
    try {
        // Save to Firestore
        const docRef = db.collection("eventConfig").doc("itinerary");
        await docRef.set({
            days: itineraryDays,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
        });
        logger.info("[BajaItinerary] Itinerary seeded", { dayCount: itineraryDays.length });
        return { success: true, dayCount: itineraryDays.length };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[BajaItinerary] Failed to seed itinerary", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to seed itinerary");
    }
});
/**
 * Send push notification to all registered devices
 * Supports both FCM (web) and Expo (native app) tokens
 */
exports.sendPushNotification = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    requireAdmin(request.auth);
    const { title, body, priority } = request.data;
    // Validate input
    if (!title || !body) {
        throw new https_1.HttpsError("invalid-argument", "Title and body are required");
    }
    logger.info("[BajaPush] sendPushNotification called", {
        uid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
        title,
        bodyLength: (body === null || body === void 0 ? void 0 : body.length) || 0,
        priority,
    });
    const db = admin.firestore();
    const messaging = admin.messaging();
    try {
        // 1. Save announcement to Firestore
        const announcementRef = await db.collection("announcements").add({
            title,
            body,
            priority: priority || "normal",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: (_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid,
        });
        logger.info("[BajaPush] Announcement saved", { id: announcementRef.id });
        // 2. Get all tokens and separate FCM from Expo
        const tokensSnapshot = await db.collection("fcmTokens").get();
        const fcmTokens = [];
        const fcmTokenDocs = [];
        const expoTokens = [];
        const expoTokenDocs = [];
        tokensSnapshot.forEach((doc) => {
            const data = doc.data();
            const token = data.token;
            if (token) {
                // Expo tokens start with "ExponentPushToken["
                if (token.startsWith("ExponentPushToken[")) {
                    expoTokens.push(token);
                    expoTokenDocs.push({ id: doc.id, token });
                }
                else {
                    fcmTokens.push(token);
                    fcmTokenDocs.push({ id: doc.id, token });
                }
            }
        });
        logger.info("[BajaPush] Token counts", {
            fcm: fcmTokens.length,
            expo: expoTokens.length,
        });
        let fcmSent = 0;
        let fcmFailed = 0;
        let expoSent = 0;
        let expoFailed = 0;
        // 3. Send to FCM tokens (web PWA)
        if (fcmTokens.length > 0) {
            const message = {
                notification: {
                    title,
                    body,
                },
                data: {
                    announcementId: announcementRef.id,
                    priority,
                },
                tokens: fcmTokens,
                android: {
                    priority: priority === "high" ? "high" : "normal",
                },
                apns: {
                    payload: {
                        aps: {
                            sound: priority === "high" ? "default" : undefined,
                        },
                    },
                },
            };
            const response = await messaging.sendEachForMulticast(message);
            fcmSent = response.successCount;
            fcmFailed = response.failureCount;
            logger.info("[BajaPush] FCM result", {
                successCount: response.successCount,
                failureCount: response.failureCount,
            });
            // Clean up invalid FCM tokens
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                var _a, _b;
                if (!resp.success) {
                    const errorCode = (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code;
                    if (errorCode === "messaging/invalid-registration-token" ||
                        errorCode === "messaging/registration-token-not-registered") {
                        invalidTokens.push(fcmTokenDocs[idx].id);
                    }
                    logger.warn("[BajaPush] FCM failed", {
                        error: (_b = resp.error) === null || _b === void 0 ? void 0 : _b.message,
                        code: errorCode,
                    });
                }
            });
            if (invalidTokens.length > 0) {
                const batch = db.batch();
                invalidTokens.forEach((tokenId) => {
                    batch.delete(db.collection("fcmTokens").doc(tokenId));
                });
                await batch.commit();
                logger.info("[BajaPush] Cleaned up invalid FCM tokens", { count: invalidTokens.length });
            }
        }
        // 4. Send to Expo tokens (native app)
        if (expoTokens.length > 0) {
            const messages = expoTokens.map((token) => ({
                to: token,
                sound: priority === "high" ? "default" : undefined,
                title,
                body,
                badge: 1,
                data: { announcementId: announcementRef.id, priority },
                // iOS-specific: make notification persist in notification center
                _contentAvailable: true,
            }));
            // Send to Expo Push API
            const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messages),
            });
            const expoResult = await expoResponse.json();
            logger.info("[BajaPush] Expo result", { result: expoResult });
            // Count successes/failures and clean up invalid tokens
            const invalidExpoTokens = [];
            if (expoResult.data && Array.isArray(expoResult.data)) {
                expoResult.data.forEach((result, idx) => {
                    var _a;
                    if (result.status === "ok") {
                        expoSent++;
                    }
                    else {
                        expoFailed++;
                        // Check for invalid token errors
                        if (((_a = result.details) === null || _a === void 0 ? void 0 : _a.error) === "DeviceNotRegistered") {
                            invalidExpoTokens.push(expoTokenDocs[idx].id);
                        }
                        logger.warn("[BajaPush] Expo failed", { error: result });
                    }
                });
            }
            if (invalidExpoTokens.length > 0) {
                const batch = db.batch();
                invalidExpoTokens.forEach((tokenId) => {
                    batch.delete(db.collection("fcmTokens").doc(tokenId));
                });
                await batch.commit();
                logger.info("[BajaPush] Cleaned up invalid Expo tokens", { count: invalidExpoTokens.length });
            }
        }
        return {
            sent: fcmSent + expoSent,
            failed: fcmFailed + expoFailed,
            announcementId: announcementRef.id,
            details: {
                fcm: { sent: fcmSent, failed: fcmFailed },
                expo: { sent: expoSent, failed: expoFailed },
            },
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[BajaPush] sendPushNotification failed", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to send push notification");
    }
});
// ============================================================
// THUMBNAIL GENERATION
// ============================================================
const THUMBNAIL_MAX_WIDTH = 400;
const THUMBNAIL_PREFIX = "thumb_";
/**
 * Generate thumbnail when an image is uploaded to the gallery
 * Triggers on files uploaded to gallery/bajarun2026/*
 */
exports.generateThumbnail = (0, storage_1.onObjectFinalized)({
    memory: "512MiB",
}, async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    // Only process gallery uploads
    if (!filePath || !filePath.startsWith("gallery/bajarun2026/")) {
        logger.info("[Thumbnail] Skipping non-gallery file", { filePath });
        return;
    }
    // Skip if already a thumbnail
    const fileName = path.basename(filePath);
    if (fileName.startsWith(THUMBNAIL_PREFIX)) {
        logger.info("[Thumbnail] Skipping thumbnail file", { filePath });
        return;
    }
    // Only process images
    if (!contentType || !contentType.startsWith("image/")) {
        logger.info("[Thumbnail] Skipping non-image file", { filePath, contentType });
        return;
    }
    logger.info("[Thumbnail] Processing image", { filePath, contentType });
    const bucket = admin.storage().bucket(event.data.bucket);
    const fileDir = path.dirname(filePath);
    const fileExtension = path.extname(filePath);
    const fileNameWithoutExt = path.basename(filePath, fileExtension);
    // Paths
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const thumbnailFileName = `${THUMBNAIL_PREFIX}${fileNameWithoutExt}.webp`;
    const tempThumbPath = path.join(os.tmpdir(), thumbnailFileName);
    const thumbStoragePath = path.join(fileDir, thumbnailFileName);
    try {
        // Download original to temp
        await bucket.file(filePath).download({ destination: tempFilePath });
        logger.info("[Thumbnail] Downloaded original", { tempFilePath });
        // Generate thumbnail with sharp
        await (0, sharp_1.default)(tempFilePath)
            .resize(THUMBNAIL_MAX_WIDTH, null, {
            fit: "inside",
            withoutEnlargement: true,
        })
            .webp({ quality: 80 })
            .toFile(tempThumbPath);
        logger.info("[Thumbnail] Generated thumbnail", { tempThumbPath });
        // Upload thumbnail
        await bucket.upload(tempThumbPath, {
            destination: thumbStoragePath,
            metadata: {
                contentType: "image/webp",
                metadata: {
                    originalFile: filePath,
                },
            },
        });
        // Get signed URL for thumbnail (valid for 10 years)
        const [thumbnailUrl] = await bucket.file(thumbStoragePath).getSignedUrl({
            action: "read",
            expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
        });
        logger.info("[Thumbnail] Uploaded thumbnail", { thumbStoragePath, thumbnailUrl });
        // Update Firestore document with thumbnail URL
        // Find the document by matching the storage filename
        const db = admin.firestore();
        const mediaRef = db.collection("events").doc("bajarun2026").collection("media");
        // Query for documents that match this file (by checking if url contains the filename)
        const querySnapshot = await mediaRef.get();
        let updatedCount = 0;
        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            // Match by filename pattern in URL
            if (data.url && data.url.includes(fileNameWithoutExt)) {
                await docSnapshot.ref.update({
                    thumbnailUrl: thumbnailUrl,
                    thumbnailGenerated: admin.firestore.FieldValue.serverTimestamp(),
                });
                updatedCount++;
                logger.info("[Thumbnail] Updated Firestore document", { docId: docSnapshot.id });
            }
        }
        if (updatedCount === 0) {
            logger.warn("[Thumbnail] No matching Firestore document found", { fileName });
        }
        // Cleanup temp files
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(tempThumbPath);
        logger.info("[Thumbnail] Generation complete", {
            original: filePath,
            thumbnail: thumbStoragePath,
            updatedDocs: updatedCount,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Thumbnail] Generation failed", { filePath, error: errorMessage });
        // Cleanup temp files on error
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        if (fs.existsSync(tempThumbPath)) {
            fs.unlinkSync(tempThumbPath);
        }
    }
});
/**
 * Create a Stripe PaymentIntent for the store
 * Returns the client secret for the mobile payment sheet
 */
exports.createPaymentIntent = (0, https_1.onCall)({
    secrets: [stripeSecretKey],
}, async (request) => {
    // Require authentication
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in to make a purchase.");
    }
    const { items, customerEmail, shippingRequired } = request.data;
    // Validate items
    if (!items || items.length === 0) {
        throw new https_1.HttpsError("invalid-argument", "Cart is empty.");
    }
    logger.info("[Stripe] Creating PaymentIntent", {
        uid: request.auth.uid,
        itemCount: items.length,
        customerEmail,
    });
    try {
        // Initialize Stripe
        const stripe = new stripe_1.default(stripeSecretKey.value(), {
            apiVersion: "2025-12-15.clover",
        });
        // Calculate total (items already have price in cents)
        const amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (amount < 50) {
            throw new https_1.HttpsError("invalid-argument", "Minimum order amount is $0.50.");
        }
        // Create PaymentIntent
        const email = customerEmail || request.auth.token.email || "";
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            receipt_email: email || undefined,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                uid: request.auth.uid,
                email: email,
                items: JSON.stringify(items.map((i) => ({
                    id: i.productId,
                    name: i.name,
                    qty: i.quantity,
                    variant: i.variant,
                }))),
            },
        });
        logger.info("[Stripe] PaymentIntent created", {
            id: paymentIntent.id,
            amount,
        });
        // Save order to Firestore (pending status)
        const db = admin.firestore();
        await db.collection("orders").doc(paymentIntent.id).set({
            uid: request.auth.uid,
            email: customerEmail || request.auth.token.email || "",
            items,
            amount,
            status: "pending",
            shippingRequired: shippingRequired || false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Stripe] createPaymentIntent failed", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to create payment. Please try again.");
    }
});
/**
 * Confirm order after successful payment
 * Called by the app after payment sheet returns success
 */
exports.confirmOrder = (0, https_1.onCall)({
    secrets: [stripeSecretKey],
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in.");
    }
    const { paymentIntentId, shippingAddress } = request.data;
    if (!paymentIntentId) {
        throw new https_1.HttpsError("invalid-argument", "Payment ID required.");
    }
    logger.info("[Stripe] Confirming order", {
        uid: request.auth.uid,
        paymentIntentId,
    });
    try {
        // Verify payment with Stripe
        const stripe = new stripe_1.default(stripeSecretKey.value(), {
            apiVersion: "2025-12-15.clover",
        });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            throw new https_1.HttpsError("failed-precondition", "Payment not completed.");
        }
        // Update order in Firestore
        const db = admin.firestore();
        await db.collection("orders").doc(paymentIntentId).update({
            status: "paid",
            shippingAddress: shippingAddress || null,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info("[Stripe] Order confirmed", { paymentIntentId });
        return { success: true, orderId: paymentIntentId };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Stripe] confirmOrder failed", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to confirm order.");
    }
});
/**
 * Seed store products to Firestore
 * Admin-only function to populate products collection
 */
exports.seedProducts = (0, https_1.onCall)(async (request) => {
    requireAdmin(request.auth);
    const db = admin.firestore();
    const products = [
        {
            name: "Baseball Hat",
            description: "Classic NorCal Moto Adventure cap with embroidered logo",
            price: 2000,
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fhat.png?alt=media",
            category: "apparel",
            inStock: true,
            featured: true,
        },
        {
            name: "T-Shirt",
            description: "Comfortable cotton tee with tour graphic",
            price: 2000,
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fshirt.png?alt=media",
            category: "apparel",
            variants: [
                { id: "S", name: "Small" },
                { id: "M", name: "Medium" },
                { id: "L", name: "Large" },
                { id: "XL", name: "X-Large" },
            ],
            inStock: true,
        },
        {
            name: "Riding Jersey",
            description: "Moisture-wicking adventure jersey with tour branding",
            price: 8000,
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fjersey.png?alt=media",
            category: "apparel",
            variants: [
                { id: "S", name: "Small" },
                { id: "M", name: "Medium" },
                { id: "L", name: "Large" },
                { id: "XL", name: "X-Large" },
            ],
            inStock: true,
        },
        {
            name: "Camping Gear Rental - Weekend",
            description: "Tent, sleeping bag, and pad for a weekend adventure",
            price: 2500,
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2FCamping%20Gear.png?alt=media",
            category: "gear",
            inStock: true,
        },
        {
            name: "Camping Gear Rental - Week",
            description: "Tent, sleeping bag, and pad for a full week",
            price: 5000,
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2FCamping%20Gear.png?alt=media",
            category: "gear",
            inStock: true,
        },
        {
            name: "Custom Trip Planning",
            description: "Routes, campgrounds, hotels, GPX files + two 30-min consultations",
            price: 10000,
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fcustom.jpeg?alt=media",
            category: "service",
            inStock: true,
            featured: true,
        },
    ];
    try {
        const batch = db.batch();
        for (const product of products) {
            const docRef = db.collection("products").doc();
            batch.set(docRef, Object.assign(Object.assign({}, product), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        await batch.commit();
        logger.info("[Store] Products seeded", { count: products.length });
        return { success: true, count: products.length };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Store] Failed to seed products", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to seed products");
    }
});
// ============================================================
// TOURS MANAGEMENT
// ============================================================
/**
 * Seed tours collection with available tours
 * Admin-only function to populate tours collection
 */
exports.seedTours = (0, https_1.onCall)(async (request) => {
    requireAdmin(request.auth);
    const db = admin.firestore();
    const tours = [
        {
            id: "bajarun2026",
            name: "Baja Run 2026",
            description: "Epic 9-day motorcycle adventure through Baja California. From Temecula to Death Valley via the stunning beaches and deserts of Mexico.",
            imageUrl: "https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/tours%2Fbaja-2026.jpg?alt=media",
            startDate: admin.firestore.Timestamp.fromDate(new Date("2026-03-19")),
            endDate: admin.firestore.Timestamp.fromDate(new Date("2026-03-27")),
            status: "open",
            registrationOpen: true,
            maxParticipants: 20,
            depositAmount: 500,
        },
    ];
    try {
        const batch = db.batch();
        for (const tour of tours) {
            const docRef = db.collection("tours").doc(tour.id);
            batch.set(docRef, Object.assign(Object.assign({}, tour), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        await batch.commit();
        logger.info("[Tours] Tours seeded", { count: tours.length });
        return { success: true, count: tours.length };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Tours] Failed to seed tours", { error: errorMessage });
        throw new https_1.HttpsError("internal", "Failed to seed tours");
    }
});
//# sourceMappingURL=index.js.map