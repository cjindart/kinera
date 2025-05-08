import { db, auth, storage } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mergeDuplicateUsers as mergeDuplicateUsersUtil } from './firestoreSetup';

/**
 * Tests Firebase connectivity
 * @returns {Promise<Object>} Test results
 */
export const testFirebaseConnection = async () => {
  const results = {
    auth: null,
    firestore: { read: null, write: null },
    errors: []
  };
  
  try {
    // Check auth status
    results.auth = {
      initialized: !!auth,
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        isAnonymous: auth.currentUser.isAnonymous
      } : null
    };
    
    // Test Firestore connection - writing to a test document
    try {
      const testId = `test_${Date.now()}`;
      const testDoc = doc(db, 'debug_tests', testId);
      
      // Try to write a test document
      await setDoc(testDoc, {
        timestamp: new Date().toISOString(),
        message: 'Connectivity test'
      });
      
      // Read it back to confirm write worked
      const readResult = await getDoc(testDoc);
      
      results.firestore.write = true;
      results.firestore.read = readResult.exists();
      results.firestore.writeTimestamp = new Date().toISOString();
      
      // Delete it to clean up (ignoring errors here)
      try {
        // In a real app, you'd use deleteDoc here
        await setDoc(testDoc, { deleted: true });
      } catch (e) {
        // Ignore deletion errors
      }
    } catch (error) {
      results.firestore.write = false;
      results.errors.push({
        operation: 'firestore_write',
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  } catch (error) {
    results.errors.push({
      operation: 'test_overall',
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
  
  // Save results to AsyncStorage for later reference
  try {
    await AsyncStorage.setItem('firebase_debug_results', JSON.stringify(results));
  } catch (e) {
    // Ignore AsyncStorage errors
  }
  
  return results;
};

/**
 * Tests writing a user's profile data to Firestore
 * @param {Object} userData User data to test writing
 * @returns {Promise<Object>} Test results
 */
export const testUserDataWrite = async (userData) => {
  const results = {
    success: false,
    errors: [],
    timings: {
      start: new Date().toISOString()
    }
  };
  
  try {
    if (!userData || !userData.id) {
      throw new Error('Invalid user data - missing user ID');
    }
    
    // Create a test document path - using a special collection to avoid polluting real user data
    const testDocPath = `test_users/${userData.id}_${Date.now()}`;
    const testDoc = doc(db, testDocPath);
    
    // Try to write the user data
    results.timings.writeStart = new Date().toISOString();
    await setDoc(testDoc, {
      id: userData.id,
      name: userData.name || 'Test User',
      phoneNumber: userData.phoneNumber || null,
      updatedAt: new Date().toISOString()
    });
    results.timings.writeEnd = new Date().toISOString();
    
    // Read it back to confirm
    results.timings.readStart = new Date().toISOString();
    const readResult = await getDoc(testDoc);
    results.timings.readEnd = new Date().toISOString();
    
    results.success = readResult.exists();
    results.readData = readResult.data();
    
    // Try to delete (cleanup)
    try {
      await setDoc(testDoc, { deleted: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (error) {
    results.success = false;
    results.errors.push({
      message: error.message,
      code: error.code || 'unknown',
      stack: error.stack
    });
  }
  
  results.timings.end = new Date().toISOString();
  
  // Save results to AsyncStorage
  try {
    await AsyncStorage.setItem('user_write_test_results', JSON.stringify(results));
  } catch (e) {
    // Ignore AsyncStorage errors
  }
  
  return results;
};

/**
 * Comprehensive test of Firebase services
 * Tests both Firestore and Storage functionality
 * @returns {Promise<Object>} Test results
 */
export const testFirebaseServices = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    firestore: { success: false, error: null },
    storage: { success: false, error: null },
    auth: { initialized: false, currentUser: null }
  };

  try {
    // Test 1: Check Auth Status
    results.auth.initialized = !!auth;
    results.auth.currentUser = auth.currentUser ? {
      uid: auth.currentUser.uid,
      isAnonymous: auth.currentUser.isAnonymous
    } : null;

    // Test 2: Firestore Test
    try {
      const testId = `test_${Date.now()}`;
      const testDoc = doc(db, 'debug_tests', testId);
      
      // Write test
      await setDoc(testDoc, {
        timestamp: new Date().toISOString(),
        message: 'Firestore connectivity test'
      });
      
      // Read test
      const readResult = await getDoc(testDoc);
      results.firestore.success = readResult.exists();
      
      // Cleanup
      await setDoc(testDoc, { deleted: true });
    } catch (error) {
      results.firestore.error = {
        message: error.message,
        code: error.code
      };
    }

    // Test 3: Storage Test
    try {
      // Create a small test file
      const testData = new Blob(['Test file content'], { type: 'text/plain' });
      const testPath = `debug_tests/test_${Date.now()}.txt`;
      const storageRef = ref(storage, testPath);
      
      // Upload test
      await uploadBytes(storageRef, testData);
      
      // Download URL test
      const downloadURL = await getDownloadURL(storageRef);
      results.storage.success = !!downloadURL;
      
      // Cleanup
      await deleteObject(storageRef);
    } catch (error) {
      results.storage.error = {
        message: error.message,
        code: error.code
      };
    }

    // Save results to AsyncStorage for debugging
    try {
      await AsyncStorage.setItem('firebase_services_test', JSON.stringify(results));
    } catch (e) {
      // Ignore AsyncStorage errors
    }

    return results;
  } catch (error) {
    return {
      ...results,
      error: {
        message: error.message,
        code: error.code
      }
    };
  }
};

/**
 * Check if there are duplicate user accounts with the same phone number
 * @param {string} phoneNumber - Phone number to search for
 * @returns {Promise<Object>} Results of the check and any duplicates found
 */
export const checkDuplicateUsers = async (phoneNumber) => {
  const results = {
    phoneNumber,
    hasDuplicates: false,
    users: [],
    error: null
  };

  try {
    // Skip if in development mode
    if (!auth.currentUser) {
      results.error = "No authenticated user";
      return results;
    }

    // Query Firestore for users with this phone number
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Found users with this phone number
      results.users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check if there are multiple users
      if (results.users.length > 1) {
        results.hasDuplicates = true;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error checking for duplicate users:', error);
    results.error = error.message;
    return results;
  }
};

// Re-export the mergeDuplicateUsers function for convenience
export const mergeDuplicateUsers = mergeDuplicateUsersUtil; 