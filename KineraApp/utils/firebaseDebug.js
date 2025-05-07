import { db, auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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