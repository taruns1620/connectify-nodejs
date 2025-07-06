
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

console.log("[Firebase Config] Attempting to initialize with Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error("[Firebase Config] CRITICAL: NEXT_PUBLIC_FIREBASE_PROJECT_ID is undefined. Check your .env.local file and ensure it's loaded correctly.");
}
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.error("[Firebase Config] CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is undefined. Check your .env.local file.");
}

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase Config] Firebase initialized successfully.");
  } catch (error) {
    console.error("[Firebase Config] CRITICAL: Firebase initialization failed:", error);
    app = {} as FirebaseApp;
  }
} else {
  app = getApp();
  console.log("[Firebase Config] Firebase app already initialized.");
}

let db: Firestore;

if (typeof window !== 'undefined' && app.options?.projectId) { // Ensure app is initialized and it's client-side
  try {
    // Initialize Firestore with multi-tab persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
    console.log("[Firebase Config] Firestore initialized with multi-tab persistence.");
  } catch (error: any) {
    console.error("[Firebase Config] Error initializing Firestore with multi-tab persistence:", error.message);
    if (error.code === 'failed-precondition') {
      console.warn("[Firebase Config] Firestore multi-tab persistence failed (failed-precondition). This can happen if Firestore was already initialized or due to multiple tabs. Falling back to default.");
    } else {
      console.error("[Firebase Config] Firestore multi-tab persistence failed with an unexpected error:", error);
    }
    // Fallback to default Firestore instance if custom initialization fails
    db = getFirestore(app);
    console.log("[Firebase Config] Initialized Firestore with default settings as fallback.");
  }
} else {
  // For server-side, or if app initialization failed, initialize without persistence options
  db = getFirestore(app);
  if (typeof window !== 'undefined') {
      console.log("[Firebase Config] Firestore initialized with default settings (window, but app.options.projectId missing or persistence init skipped).");
  } else {
      console.log("[Firebase Config] Firestore initialized for server-side (no persistence).");
  }
}

const auth = getAuth(app);
const storage = getStorage(app);

// For development environments (when running `npm run dev`), disable app verification.
// This allows using test phone numbers (from Firebase Console -> Authentication -> Settings) without a real reCAPTCHA.
// In production, this block is skipped, and a real app verifier (reCAPTCHA) is required.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log("[Firebase Auth] Development mode detected. Disabling app verification for testing.");
    auth.settings.appVerificationDisabledForTesting = true;
}

export { app, db, auth, storage };
