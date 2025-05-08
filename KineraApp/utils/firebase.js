import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDev } from './devCheck';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  // *** TOGGLE THIS VALUE TO SWITCH BETWEEN DEV AND PROD MODE ***
  // Set to true for development mode (simulated authentication)
  // Set to false for production mode (real Firebase authentication)
  const FORCE_DEVELOPMENT_MODE = true;  // <-- SET TO TRUE FOR DEVELOPMENT TESTING
  
  // If forced by developer, override automatic detection
  if (typeof FORCE_DEVELOPMENT_MODE === 'boolean') {
    const mode = FORCE_DEVELOPMENT_MODE ? 'DEVELOPMENT (FORCED)' : 'PRODUCTION (FORCED)';
    console.log(`🔄 Running in ${mode} mode`);
    return FORCE_DEVELOPMENT_MODE;
  }
  
  // Otherwise use our robust dev mode check
  const inDevMode = isDev();
  
  // Log the development mode status
  if (inDevMode) {
    console.log('💻 Running in DEVELOPMENT mode (auto-detected)');
  } else {
    console.log('🚀 Running in PRODUCTION mode (auto-detected)');
  }
  
  return inDevMode;
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

// Get environment details
const isExpoGo = Constants.appOwnership === 'expo';
const isLocalhost = 
  Constants.expoConfig?.hostUri?.includes('localhost') || 
  Constants.expoConfig?.hostUri?.includes('127.0.0.1');

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize App Check in production mode
if (!isDevelopmentMode() && !isExpoGo) {
  try {
    // Only initialize App Check in production web environments
    if (Platform.OS === 'web') {
      console.log('Initializing Firebase App Check');
      
      // Replace with your reCAPTCHA site key
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LdC-8AmAAAAAFY9ELk4-KqaTBfnJLwOuXbPPa9A'),
        isTokenAutoRefreshEnabled: true
      });
      
      console.log('Firebase App Check initialized successfully');
    } else {
      console.log('Skipping App Check for non-web platform');
    }
  } catch (error) {
    console.error('Error initializing App Check:', error);
  }
}

// Handle authentication based on environment
if (!isDevelopmentMode()) {
  console.log('Setting up Firebase for production mode');
  
  if (Platform.OS === 'web') {
    // For web, ensure we're using an authorized domain
    console.log('Web platform detected. Authorized domains required.');
    console.log('Current domain:', window.location.hostname);
    
    const validAuthDomains = [
      'vouch-e7830.firebaseapp.com',
      'vouch-e7830.web.app',
      'localhost',
      'exp://10.27.145.110:8081',  // Expo domain
      '10.27.145.110',             // Local IP
      '10.27.145.110:8081',        // Local IP with port
      'expo.dev'                   // Expo hosting domain
    ];
    
    if (!validAuthDomains.includes(window.location.hostname)) {
      console.warn('WARNING: Current domain is not in the list of authorized domains for Firebase Authentication.');
      console.warn('This may cause authentication issues.');
    }
  } else {
    // For Expo mobile apps
    console.log('Using local IP for Firebase authentication in production mode');
    
    // Set the Expo IP as local
    if (Constants.expoConfig?.hostUri?.includes('10.27.145.110')) {
      console.log('✅ Using local IP address (10.27.145.110) for production testing');
    } else {
      console.log('ℹ️ Current Expo host:', Constants.expoConfig?.hostUri);
    }
  }
} else {
  console.log('Development mode active - using simulated Firebase services.');
}

// Initialize Analytics (if supported in this environment)
let analytics = null;

// Only attempt to initialize analytics in production environments
const initializeAnalytics = async () => {
  if (!isDevelopmentMode() && typeof window !== 'undefined' && !global.expo) {
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
    console.log('Skipping Firebase Analytics in development environment');
  }
};

// Initialize analytics
initializeAnalytics().catch(error => {
  console.log('Failed to initialize analytics:', error);
});

// Show warning if using development mode
if (isDevelopmentMode()) {
  console.warn('⚠️ Using Firebase in development mode with dummy configuration. Authentication and database operations will be simulated.');
} else {
  console.log('📱 Firebase initialized in PRODUCTION mode. Using real authentication and database services.');
}

export { app, auth, db, storage, analytics, firebaseConfig }; 