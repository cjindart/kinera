import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // TODO: Replace with your actual Firebase config from the Firebase Console:
  // 1. Go to https://console.firebase.google.com/
  // 2. Select your project (or create a new one)
  // 3. Click the gear icon next to "Project Overview" and select "Project settings"
  // 4. Scroll down to "Your apps" section and select your web app (or create one)
  // 5. Copy the firebaseConfig object values and replace these placeholders
  
  // IMPORTANT: Replace the placeholders below with your actual Firebase configuration
  // Example:
  // apiKey: "AIzaSyBvX-XyZ123456789abcdefghijk",
  // authDomain: "kinera-app.firebaseapp.com",
  // projectId: "kinera-app",
  // ...etc
  
  apiKey: "AIzaSyAxuR1sWinugIoS5XGwYGqbZb21wX14j9I",
  authDomain: "vouch-e7830.firebaseapp.com",
  projectId: "vouch-e7830",
  storageBucket: "vouch-e7830.firebasestorage.app",
  messagingSenderId: "812279492746",
  appId: "1:812279492746:web:2db7e5ff4747c1ee2c3d73",
  measurementId: "G-N8511L2EKX"
};

/**
 * Determines if the app is running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopmentMode = () => {
  // For now, always return true to force development mode behavior
  // This helps troubleshoot Firebase connectivity issues by focusing on local storage
  // Remove this override when Firebase is properly configured
  console.log("DEVELOPMENT MODE FORCED TO TRUE");
  return true;
  
  // Original logic, uncomment when ready for production
  // return process.env.NODE_ENV === 'development' || 
  //   __DEV__ || 
  //   firebaseConfig.projectId.includes('dev') || 
  //   firebaseConfig.projectId.includes('test');
};

/**
 * Enhanced logging for Firebase operations
 * @param {string} operation - The operation being performed
 * @param {string} details - Operation details
 * @param {Error} [error] - Optional error object
 */
export const logFirebaseOperation = (operation, details, error = null) => {
  if (error) {
    console.error(`Firebase ${operation} failed: ${details}`, error);
    
    // Log additional details for specific error types
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.message) {
      console.error(`Error message: ${error.message}`);
    }
    
    // Log stack trace in development
    if (isDevelopmentMode() && error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
  } else {
    console.log(`Firebase ${operation} succeeded: ${details}`);
  }
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics (if supported in this environment)
let analytics = null;

// Only attempt to initialize analytics in non-Expo environments or web
// We'll skip analytics initialization in Expo Go since it's not fully supported there
const initializeAnalytics = async () => {
  if (typeof window !== 'undefined' && !global.expo) {
    try {
      const analyticsSupported = await isSupported();
      if (analyticsSupported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized successfully');
      } else {
        console.log('Firebase Analytics is not supported in this environment');
      }
    } catch (error) {
      console.log('Error initializing Firebase Analytics:', error);
    }
  } else {
    console.log('Skipping Firebase Analytics in Expo environment');
  }
};

// Initialize analytics
initializeAnalytics().catch(error => {
  console.log('Failed to initialize analytics:', error);
});

// Show warning if using development mode
if (isDevelopmentMode()) {
  console.warn('⚠️ Using Firebase in development mode with dummy configuration. Authentication and database operations will be simulated.');
}

export { app, auth, db, storage, analytics, firebaseConfig }; 