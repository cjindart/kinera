/**
 * Development mode setup and utilities
 * This module runs necessary setup for development mode
 */

import { isDevelopmentMode } from './utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import User from './models/User';
import { testAuthInDevMode } from './tests/authTest';

// Set up global variables for development mode
export const setupDevEnvironment = async () => {
  // Force development mode to true for testing
  global.__FORCE_DEV_MODE__ = true;
  
  // Print environment info
  console.log('\n======= DEVELOPMENT ENVIRONMENT SETUP =======');
  console.log(`isDevelopmentMode(): ${isDevelopmentMode()}`);
  console.log(`__DEV__: ${typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined'}`);
  console.log('=============================================\n');
  
  // Clear any previous users for clean testing if needed
  // Uncomment this line to clear existing user data when testing
  // await AsyncStorage.removeItem('user');
  
  // Create a test user in AsyncStorage if needed
  const currentUser = await AsyncStorage.getItem('user');
  if (!currentUser) {
    console.log('No user found in AsyncStorage, running auth test...');
    const testResult = await testAuthInDevMode();
    console.log('Auth test result:', testResult);
  } else {
    console.log('Existing user found in AsyncStorage');
    try {
      // Parse and log user info
      const userData = JSON.parse(currentUser);
      console.log('User ID:', userData.id);
      console.log('User authenticated:', userData.isAuthenticated);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Check for other development settings
  console.log('\n======= DEVELOPMENT CONFIG =======');
  console.log('React Native Version:', require('./package.json').dependencies['react-native']);
  console.log('Expo Version:', require('./package.json').dependencies['expo']);
  console.log('===================================\n');
  
  return { success: true };
};

// Setup helper for testing auth in dev mode
export const ensureDevUser = async () => {
  const userJson = await AsyncStorage.getItem('user');
  
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      if (userData.isAuthenticated) {
        console.log('Development user is authenticated');
        return { exists: true, user: new User(userData) };
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // No valid user found, create one
  console.log('Creating development user...');
  const testResult = await testAuthInDevMode();
  
  if (testResult.success) {
    return { exists: true, created: true, user: testResult.user };
  } else {
    console.error('Failed to create development user:', testResult.error);
    return { exists: false, error: testResult.error };
  }
};

// Run setup immediately
if (isDevelopmentMode()) {
  setupDevEnvironment().catch(error => {
    console.error('Error in development setup:', error);
  });
} 