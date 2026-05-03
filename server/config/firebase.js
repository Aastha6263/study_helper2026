import admin  from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let firebaseApp    = null;
let messagingReady = false;

// ── Initialise Firebase Admin SDK ─────────────────────────────────────────────
export const initFirebase = () => {
  // Skip if already initialised or creds not provided
  if (firebaseApp) return firebaseApp;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn(
      '[Firebase] Credentials not found in .env — push notifications disabled.'
    );
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Newlines must be unescaped when stored in .env
        privateKey:  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    messagingReady = true;
    console.log('[Firebase] Admin SDK initialised. Push notifications enabled.');
    return firebaseApp;
  } catch (err) {
    console.error('[Firebase] Initialisation failed:', err.message);
    return null;
  }
};

// ── Send single push notification ─────────────────────────────────────────────
export const sendPushNotification = async ({
  fcmToken,
  title,
  body,
  data     = {},
  imageUrl = null,
}) => {
  if (!messagingReady) {
    console.warn('[Firebase] Push skipped — SDK not initialised.');
    return { success: false, reason: 'sdk_not_ready' };
  }

  if (!fcmToken) {
    return { success: false, reason: 'no_token' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: {
        // FCM data payload must be string values
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority:     'high',
        notification: {
          channelId: 'studysync_default',
          priority:  'high',
          sound:     'default',
          ...(imageUrl ? { imageUrl } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
        ...(imageUrl
          ? { fcmOptions: { imageUrl } }
          : {}),
      },
      webpush: {
        notification: {
          title,
          body,
          icon:  '/icons/logo-192.png',
          badge: '/icons/badge-72.png',
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        fcmOptions: {
          link: data.link || process.env.CLIENT_URL,
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[Firebase] Push sent → token: ${fcmToken.slice(0, 20)}… | id: ${response}`);
    return { success: true, messageId: response };
  } catch (err) {
    console.error('[Firebase] Push failed:', err.message);

    // Token is invalid/expired — caller should delete it
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
      return { success: false, reason: 'invalid_token', shouldDelete: true };
    }

    return { success: false, reason: err.message };
  }
};

// ── Send to multiple tokens (multicast) ──────────────────────────────────────
export const sendMulticastPush = async ({ fcmTokens, title, body, data = {} }) => {
  if (!messagingReady || !fcmTokens?.length) {
    return { success: false, reason: 'sdk_not_ready_or_no_tokens' };
  }

  try {
    const message = {
      tokens: fcmTokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android:  { priority: 'high' },
      apns:     { payload: { aps: { sound: 'default' } } },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const invalidTokens = [];
    response.responses.forEach((r, idx) => {
      if (
        !r.success &&
        (r.error?.code === 'messaging/invalid-registration-token' ||
         r.error?.code === 'messaging/registration-token-not-registered')
      ) {
        invalidTokens.push(fcmTokens[idx]);
      }
    });

    console.log(
      `[Firebase] Multicast: ${response.successCount} sent, ${response.failureCount} failed.`
    );

    return {
      success:       true,
      successCount:  response.successCount,
      failureCount:  response.failureCount,
      invalidTokens,
    };
  } catch (err) {
    console.error('[Firebase] Multicast failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// ── Subscribe tokens to a topic (e.g. room announcements) ────────────────────
export const subscribeToTopic = async (fcmTokens, topic) => {
  if (!messagingReady || !fcmTokens?.length) return { success: false };
  try {
    await admin.messaging().subscribeToTopic(fcmTokens, topic);
    console.log(`[Firebase] Subscribed ${fcmTokens.length} token(s) to topic: ${topic}`);
    return { success: true };
  } catch (err) {
    console.error('[Firebase] subscribeToTopic failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// ── Unsubscribe tokens from a topic ──────────────────────────────────────────
export const unsubscribeFromTopic = async (fcmTokens, topic) => {
  if (!messagingReady || !fcmTokens?.length) return { success: false };
  try {
    await admin.messaging().unsubscribeFromTopic(fcmTokens, topic);
    console.log(`[Firebase] Unsubscribed ${fcmTokens.length} token(s) from topic: ${topic}`);
    return { success: true };
  } catch (err) {
    console.error('[Firebase] unsubscribeFromTopic failed:', err.message);
    return { success: false, reason: err.message };
  }
};

// ── Send to a topic ───────────────────────────────────────────────────────────
export const sendToTopic = async ({ topic, title, body, data = {} }) => {
  if (!messagingReady) return { success: false, reason: 'sdk_not_ready' };
  try {
    const response = await admin.messaging().send({
      topic,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    });
    console.log(`[Firebase] Topic "${topic}" push sent | id: ${response}`);
    return { success: true, messageId: response };
  } catch (err) {
    console.error('[Firebase] sendToTopic failed:', err.message);
    return { success: false, reason: err.message };
  }
};

export default { initFirebase, sendPushNotification, sendMulticastPush };