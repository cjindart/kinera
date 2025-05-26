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

// Initialize Firebase immediately at module load to prevent "no-app" errors
try {
  console.log('🔥 Initializing Firebase at module load...');
  
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized at module load');
  } else {
    console.warn('⚠️ Firebase config incomplete, delaying initialization');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Firebase at module load:', error.message);
  // Don't throw - we'll try again later
}

// Initialize Firebase services when needed
export const initializeFirebaseIfNeeded = () => {
  if (firebaseApp && firebaseAuth && firebaseDb && firebaseStorage) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
  }

  try {
    // Initialize app if not already done
    if (!firebaseApp) {
      console.log('🔥 Initializing Firebase app...');
      
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Firebase configuration is incomplete');
      }
      
      firebaseApp = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized');
    }

    // Initialize auth if not already done
    if (!firebaseAuth) {
      if (Platform.OS === 'web') {
        firebaseAuth = getAuth(firebaseApp);
        setPersistence(firebaseAuth, browserLocalPersistence);
      } else {
        firebaseAuth = initializeAuth(firebaseApp, {
          persistence: browserLocalPersistence
        });
      }
      console.log('✅ Firebase auth initialized');
    }

    // Initialize db if not already done
    if (!firebaseDb) {
      firebaseDb = getFirestore(firebaseApp);
      console.log('✅ Firestore initialized');
    }

    // Initialize storage if not already done
    if (!firebaseStorage) {
      firebaseStorage = getStorage(firebaseApp);
      console.log('✅ Firebase storage initialized');
    }

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

// Create lazy proxy objects that initialize Firebase only when properties are accessed
let _auth, _app, _db, _storage;

// Export proxy objects that initialize on first property access
export const auth = new Proxy({}, {
  get(target, prop) {
    if (!_auth) _auth = getFirebaseAuth();
    return _auth[prop];
  },
  set(target, prop, value) {
    if (!_auth) _auth = getFirebaseAuth();
    _auth[prop] = value;
    return true;
  }
});

export const app = new Proxy({}, {
  get(target, prop) {
    if (!_app) _app = getFirebaseApp();
    return _app[prop];
  },
  set(target, prop, value) {
    if (!_app) _app = getFirebaseApp();
    _app[prop] = value;
    return true;
  }
});

export const db = new Proxy({}, {
  get(target, prop) {
    if (!_db) _db = getFirebaseDb();
    return _db[prop];
  },
  set(target, prop, value) {
    if (!_db) _db = getFirebaseDb();
    _db[prop] = value;
    return true;
  }
});

export const storage = new Proxy({}, {
  get(target, prop) {
    if (!_storage) _storage = getFirebaseStorage();
    return _storage[prop];
  },
  set(target, prop, value) {
    if (!_storage) _storage = getFirebaseStorage();
    _storage[prop] = value;
    return true;
  }
}); 