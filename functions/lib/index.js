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
exports.sendPushNotification = exports.onNewRegistration = exports.sendBulkEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const params_1 = require("firebase-functions/params");
// Initialize Firebase Admin
admin.initializeApp();
// ============================================================
// CONFIGURATION
// ============================================================
// SendGrid API key stored as a secret
const sendgridApiKey = (0, params_1.defineSecret)("SENDGRID_API_KEY");
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
//# sourceMappingURL=index.js.map