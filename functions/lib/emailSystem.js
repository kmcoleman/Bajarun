"use strict";
/**
 * emailSystem.ts
 *
 * NEW Email System - Configurable templates and triggers via admin panel.
 * This is completely separate from existing email functions.
 *
 * TO DELETE THIS SYSTEM:
 * 1. Delete this file
 * 2. Remove the import/export from index.ts
 * 3. Delete EmailSystemPage.tsx from frontend
 * 4. Remove route from App.tsx
 * 5. Remove menu link from Layout.tsx
 * 6. Delete Firestore collections: emailTriggers, emailLog
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
exports.emailSystemOnWaitlistCreate = exports.emailSystemOnUserUpdate = exports.emailSystemOnUserCreate = exports.emailSystemOnRegistrationUpdate = exports.emailSystemOnRegistrationCreate = exports.emailSystemPreview = exports.emailSystemGetRiders = exports.emailSystemSendBulk = exports.emailSystemSendOne = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const params_1 = require("firebase-functions/params");
// ============================================================
// CONFIGURATION
// ============================================================
const sendgridApiKey = (0, params_1.defineSecret)("SENDGRID_API_KEY");
const ADMIN_UID = "kGEO7bTgqMMsDfXmkumneI44S9H2";
const FROM_EMAIL = "kevin@futurepathdevelopment.com";
const FROM_NAME = "Baja Moto Tour 2026";
const REPLY_TO_EMAIL = "bmwriderkmc@gmail.com";
// ============================================================
// HELPER FUNCTIONS
// ============================================================
function isAdmin(uid) {
    return uid === ADMIN_UID;
}
function requireAdmin(auth) {
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in.");
    }
    if (!isAdmin(auth.uid)) {
        throw new https_1.HttpsError("permission-denied", "Not authorized.");
    }
}
/**
 * Simple template rendering - replaces {{variable}} with values
 * Supports nested paths like {{user.name}}
 */
function renderTemplate(template, data) {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
        const keys = key.split(".");
        let value = data;
        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            }
            else {
                value = undefined;
                break;
            }
        }
        return value !== undefined && value !== null ? String(value) : match;
    });
}
/**
 * Build email data from document using dataMapping
 */
function buildEmailData(docData, dataMapping) {
    var _a;
    const result = {};
    for (const [templateVar, sourceExpr] of Object.entries(dataMapping)) {
        // Check if it's a template expression with {{}}
        if (sourceExpr.includes("{{")) {
            result[templateVar] = renderTemplate(sourceExpr, docData);
        }
        else {
            // Direct field reference
            result[templateVar] = (_a = docData[sourceExpr]) !== null && _a !== void 0 ? _a : "";
        }
    }
    return result;
}
/**
 * Check if document matches trigger conditions
 */
function matchesConditions(docData, conditions) {
    if (!conditions || conditions.length === 0)
        return true;
    for (const condition of conditions) {
        const fieldValue = docData[condition.field];
        const compareValue = condition.value;
        switch (condition.operator) {
            case "==":
                if (String(fieldValue) !== compareValue)
                    return false;
                break;
            case "!=":
                if (String(fieldValue) === compareValue)
                    return false;
                break;
            case ">":
                if (Number(fieldValue) <= Number(compareValue))
                    return false;
                break;
            case "<":
                if (Number(fieldValue) >= Number(compareValue))
                    return false;
                break;
            case "contains":
                if (!String(fieldValue).includes(compareValue))
                    return false;
                break;
            case "exists":
                if (compareValue === "true" && !fieldValue)
                    return false;
                if (compareValue === "false" && fieldValue)
                    return false;
                break;
        }
    }
    return true;
}
/**
 * Wrap email body in styled HTML template
 */
function wrapInEmailTemplate(body) {
    return `
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
        <div style="padding: 30px; color: #374151; font-size: 16px; line-height: 1.6;">
          ${body}
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
}
/**
 * Log email send attempt to Firestore
 */
async function logEmailSend(db, entry) {
    try {
        await db.collection("emailLog").add(entry);
    }
    catch (error) {
        logger.error("[EmailSystem] Failed to log email", { error });
    }
}
// ============================================================
// CORE EMAIL SENDING FUNCTION
// ============================================================
/**
 * Send a templated email
 */
async function sendTemplatedEmailInternal(db, templateId, recipient, data, options) {
    try {
        // Get template
        const templateDoc = await db.collection("emailTemplates").doc(templateId).get();
        if (!templateDoc.exists) {
            throw new Error(`Template not found: ${templateId}`);
        }
        const template = templateDoc.data();
        // Render subject and body
        const subject = renderTemplate(template.subject, data);
        const bodyHtml = renderTemplate(template.body, data);
        const html = wrapInEmailTemplate(bodyHtml);
        // Send email
        await mail_1.default.send({
            to: recipient,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            replyTo: REPLY_TO_EMAIL,
            subject,
            html,
        });
        // Log success
        await logEmailSend(db, {
            triggerId: options.triggerId || null,
            templateId,
            templateName: template.name,
            recipient,
            subject,
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            sentBy: options.sentBy,
            documentId: options.documentId,
            collection: options.collection,
        });
        logger.info("[EmailSystem] Email sent", { recipient, templateId });
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Log failure
        await logEmailSend(db, {
            triggerId: options.triggerId || null,
            templateId,
            templateName: templateId,
            recipient,
            subject: "Failed to render",
            status: "failed",
            error: errorMessage,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            sentBy: options.sentBy,
            documentId: options.documentId,
            collection: options.collection,
        });
        logger.error("[EmailSystem] Email failed", { recipient, error: errorMessage });
        return { success: false, error: errorMessage };
    }
}
// ============================================================
// CALLABLE FUNCTIONS
// ============================================================
/**
 * Send a single templated email manually
 */
exports.emailSystemSendOne = (0, https_1.onCall)({ secrets: [sendgridApiKey] }, async (request) => {
    requireAdmin(request.auth);
    const { templateId, recipient, data } = request.data;
    if (!templateId || !recipient) {
        throw new https_1.HttpsError("invalid-argument", "templateId and recipient required");
    }
    logger.info("[EmailSystem] Manual send", { templateId, recipient });
    mail_1.default.setApiKey(sendgridApiKey.value());
    const db = admin.firestore();
    const result = await sendTemplatedEmailInternal(db, templateId, recipient, data, {
        sentBy: request.auth.uid,
    });
    if (!result.success) {
        throw new https_1.HttpsError("internal", result.error || "Failed to send email");
    }
    return { success: true };
});
/**
 * Send templated email to multiple recipients
 */
exports.emailSystemSendBulk = (0, https_1.onCall)({ secrets: [sendgridApiKey] }, async (request) => {
    requireAdmin(request.auth);
    const { templateId, recipients } = request.data;
    if (!templateId || !recipients || recipients.length === 0) {
        throw new https_1.HttpsError("invalid-argument", "templateId and recipients required");
    }
    logger.info("[EmailSystem] Bulk send", { templateId, count: recipients.length });
    mail_1.default.setApiKey(sendgridApiKey.value());
    const db = admin.firestore();
    let sent = 0;
    let failed = 0;
    const errors = [];
    for (const recipient of recipients) {
        const result = await sendTemplatedEmailInternal(db, templateId, recipient.email, recipient.data, { sentBy: request.auth.uid });
        if (result.success) {
            sent++;
        }
        else {
            failed++;
            errors.push(`${recipient.email}: ${result.error}`);
        }
    }
    return { sent, failed, errors: errors.slice(0, 10) };
});
/**
 * Get all riders with their data for manual email sending
 */
exports.emailSystemGetRiders = (0, https_1.onCall)(async (request) => {
    requireAdmin(request.auth);
    const db = admin.firestore();
    const snapshot = await db.collection("registrations").get();
    const riders = snapshot.docs.map((doc) => {
        var _a;
        const data = doc.data();
        return {
            id: doc.id,
            uid: data.uid,
            email: data.email,
            fullName: data.fullName,
            firstName: ((_a = data.fullName) === null || _a === void 0 ? void 0 : _a.split(" ")[0]) || "",
            phone: data.phone,
            city: data.city,
            state: data.state,
            bikeYear: data.bikeYear,
            bikeModel: data.bikeModel,
            balance: data.balance || 0,
            status: data.status,
        };
    });
    return { riders };
});
/**
 * Test render a template with sample data
 */
exports.emailSystemPreview = (0, https_1.onCall)(async (request) => {
    requireAdmin(request.auth);
    const { templateId, data } = request.data;
    if (!templateId) {
        throw new https_1.HttpsError("invalid-argument", "templateId required");
    }
    const db = admin.firestore();
    const templateDoc = await db.collection("emailTemplates").doc(templateId).get();
    if (!templateDoc.exists) {
        throw new https_1.HttpsError("not-found", "Template not found");
    }
    const template = templateDoc.data();
    const subject = renderTemplate(template.subject, data);
    const body = renderTemplate(template.body, data);
    const html = wrapInEmailTemplate(body);
    return { subject, html };
});
// ============================================================
// FIRESTORE TRIGGERS - Process email triggers on document changes
// ============================================================
/**
 * Generic handler for processing email triggers
 */
async function processEmailTriggers(collection, event, docId, docData) {
    const db = admin.firestore();
    // Initialize SendGrid - need to get the secret value
    // Note: For Firestore triggers, we need to access the secret differently
    const secretValue = process.env.SENDGRID_API_KEY;
    if (!secretValue) {
        logger.error("[EmailSystem] SendGrid API key not available");
        return;
    }
    mail_1.default.setApiKey(secretValue);
    // Get enabled triggers for this collection/event
    const triggersSnap = await db.collection("emailTriggers")
        .where("collection", "==", collection)
        .where("event", "==", event)
        .where("enabled", "==", true)
        .get();
    if (triggersSnap.empty) {
        logger.info("[EmailSystem] No triggers for", { collection, event });
        return;
    }
    logger.info("[EmailSystem] Processing triggers", {
        collection,
        event,
        docId,
        triggerCount: triggersSnap.size,
    });
    for (const triggerDoc of triggersSnap.docs) {
        const trigger = triggerDoc.data();
        // Check conditions
        if (!matchesConditions(docData, trigger.conditions)) {
            logger.info("[EmailSystem] Conditions not met", { triggerId: triggerDoc.id });
            continue;
        }
        // Get recipient email
        const recipient = docData[trigger.recipientField];
        if (!recipient) {
            logger.warn("[EmailSystem] No recipient", { triggerId: triggerDoc.id, field: trigger.recipientField });
            continue;
        }
        // Build data from mapping
        const emailData = buildEmailData(docData, trigger.dataMapping);
        // Send email
        await sendTemplatedEmailInternal(db, trigger.templateId, recipient, emailData, {
            triggerId: triggerDoc.id,
            documentId: docId,
            collection,
            sentBy: "system-trigger",
        });
        // Update trigger stats
        await triggerDoc.ref.update({
            lastTriggered: admin.firestore.FieldValue.serverTimestamp(),
            sendCount: admin.firestore.FieldValue.increment(1),
        });
    }
}
/**
 * Trigger for registrations collection - CREATE
 * Separate from existing onNewRegistration
 */
exports.emailSystemOnRegistrationCreate = (0, firestore_1.onDocumentCreated)({
    document: "registrations/{docId}",
    secrets: [sendgridApiKey],
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    // Set the API key for this invocation
    mail_1.default.setApiKey(sendgridApiKey.value());
    const docData = snapshot.data();
    await processEmailTriggers("registrations", "create", event.params.docId, docData);
});
/**
 * Trigger for registrations collection - UPDATE
 */
exports.emailSystemOnRegistrationUpdate = (0, firestore_1.onDocumentUpdated)({
    document: "registrations/{docId}",
    secrets: [sendgridApiKey],
}, async (event) => {
    var _a;
    const snapshot = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after;
    if (!snapshot)
        return;
    mail_1.default.setApiKey(sendgridApiKey.value());
    const docData = snapshot.data();
    await processEmailTriggers("registrations", "update", event.params.docId, docData);
});
/**
 * Trigger for users collection - CREATE
 */
exports.emailSystemOnUserCreate = (0, firestore_1.onDocumentCreated)({
    document: "users/{docId}",
    secrets: [sendgridApiKey],
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    mail_1.default.setApiKey(sendgridApiKey.value());
    const docData = snapshot.data();
    await processEmailTriggers("users", "create", event.params.docId, docData);
});
/**
 * Trigger for users collection - UPDATE
 */
exports.emailSystemOnUserUpdate = (0, firestore_1.onDocumentUpdated)({
    document: "users/{docId}",
    secrets: [sendgridApiKey],
}, async (event) => {
    var _a;
    const snapshot = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after;
    if (!snapshot)
        return;
    mail_1.default.setApiKey(sendgridApiKey.value());
    const docData = snapshot.data();
    await processEmailTriggers("users", "update", event.params.docId, docData);
});
/**
 * Trigger for waitlist collection - CREATE
 */
exports.emailSystemOnWaitlistCreate = (0, firestore_1.onDocumentCreated)({
    document: "waitlist/{docId}",
    secrets: [sendgridApiKey],
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    mail_1.default.setApiKey(sendgridApiKey.value());
    const docData = snapshot.data();
    await processEmailTriggers("waitlist", "create", event.params.docId, docData);
});
//# sourceMappingURL=emailSystem.js.map