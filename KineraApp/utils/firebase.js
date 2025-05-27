import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// Load configuration from environment variables or constants
const getFirebaseConfig = () => {
  const expoConstants = Constants.expoConfig?.extra || {};
  
  // Fallback configuration
  const fallbackConfig = {
    apiKey: "AIzaSyAZQb0O_xtQkI4lwv7jIGhbBGWoM",
    authDomain: "vouch-e7830.firebaseapp.com",
    projectId: "vouch-e7830",
    storageBucket: "vouch-e7830.appspot.com",
    messagingSenderId: "517599462809",
    appId: "1:517599462809:web:cc63f6a61a4ee3bae2a37d"
  };

  return {
    apiKey: expoConstants.firebaseApiKey || process.env.FIREBASE_API_KEY || fallbackConfig.apiKey,
    authDomain: expoConstants.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
    projectId: expoConstants.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || fallbackConfig.projectId,
    storageBucket: expoConstants.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
    messagingSenderId: expoConstants.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
    appId: expoConstants.firebaseAppId || process.env.FIREBASE_APP_ID || fallbackConfig.appId,
    measurementId: expoConstants.firebaseMeasurementId || process.env.FIREBASE_MEASUREMENT_ID || null
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase - single point of initialization
export function initFirebase() {
  if (!getApps().length) {
    console.log('🔥 Initializing Firebase app...');
    initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
  }
}

// Initialize Firebase and get auth instance
export const auth = (() => {
  initFirebase();
  const authInstance = getAuth();
  console.log('✅ Firebase auth instance created');
  return authInstance;
})();

// Initialize Firebase and get other services
export const db = (() => {
  initFirebase();
  const dbInstance = getFirestore();
  console.log('✅ Firestore instance created');
  return dbInstance;
})();

export const storage = (() => {
  initFirebase();
  const storageInstance = getStorage();
  console.log('✅ Firebase storage instance created');
  return storageInstance;
})();

// Export the config for components that need it
export { firebaseConfig };

// Legacy support - export individual getter functions for backward compatibility
export const getFirebaseAuth = () => auth;
export const getFirebaseApp = () => auth.app;
export const getFirebaseDb = () => db;
export const getFirebaseStorage = () => storage;
export const initializeFirebaseIfNeeded = () => {
  initFirebase();
  return { app: auth.app, auth, db, storage };
};

// Development mode function
export const isDevelopmentMode = () => false;

// Logging function
export const logFirebaseOperation = (operation, details, error = null) => {
  if (error) {
    console.error(`Firebase ${operation} failed: ${details}`, error);
  } else {
    console.log(`Firebase ${operation} succeeded: ${details}`);
  }
}; 