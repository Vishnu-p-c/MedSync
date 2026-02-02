const admin = require('firebase-admin');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK using service account credentials
 * from environment variable FIREBASE_SERVICE_ACCOUNT_JSON
 */
function initializeFirebase() {
  // Prevent multiple initializations
  if (firebaseInitialized || admin.apps.length > 0) {
    return admin;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      console.warn(
          '⚠️  FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set. FCM notifications will not work.');
      return null;
    }

    // Parse the JSON string from environment variable
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error(
          '❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:',
          parseError.message);
      return null;
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin;

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
}

// Initialize on module load
initializeFirebase();

// Export the admin instance for use in other files
module.exports = admin;
