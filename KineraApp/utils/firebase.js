import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Load configuration from environment variables or constants
const getFirebaseConfig = () => {
  const expoConstants = Constants.expoConfig?.extra || {};
  
  // Fallback configuration
  const fallbackConfig = {
    apiKey: "AIzaSyAZQb0O_xtQkI4lwv7jPmkz7jIGhbBGWoM",
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

// Export configuration
export const firebaseConfig = getFirebaseConfig();

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

// Firebase instances
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

// Initialize Firebase only when needed
export const initializeFirebaseIfNeeded = () => {
  if (firebaseApp) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
  }

  try {
    console.log('🔥 Initializing Firebase...');
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase configuration is incomplete');
    }
    
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');

    if (Platform.OS === 'web') {
      firebaseAuth = getAuth(firebaseApp);
      setPersistence(firebaseAuth, browserLocalPersistence);
    } else {
      firebaseAuth = initializeAuth(firebaseApp, {
        persistence: browserLocalPersistence
      });
    }
    console.log('✅ Firebase auth initialized');

    firebaseDb = getFirestore(firebaseApp);
    console.log('✅ Firestore initialized');

    firebaseStorage = getStorage(firebaseApp);
    console.log('✅ Firebase storage initialized');

    console.log('✅ Firebase initialization complete');
    
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

// Lazy getter functions
export const getFirebaseAuth = () => {
  if (!firebaseAuth) {
    initializeFirebaseIfNeeded();
  }
  return firebaseAuth;
};

export const getFirebaseApp = () => {
  if (!firebaseApp) {
    initializeFirebaseIfNeeded();
  }
  return firebaseApp;
};

export const getFirebaseDb = () => {
  if (!firebaseDb) {
    initializeFirebaseIfNeeded();
  }
  return firebaseDb;
};

export const getFirebaseStorage = () => {
  if (!firebaseStorage) {
    initializeFirebaseIfNeeded();
  }
  return firebaseStorage;
};

// Backward compatible exports using getters - these will NOT trigger initialization on import
let _authExport, _appExport, _dbExport, _storageExport;

Object.defineProperty(exports, 'auth', {
  get() {
    if (!_authExport) _authExport = getFirebaseAuth();
    return _authExport;
  },
  enumerable: true
});

Object.defineProperty(exports, 'app', {
  get() {
    if (!_appExport) _appExport = getFirebaseApp();
    return _appExport;
  },
  enumerable: true
});

Object.defineProperty(exports, 'db', {
  get() {
    if (!_dbExport) _dbExport = getFirebaseDb();
    return _dbExport;
  },
  enumerable: true
});

Object.defineProperty(exports, 'storage', {
  get() {
    if (!_storageExport) _storageExport = getFirebaseStorage();
    return _storageExport;
  },
  enumerable: true
});

// Direct function exports
export { getFirebaseAuth, getFirebaseApp, getFirebaseDb, getFirebaseStorage, initializeFirebaseIfNeeded }; 