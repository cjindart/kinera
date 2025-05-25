import { initializeApp } from 'firebase/app';
import { 
  getAuth as createAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { getFirestore as createFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as createStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics as createAnalytics, isSupported } from "firebase/analytics";
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

// Add validation for the configuration
console.log('🔧 Validating Firebase configuration...');
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required Firebase configuration fields:', missingFields);
  console.error('Available configuration:', Object.keys(firebaseConfig).reduce((acc, key) => {
    acc[key] = firebaseConfig[key] ? 'SET' : 'MISSING';
    return acc;
  }, {}));
} else {
  console.log('✅ All required Firebase configuration fields are present');
}

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

// Initialize Firebase with lazy loading and error handling
let app, auth, db, storage, analytics;
let firebaseInitialized = false;
let initializationError = null;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    if (initializationError) {
      throw initializationError;
    }
    return { app, auth, db, storage, analytics };
  }

  try {
    console.log('🔥 Initializing Firebase...');
    console.log('Firebase config being used:', {
      hasApiKey: !!firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId
    });
    
    // Validate that we have the required configuration
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
      throw new Error('Firebase API key is missing or invalid. Please check your environment variables.');
    }
    
    if (!firebaseConfig.projectId) {
      throw new Error('Firebase project ID is missing. Please check your environment variables.');
    }
    
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');

    // Get environment details
    const isExpoGo = Constants.appOwnership === 'expo';
    const isLocalhost = 
      Constants.expoConfig?.hostUri?.includes('localhost') || 
      Constants.expoConfig?.hostUri?.includes('127.0.0.1');

    // Initialize auth
    if (Platform.OS === 'web') {
      auth = createAuth(app);
      setPersistence(auth, browserLocalPersistence);
      console.log('✅ Firebase auth initialized for web');
    } else {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
      console.log('✅ Firebase auth initialized for mobile');
    }

    // Initialize Firestore
    db = createFirestore(app);
    console.log('✅ Firestore initialized');

    // Initialize Storage
    storage = createStorage(app);
    console.log('✅ Firebase storage initialized');

    firebaseInitialized = true;
    console.log('✅ All Firebase services initialized successfully');
    
    return { app, auth, db, storage, analytics };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('This will cause Firebase services to fail. Please check your environment variables.');
    initializationError = error;
    firebaseInitialized = true; // Mark as attempted so we don't retry
    throw error;
  }
};

// Lazy getters for Firebase services
const getFirebaseServices = () => {
  try {
    return initializeFirebase();
  } catch (error) {
    // In development or when Firebase fails, provide mock services
    console.warn('⚠️ Firebase initialization failed, providing mock services for development');
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
      analytics: null
    };
  }
};

// Export services with lazy initialization
export const getApp = () => getFirebaseServices().app;
export const getAuth = () => getFirebaseServices().auth;
export const getDb = () => getFirebaseServices().db;
export const getStorage = () => getFirebaseServices().storage;
export const getAnalytics = () => getFirebaseServices().analytics;

// Legacy exports for backward compatibility - these will initialize Firebase on first access
Object.defineProperty(exports, 'app', {
  get: () => getFirebaseServices().app
});

Object.defineProperty(exports, 'auth', {
  get: () => getFirebaseServices().auth
});

Object.defineProperty(exports, 'db', {
  get: () => getFirebaseServices().db
});

Object.defineProperty(exports, 'storage', {
  get: () => getFirebaseServices().storage
});

Object.defineProperty(exports, 'analytics', {
  get: () => getFirebaseServices().analytics
});

// Initialize Analytics (if supported in this environment)
const initializeAnalytics = async () => {
  if (!isDevelopmentMode() && typeof window !== 'undefined' && !global.expo) {
    try {
      const analyticsSupported = await isSupported();
      if (analyticsSupported && app) {
        analytics = createAnalytics(app);
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

// Initialize analytics if Firebase is available
try {
  if (app) {
    initializeAnalytics().catch(error => {
      console.log('Failed to initialize analytics:', error);
    });
  }
} catch (error) {
  console.log('Analytics initialization skipped:', error.message);
}

// Show warning if using development mode
if (isDevelopmentMode()) {
  console.warn('⚠️ Using Firebase in development mode with dummy configuration. Authentication and database operations will be simulated.');
} else {
  console.log('📱 Firebase initialized in PRODUCTION mode. Using real authentication and database services.');
}

// Export firebaseConfig and isDevelopmentMode for other modules
export { firebaseConfig, isDevelopmentMode }; 