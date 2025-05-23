import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDev } from './devCheck';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Load configuration from environment variables or constants
// In a real app with Expo, you would typically use Constants.manifest.extra
// populated via app.config.js that pulls from .env files
const getFirebaseConfig = () => {
  // Check for Expo variables first
  const expoConstants = Constants.expoConfig?.extra || {};
  
  // Configuration sources in order of precedence:
  // 1. Expo Constants (populated from app.config.js)
  // 2. Environment variables
  // 3. Fallback to prevent crashes

  // Basic fallback to prevent crashes (replace with your actual values)
  const fallbackConfig = {
    apiKey: "AIzaSyAZQb0O_xtQkI4lwv7jPmkz7jIGhbBGWoM",
    authDomain: "vouch-e7830.firebaseapp.com",
    projectId: "vouch-e7830",
    storageBucket: "vouch-e7830.appspot.com",
    messagingSenderId: "517599462809",
    appId: "1:517599462809:web:cc63f6a61a4ee3bae2a37d"
  };

  const config = {
    apiKey: expoConstants.firebaseApiKey || process.env.FIREBASE_API_KEY || fallbackConfig.apiKey,
    authDomain: expoConstants.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
    projectId: expoConstants.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || fallbackConfig.projectId,
    storageBucket: expoConstants.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
    messagingSenderId: expoConstants.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
    appId: expoConstants.firebaseAppId || process.env.FIREBASE_APP_ID || fallbackConfig.appId,
    measurementId: expoConstants.firebaseMeasurementId || process.env.FIREBASE_MEASUREMENT_ID || null
  };

  // Log configuration for debugging
  console.log('🔧 Firebase Config Debug:', {
    source: expoConstants.firebaseApiKey ? 'expo' : process.env.FIREBASE_API_KEY ? 'env' : 'fallback',
    hasApiKey: !!config.apiKey && config.apiKey !== 'fallback-api-key',
    domain: config.authDomain,
    projectId: config.projectId
  });

  return config;
};

// Get the Firebase configuration
const firebaseConfig = getFirebaseConfig();

/**
 * IMPORTANT: If you're checking out this code from a public repository,
 * you should replace the Firebase config values with your own values.
 * 
 * For security in production:
 * 1. Create a .env file at the root of the KineraApp directory
 * 2. Add your Firebase configuration values (see .env.example)
 * 3. Use app.config.js to load these values into Expo constants
 */

/**
 * Determines if the app is running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopmentMode = () => {
  // FORCE PRODUCTION MODE with proper Firebase config
  console.log('🚀 Running in PRODUCTION mode with Firebase integration');
  return false;
  
  /* Original implementation disabled
  // Check environment variable first
  const envDevMode = process.env.FORCE_DEVELOPMENT_MODE === 'true';
  const expoDevMode = Constants.expoConfig?.extra?.forceDevelopmentMode === true;
  
  // *** TOGGLE THIS VALUE TO SWITCH BETWEEN DEV AND PROD MODE ***
  // Set to true for development mode (simulated authentication)
  // Set to false for production mode (real Firebase authentication)
  const FORCE_DEVELOPMENT_MODE = expoDevMode || envDevMode || false;  // <-- SET TO FALSE FOR PRODUCTION MODE
  
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
  */
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
let app, auth, db, storage;

try {
  console.log('🔥 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
} catch (error) {
  console.error('❌ Firebase app initialization failed:', error);
  // Create a mock app object to prevent crashes
  app = { name: 'fallback-app' };
}

// Get environment details
const isExpoGo = Constants.appOwnership === 'expo';
const isLocalhost = 
  Constants.expoConfig?.hostUri?.includes('localhost') || 
  Constants.expoConfig?.hostUri?.includes('127.0.0.1');

try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence);
    console.log('✅ Firebase auth initialized for web');
  } else {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
    console.log('✅ Firebase auth initialized for mobile');
  }
} catch (error) {
  console.error('❌ Firebase auth initialization failed:', error);
  // Create a mock auth object to prevent crashes
  auth = { currentUser: null };
}

// Initialize Firestore
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  // Create a mock db object to prevent crashes
  db = { collection: () => ({ doc: () => ({}) }) };
}

// Initialize Storage
try {
  storage = getStorage(app);
  console.log('✅ Firebase storage initialized');
} catch (error) {
  console.error('❌ Firebase storage initialization failed:', error);
  // Create a mock storage object to prevent crashes
  storage = { ref: () => ({}) };
}

// Initialize App Check in production mode
// if (!isDevelopmentMode() && !isExpoGo) {
//   try {
//     // Only initialize App Check in production web environments
//     if (Platform.OS === 'web') {
//       console.log('Initializing Firebase App Check');
//       
//       // Get reCAPTCHA key from environment variables or config
//       const recaptchaKey = Constants.expoConfig?.extra?.firebaseRecaptchaKey || 
//                            process.env.FIREBASE_RECAPTCHA_KEY || 
//                            '';
//       
//       // Replace with your reCAPTCHA site key
//       const appCheck = initializeAppCheck(app, {
//         provider: new ReCaptchaV3Provider(recaptchaKey),
//         isTokenAutoRefreshEnabled: true
//       });
//       
//       console.log('Firebase App Check initialized successfully');
//     } else {
//       console.log('Skipping App Check for non-web platform');
//     }
//   } catch (error) {
//     console.error('Error initializing App Check:', error);
//   }
// }

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