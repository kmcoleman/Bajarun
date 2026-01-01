/**
 * Account Deletion - Cloud Functions for user account deletion
 * Implements Apple App Store requirement for account deletion
 * Including Sign in with Apple token revocation
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as jwt from "jsonwebtoken";

// Apple Sign in secrets (optional - for token revocation)
// Set these secrets if you want to support Apple Sign in token revocation:
// firebase functions:secrets:set APPLE_CLIENT_ID
// firebase functions:secrets:set APPLE_TEAM_ID
// firebase functions:secrets:set APPLE_KEY_ID
// firebase functions:secrets:set APPLE_PRIVATE_KEY

/**
 * Generate Apple client secret (JWT)
 * Required for Apple Sign in token revocation
 */
function generateAppleClientSecret(
  clientId: string,
  teamId: string,
  keyId: string,
  privateKey: string
): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 86400 * 180, // 180 days
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  // The private key from Apple needs newlines converted
  const formattedKey = privateKey.replace(/\\n/g, "\n");

  return jwt.sign(payload, formattedKey, {
    algorithm: "ES256",
    header: {
      alg: "ES256",
      kid: keyId,
    },
  });
}

/**
 * Revoke Apple Sign in token
 */
async function revokeAppleToken(
  token: string,
  clientId: string,
  clientSecret: string,
  tokenTypeHint: "access_token" | "refresh_token" = "refresh_token"
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: token,
      token_type_hint: tokenTypeHint,
    });

    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (response.ok) {
      logger.info("[AccountDeletion] Apple token revoked successfully");
      return true;
    } else {
      const errorText = await response.text();
      logger.warn("[AccountDeletion] Apple token revocation failed", {
        status: response.status,
        error: errorText,
      });
      // Don't fail the deletion if Apple revocation fails
      return false;
    }
  } catch (error) {
    logger.error("[AccountDeletion] Error revoking Apple token", {error});
    return false;
  }
}

/**
 * Delete all user data from Firestore
 */
async function deleteUserData(uid: string): Promise<void> {
  const db = admin.firestore();
  const batch = db.batch();

  // Delete from registrations collection
  const registrationDoc = db.collection("registrations").doc(uid);
  const registrationSnapshot = await registrationDoc.get();
  if (registrationSnapshot.exists) {
    batch.delete(registrationDoc);
    logger.info("[AccountDeletion] Marked registration for deletion", {uid});
  }

  // Delete from users collection
  const userDoc = db.collection("users").doc(uid);
  const userSnapshot = await userDoc.get();
  if (userSnapshot.exists) {
    batch.delete(userDoc);
    logger.info("[AccountDeletion] Marked user doc for deletion", {uid});
  }

  // Delete blocked users subcollection
  const blockedUsersRef = db.collection("users").doc(uid).collection("blockedUsers");
  const blockedSnapshot = await blockedUsersRef.get();
  blockedSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete from fcmTokens collection
  const fcmTokenDoc = db.collection("fcmTokens").doc(uid);
  const fcmSnapshot = await fcmTokenDoc.get();
  if (fcmSnapshot.exists) {
    batch.delete(fcmTokenDoc);
  }

  // Delete from accommodationSelections collection
  const accommodationDoc = db.collection("accommodationSelections").doc(uid);
  const accommodationSnapshot = await accommodationDoc.get();
  if (accommodationSnapshot.exists) {
    batch.delete(accommodationDoc);
  }

  // Delete ledger and subcollections
  const ledgerDoc = db.collection("ledger").doc(uid);
  const ledgerSnapshot = await ledgerDoc.get();
  if (ledgerSnapshot.exists) {
    // Delete charges subcollection
    const chargesRef = ledgerDoc.collection("charges");
    const chargesSnapshot = await chargesRef.get();
    chargesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete payments subcollection
    const paymentsRef = ledgerDoc.collection("payments");
    const paymentsSnapshot = await paymentsRef.get();
    paymentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(ledgerDoc);
  }

  // Delete discussion posts authored by user
  const postsQuery = db.collection("discussionPosts").where("authorUid", "==", uid);
  const postsSnapshot = await postsQuery.get();
  postsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete content reports by user
  const reportsQuery = db.collection("contentReports").where("reportedBy", "==", uid);
  const reportsSnapshot = await reportsQuery.get();
  reportsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Commit all deletions
  await batch.commit();
  logger.info("[AccountDeletion] User data deleted from Firestore", {uid});
}

/**
 * Delete account - callable function
 * Deletes user data from Firestore and Firebase Auth
 * Optionally revokes Apple Sign in token if credentials are configured
 */
export const deleteAccount = onCall(
  async (request) => {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in to delete account.");
    }

    const uid = request.auth.uid;
    const {appleAuthorizationCode, appleRefreshToken} = request.data as {
      appleAuthorizationCode?: string;
      appleRefreshToken?: string;
    };

    logger.info("[AccountDeletion] Account deletion requested", {
      uid,
      hasAppleCode: !!appleAuthorizationCode,
      hasAppleRefresh: !!appleRefreshToken,
    });

    try {
      // 1. Revoke Apple Sign in token if provided and credentials are configured
      if (appleAuthorizationCode || appleRefreshToken) {
        try {
          // Get Apple credentials from environment (if configured)
          const clientId = process.env.APPLE_CLIENT_ID;
          const teamId = process.env.APPLE_TEAM_ID;
          const keyId = process.env.APPLE_KEY_ID;
          const privateKey = process.env.APPLE_PRIVATE_KEY;

          if (clientId && teamId && keyId && privateKey) {
            const clientSecret = generateAppleClientSecret(
              clientId,
              teamId,
              keyId,
              privateKey
            );

            // Try refresh token first, then authorization code
            if (appleRefreshToken) {
              await revokeAppleToken(appleRefreshToken, clientId, clientSecret, "refresh_token");
            } else if (appleAuthorizationCode) {
              // First exchange authorization code for tokens
              const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  code: appleAuthorizationCode,
                  grant_type: "authorization_code",
                }).toString(),
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                if (tokenData.refresh_token) {
                  await revokeAppleToken(tokenData.refresh_token, clientId, clientSecret, "refresh_token");
                }
              }
            }
          } else {
            logger.warn("[AccountDeletion] Apple credentials not configured, skipping token revocation");
          }
        } catch (appleError) {
          // Log but don't fail - continue with deletion
          logger.error("[AccountDeletion] Apple token revocation error", {error: appleError});
        }
      }

      // 2. Delete user data from Firestore
      await deleteUserData(uid);

      // 3. Delete Firebase Auth account
      await admin.auth().deleteUser(uid);
      logger.info("[AccountDeletion] Firebase Auth account deleted", {uid});

      return {success: true, message: "Account deleted successfully"};
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("[AccountDeletion] Account deletion failed", {uid, error: errorMessage});
      throw new HttpsError("internal", "Failed to delete account. Please contact support.");
    }
  }
);

/**
 * Request account deletion (stores request for admin review)
 * Alternative for cases where immediate deletion isn't possible
 */
export const requestAccountDeletion = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in.");
    }

    const uid = request.auth.uid;
    const {reason} = request.data as {reason?: string};

    logger.info("[AccountDeletion] Deletion request submitted", {uid, reason});

    const db = admin.firestore();

    // Store deletion request
    await db.collection("accountDeletionRequests").add({
      uid,
      email: request.auth.token.email || "",
      reason: reason || "User requested deletion",
      status: "pending",
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Account deletion request submitted. Your account will be deleted within 24 hours.",
    };
  }
);
