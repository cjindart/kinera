import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import User from '../models/User';
import { 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signOut,
  signInWithCredential 
} from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db, isDevelopmentMode } from '../utils/firebase';
import { findUserByPhone, migrateUserData } from '../utils/firestoreSetup';
import { 
  testFirebaseConnection, 
  testUserDataWrite, 
  checkDuplicateUsers,
  mergeDuplicateUsers 
} from '../utils/firebaseDebug';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider component to wrap the app and provide authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [tempPhoneNumber, setTempPhoneNumber] = useState(null);

  // Load user data when the component mounts
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated with Firebase
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in, get user data from Firestore
            const userData = await fetchUserData(firebaseUser.uid);
            if (userData) {
              setUser(userData);
              setIsNewUser(!!userData.newUser);
              
              // Clear the newUser flag after we've used it
              if (userData.newUser) {
                delete userData.newUser;
                await userData.save();
              }
            }
          }
          
          // Fallback to AsyncStorage if Firebase auth isn't working
          if (!firebaseUser) {
            const localUser = await User.load();
            if (localUser && localUser.isAuthenticated) {
              setUser(localUser);
            }
          }
          
          setIsLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading user data:', error);
        
        // Fallback to AsyncStorage if there's an error
        try {
          const localUser = await User.load();
          if (localUser && localUser.isAuthenticated) {
            setUser(localUser);
          }
        } catch (innerError) {
          console.error('Error loading from AsyncStorage:', innerError);
        }
        
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Fetch user data from Firestore
   * @param {string} userId User's Firebase UID
   * @returns {User} User object
   */
  const fetchUserData = async (userId) => {
    try {
      // Skip Firestore queries in development mode
      if (isDevelopmentMode()) {
        console.log('Development mode: Skipping Firestore fetch');
        return null;
      }
      
      // Try to get user from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        // User exists in Firestore
        const userData = userDoc.data();
        const userInstance = new User({
          ...userData,
          id: userId,
          isAuthenticated: true
        });
        
        // Save to AsyncStorage for local access
        await userInstance.save();
        
        return userInstance;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  /**
   * Handle Firebase authentication result
   * @param {Object} authResult Result from Firebase authentication
   * @returns {Promise<Object>} Authentication status including isNewUser flag
   */
  const handleAuthResult = async (authResult) => {
    try {
      const { user: firebaseUser, isNewUser: isNew, phoneNumber } = authResult;
      
      // Store temporary phone number
      setTempPhoneNumber(phoneNumber);
      
      // In development mode, we simulate success even without a Firebase user
      if (isDevelopmentMode()) {
        console.log('Development mode: Simulating successful authentication');
        setIsNewUser(true);
        return { success: true, isNewUser: true };
      }
      
      // Return early if no firebase user (failed auth) in production mode
      if (!firebaseUser) {
        return { success: false };
      }
      
      const firebaseUid = firebaseUser.uid;
      console.log("Firebase Auth successful, UID:", firebaseUid);
      
      // Check if there are duplicate users with this phone number
      console.log("Checking for duplicate users with phone number:", phoneNumber);
      
      // First, check for duplicates
      const duplicateCheck = await checkDuplicateUsers(phoneNumber);
      console.log("Duplicate check results:", JSON.stringify(duplicateCheck));
      
      // If we have duplicates, merge them into the Firebase UID account
      if (duplicateCheck.hasDuplicates) {
        console.log("Merging duplicate users...");
        const mergeResult = await mergeDuplicateUsers(phoneNumber, firebaseUid);
        console.log("Merge result:", JSON.stringify(mergeResult));
        
        if (mergeResult.success) {
          // Use the merged user data
          const mergedUser = new User({
            ...mergeResult.mergedUserData,
            isAuthenticated: true
          });
          
          await mergedUser.save();
          setUser(mergedUser);
          setIsNewUser(false);
          return { success: true, isNewUser: false };
        }
      }
      
      // Continue with regular flow - first check by Firebase UID
      const userByUid = await fetchUserData(firebaseUid);
      if (userByUid) {
        console.log("User found by Firebase UID");
        setUser(userByUid);
        setIsNewUser(false);
        return { success: true, isNewUser: false };
      }
      
      // If not found by UID, check by phone number
      const userByPhone = await findUserByPhone(phoneNumber);
      if (userByPhone) {
        console.log("User found by phone number, ID:", userByPhone.id);
        
        // If we need to migrate from a local ID to Firebase UID
        if (userByPhone.id !== firebaseUid) {
          console.log("Migrating user from local ID to Firebase UID");
          
          // Try to migrate the data
          const migrationSuccess = await migrateUserData(userByPhone.id, firebaseUid);
          
          if (migrationSuccess) {
            console.log("Migration successful");
          } else {
            console.warn("Migration failed, will create updated user object");
          }
          
          // Create updated user with Firebase UID
          const updatedUser = new User({
            ...userByPhone,
            id: firebaseUid,
            previousId: userByPhone.id,
            isAuthenticated: true,
            updatedAt: new Date().toISOString()
          });
          
          // Save the updated user data
          await updatedUser.save();
          setUser(updatedUser);
          setIsNewUser(false);
          return { success: true, isNewUser: false };
        } else {
          // User already has the correct Firebase UID
          const existingUser = new User({
            ...userByPhone,
            isAuthenticated: true
          });
          
          await existingUser.save();
          setUser(existingUser);
          setIsNewUser(false);
          return { success: true, isNewUser: false };
        }
      }
      
      // If it's a new user or we couldn't find user data
      console.log("No existing user found, will create new user");
      setIsNewUser(true);
      return { success: true, isNewUser: true };
    } catch (error) {
      console.error('Error handling auth result:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Send verification code to phone number
   * @param {string} phoneNumber User's phone number
   * @param {string} mode Optional - 'signup' or 'login' to indicate the intent
   * @returns {Promise<string>} Verification ID
   */
  const sendVerificationCode = async (phoneNumber, mode = 'login') => {
    try {
      // Format phone number to E.164 format
      const formattedPhone = formatPhoneNumber(phoneNumber);
      setTempPhoneNumber(formattedPhone);
      
      console.log(`Sending verification code to ${formattedPhone}, mode: ${mode}`);
      
      // In development mode, simulate sending a verification code
      if (isDevelopmentMode()) {
        console.log(`Development mode: Simulating verification for ${formattedPhone}`);
        Alert.alert("Test Mode", "Use verification code: 123456");
        
        // Generate a mock verification ID
        const mockVerificationId = `verify_${Date.now()}`;
        setVerificationId(mockVerificationId);
        
        return mockVerificationId;
      }
      
      // For test phone numbers, use a simpler approach
      const testPhoneNumbers = ['+17206336712', '+15555555555'];
      if (testPhoneNumbers.includes(formattedPhone)) {
        console.log('Test phone number detected, using simulated code');
        Alert.alert('Verification Code', 'For testing, use code: 123456');
        const mockId = `direct_${Date.now()}`;
        setVerificationId(mockId);
        return mockId;
      }
      
      // For production use Firebase phone authentication
      try {
        console.log(`Firebase Phone Auth: Sending verification code to ${formattedPhone}`);
        
        // Make sure auth is initialized
        if (!auth) {
          throw new Error('Firebase auth not initialized');
        }
        
        // Check if auth has signInWithPhoneNumber method
        if (!auth.signInWithPhoneNumber) {
          console.error('Firebase auth.signInWithPhoneNumber method not available');
          throw new Error('Phone authentication not available');
        }
        
        // Send verification code using Firebase
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone);
        
        if (!confirmationResult || !confirmationResult.verificationId) {
          throw new Error('Failed to get verification ID from Firebase');
        }
        
        console.log('Firebase verification code sent successfully');
        Alert.alert('Verification Code Sent', 'A verification code has been sent to your phone.');
        
        // Store the verification ID
        const authVerificationId = confirmationResult.verificationId;
        setVerificationId(authVerificationId);
        
        console.log('Verification ID stored:', authVerificationId);
        return authVerificationId;
      } catch (firebaseError) {
        console.error('Firebase phone auth error:', firebaseError);
        
        // Fall back to direct registration if Firebase auth fails
        console.log('Firebase auth failed, falling back to direct registration');
        console.warn('To fix this error, ensure Firebase Phone Auth is properly configured in the Firebase Console');
        
        // Detailed error handling for common issues
        if (firebaseError.code === 'auth/invalid-phone-number') {
          Alert.alert('Invalid Phone Number', 'Please enter a valid phone number in the format +1XXXXXXXXXX.');
          throw firebaseError;
        } else if (firebaseError.code === 'auth/quota-exceeded') {
          Alert.alert('Too Many Attempts', 'Too many verification attempts from this device. Try again later.');
          throw firebaseError;
        } else if (firebaseError.code === 'auth/missing-verification-code') {
          Alert.alert('Error', 'Please enter the verification code sent to your phone.');
          throw firebaseError;
        } else if (firebaseError.code === 'auth/captcha-check-failed') {
          Alert.alert('Error', 'CAPTCHA verification failed. Please try again.');
          throw firebaseError;
        } else if (firebaseError.code === 'auth/argument-error') {
          console.error('Firebase auth argument error. This usually indicates a configuration issue.');
          // Continue with fallback
        }
        
        // Use direct registration as fallback
        const registrationResult = await registerWithoutVerification(formattedPhone);
        
        if (registrationResult.success) {
          const directVerificationId = `direct_${Date.now()}`;
          setVerificationId(directVerificationId);
          return directVerificationId;
        } else {
          Alert.alert('Error', 'Failed to send verification code. Please try again later.');
          throw new Error(registrationResult.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  };
  
  /**
   * Helper function to handle web-based authentication
   * @param {string} phoneNumber Formatted phone number
   * @returns {Promise<string>} Verification ID
   */
  const handleWebAuth = async (phoneNumber) => {
    try {
      // Fall back to web browser authentication
      console.log('Using web browser authentication flow');
      const { openAuthDomain } = require('../utils/authRedirect');
      
      const result = await openAuthDomain('phoneAuth', {
        phoneNumber: phoneNumber,
        redirectUri: Constants.linkingUri
      });
      
      if (result.success) {
        console.log('Phone verification handled through authorized domain');
        
        // Generate a verification ID to track this session
        const authVerificationId = `auth_${Date.now()}`;
        setVerificationId(authVerificationId);
        
        if (result.data && result.data.phoneVerified === 'true') {
          console.log('Phone verified through web flow');
          // Handle automatically verified phone
          
          // Get the UID from authentication
          const firebaseUid = result.data.uid;
          
          if (firebaseUid) {
            // Process the authenticated result
            await handleAuthResult({
              user: { uid: firebaseUid },
              isNewUser: false, // We'll check for this in handleAuthResult
              phoneNumber: phoneNumber
            });
          }
        }
        
        return authVerificationId;
      } else if (result.canceled) {
        console.log('User canceled phone verification');
        throw new Error('Phone verification canceled');
      } else {
        console.error('Error during phone verification:', result.error);
        throw new Error(result.error || 'Failed to verify phone');
      }
    } catch (error) {
      console.error('Web auth error:', error);
      throw error;
    }
  };

  /**
   * Verify phone auth code
   * @param {string} code Verification code
   * @param {string} verificationIdParam Optional verification ID (fallback to context state if not provided)
   * @returns {Promise<Object>} Authentication result
   */
  const verifyCode = async (code, verificationIdParam) => {
    try {
      // Use provided verification ID or fallback to context state
      const effectiveVerificationId = verificationIdParam || verificationId;
      console.log(`Verifying code with verification ID: ${effectiveVerificationId}`);
      
      // Handle development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Simulating verification with code:", code);
        
        // For development testing, accept any 6-digit code
        if (code.length === 6) {
          // Simulate successful verification
          if (code === "123456") {
            console.log("Development mode: Test verification successful");
            
            // Create mock authentication result
            const mockResult = {
              user: { uid: `dev_${Date.now()}` },
              isNewUser: true,
              phoneNumber: tempPhoneNumber || "+1234567890"
            };
            
            // Process the mock auth result
            const authResult = await handleAuthResult(mockResult);
            return { ...authResult };
          } else {
            console.log("Development mode: Using non-test code");
            return { success: true, isNewUser: true };
          }
        } else {
          console.error("Development mode: Invalid code format");
          return { success: false, error: "Invalid code format" };
        }
      }
      
      // Handle direct verification IDs (from direct registration)
      if (effectiveVerificationId && effectiveVerificationId.startsWith('direct_')) {
        console.log('Using direct verification mode');
        
        // For direct verification, accept any 6-digit code
        if (code.length === 6) {
          console.log('Direct verification successful');
          
          // Force isNewUser to be true for direct registrations
          console.log('Direct registration - forcing isNewUser=true');
          setIsNewUser(true);
          await AsyncStorage.setItem('isNewUser', 'true');
          
          return { 
            success: true, 
            isNewUser: true // Always treat direct registrations as new users
          };
        } else {
          console.error('Invalid verification code format');
          return { success: false, error: 'Please enter a 6-digit verification code' };
        }
      }
      
      // Standard Firebase phone verification using credential
      if (!effectiveVerificationId) {
        console.error("No verification ID found for verification attempt");
        return { success: false, error: "No verification ID found" };
      }
      
      try {
        console.log('Creating phone credential with verification ID:', effectiveVerificationId);
        
        // Make sure auth and PhoneAuthProvider are available
        if (!auth || !PhoneAuthProvider) {
          throw new Error('Firebase auth or PhoneAuthProvider not initialized');
        }
        
        // Create credential
        const credential = PhoneAuthProvider.credential(effectiveVerificationId, code);
        
        // Sign in with credential
        console.log('Signing in with phone credential');
        const authResult = await signInWithCredential(auth, credential);
        
        console.log("Phone verification successful");
        
        // Get user data
        const result = await handleAuthResult({
          user: authResult.user,
          isNewUser: authResult._tokenResponse?.isNewUser,
          phoneNumber: tempPhoneNumber || authResult.user.phoneNumber
        });
        
        // Ensure isNewUser is properly set
        if (result.isNewUser) {
          console.log('Setting isNewUser=true for new Firebase authenticated user');
          setIsNewUser(true);
          await AsyncStorage.setItem('isNewUser', 'true');
        }
        
        return result;
      } catch (credentialError) {
        console.error('Credential verification error:', credentialError);
        
        // Handle specific error cases
        if (credentialError.code === 'auth/invalid-verification-code') {
          Alert.alert('Invalid Code', 'The verification code you entered is invalid. Please try again.');
        } else if (credentialError.code === 'auth/code-expired') {
          Alert.alert('Code Expired', 'The verification code has expired. Please request a new one.');
        } else if (credentialError.code === 'auth/invalid-verification-id') {
          Alert.alert('Session Expired', 'Your verification session has expired. Please restart the process.');
        } else {
          Alert.alert('Verification Failed', 'Failed to verify your phone number. Please try again.');
        }
        
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Register a new user
   * @param {Object} userData User data object
   * @returns {Promise<boolean>} Success status
   */
  const register = async (userData) => {
    try {
      console.log('Registering user:', JSON.stringify(userData, null, 2));
      
      // Clean up phone number if provided
      if (userData.phoneNumber) {
        userData.phoneNumber = formatPhoneNumber(userData.phoneNumber);
      }
      
      // Get Firebase ID if available
      let userId = userData.id;
      if (!userId && auth.currentUser) {
        userId = auth.currentUser.uid;
        console.log("Using Firebase auth UID:", userId);
      }
      
      // If still no ID and not in development mode, generate a fallback ID
      if (!userId && !isDevelopmentMode()) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        console.log("Generated fallback ID:", userId);
      }
      
      // Handle isNewUser flag
      const isUserNew = userData.isNewUser === true; // Explicitly check for true
      
      // Create user instance with the ID
      const newUser = new User({
        ...userData,
        id: userId, // Ensure ID is set
        isAuthenticated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Set the newUser flag explicitly from the input parameter
      if (isUserNew) {
        newUser.newUser = true;
        console.log('Setting user as NEW USER in registration');
      } else {
        console.log('Setting user as RETURNING USER in registration');
      }
      
      // Log the final user object that will be saved
      console.log("Final user object being saved:", {
        id: newUser.id,
        name: newUser.name,
        isNewUser: !!newUser.newUser,
        hasPhoneNumber: !!newUser.phoneNumber,
        profileDataFields: Object.keys(newUser.profileData || {}).length
      });
      
      // Save user data to AsyncStorage and Firestore
      const saveResult = await newUser.save();
      console.log('Firestore save result:', saveResult ? 'Success' : 'Failed');
      
      // Initialize Firestore collections
      if (isUserNew) {
        await newUser.initialize();
      }
      
      // Update auth context
      setUser(newUser);
      setIsNewUser(isUserNew);
      
      // Update AsyncStorage for isNewUser flag
      await AsyncStorage.setItem('isNewUser', isUserNew ? 'true' : 'false');
      
      // Debugging the state after setting
      console.log('Layout render - Auth state:', {
        hasUser: !!newUser,
        isAuthenticated: newUser.isAuthenticated,
        isLoading: false,
        isNewUser: isUserNew
      });
      
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      return false;
    }
  };

  /**
   * Update user profile data
   * @param {Object} profileData Updated profile data
   * @returns {Promise<boolean>} Success status
   */
  const updateProfile = async (profileData) => {
    try {
      console.log("Starting profile update process...");
      
      let userToUpdate = null;
      
      // Get user instance to update (from context or AsyncStorage if needed)
      if (user) {
        userToUpdate = new User({ ...user });
      } else {
        // Try to load from AsyncStorage if no user in context
        const loadedUser = await User.load();
        if (loadedUser) {
          userToUpdate = loadedUser;
        } else {
          console.error("Cannot update profile: No user is logged in");
          return false;
        }
      }
      
      // Ensure user has an ID
      if (!userToUpdate.id) {
        // If Firebase auth is available, use the UID
        if (auth.currentUser) {
          userToUpdate.id = auth.currentUser.uid;
          console.log("Set missing ID from Firebase auth:", userToUpdate.id);
        } else {
          // Generate a fallback ID if needed
          userToUpdate.id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          console.log("Generated fallback ID for profile update:", userToUpdate.id);
        }
      }
      
      console.log("Updating profile for user:", userToUpdate.id);
      
      // Update basic user fields
      if (profileData.name) userToUpdate.name = profileData.name;
      if (profileData.userType) userToUpdate.userType = profileData.userType;
      if (profileData.stanfordEmail) userToUpdate.stanfordEmail = profileData.stanfordEmail;
      if (profileData.isStanfordVerified !== undefined) userToUpdate.isStanfordVerified = profileData.isStanfordVerified;
      
      // Ensure profileData object exists
      userToUpdate.profileData = userToUpdate.profileData || {};
      
      // Update profile data - prioritize structured data
      if (profileData.profileData) {
        // Merge with existing profileData
        userToUpdate.profileData = {
          ...userToUpdate.profileData,
          ...profileData.profileData
        };
      } else {
        // Handle individual fields - all profile fields should go into profileData
        if (profileData.age !== undefined) userToUpdate.profileData.age = profileData.age;
        if (profileData.gender !== undefined) userToUpdate.profileData.gender = profileData.gender;
        if (profileData.height !== undefined) userToUpdate.profileData.height = profileData.height;
        if (profileData.year !== undefined) userToUpdate.profileData.year = profileData.year;
        if (profileData.interests !== undefined) userToUpdate.profileData.interests = profileData.interests;
        if (profileData.dateActivities !== undefined) userToUpdate.profileData.dateActivities = profileData.dateActivities;
        if (profileData.photos !== undefined) userToUpdate.profileData.photos = profileData.photos;
        if (profileData.activities !== undefined) userToUpdate.profileData.dateActivities = profileData.activities;
      }
      
      // Handle friends separately to ensure they're saved in the right place
      if (profileData.friends) {
        userToUpdate.friends = profileData.friends;
        // Also add to profileData to ensure it's accessible in both places
        userToUpdate.profileData.friends = profileData.friends;
      }
      
      // Update timestamps
      userToUpdate.updatedAt = new Date().toISOString();
      userToUpdate.profileData.updatedAt = new Date().toISOString();
      
      // Set authentication flag if it's a new user
      if (profileData.isNewUser) {
        userToUpdate.isAuthenticated = true;
      }
      
      // Log final user object for debugging
      console.log("Final user object before saving:", {
        id: userToUpdate.id,
        name: userToUpdate.name,
        hasProfileData: !!userToUpdate.profileData,
        profileDataFields: Object.keys(userToUpdate.profileData || {}).length,
        friendsCount: (userToUpdate.friends || []).length
      });
      
      // Save user data (this will handle both AsyncStorage and Firestore)
      console.log("Saving updated profile...");
      const saveResult = await userToUpdate.save();
      
      if (!saveResult && !isDevelopmentMode()) {
        console.warn("Failed to save user data to Firestore");
      } else {
        console.log("Profile saved successfully");
      }
      
      // Update the user in state
      setUser(userToUpdate);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  /**
   * Logout user
   * @returns {Promise<boolean>} Success status
   */
  const logout = async () => {
    try {
      // Sign out from Firebase if not in development mode
      if (!isDevelopmentMode() && auth.currentUser) {
        await signOut(auth);
      } else if (isDevelopmentMode()) {
        console.log('Development mode: Skipping Firebase signOut');
      }
      
      // Clear local storage
      await User.logout();
      setUser(null);
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  };

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber Phone number to format
   * @returns {string} Formatted phone number
   */
  const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure it's a US number (add +1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already has a country code
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  };

  /**
   * Get the local IP address from app.json configuration
   * @returns {string|null} Local IP address or null
   */
  const getLocalIp = () => {
    try {
      // Try to get from Constants.expoConfig.extra.localIp
      const localIp = Constants.expoConfig?.extra?.localIp;
      if (localIp) {
        return localIp;
      }
      
      // Try to extract from hostUri
      const hostUri = Constants.expoConfig?.extra?.hostUri || Constants.expoConfig?.hostUri;
      if (hostUri && hostUri.includes('10.27.145.110')) {
        return '10.27.145.110';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting local IP:', error);
      return null;
    }
  };

  /**
   * Register a user directly without phone verification
   * This is for your production mode without authentication
   * @param {string} phoneNumber - User's phone number
   * @returns {Promise<Object>} Registration status
   */
  const registerWithoutVerification = async (phoneNumber) => {
    try {
      console.log("Production mode: Registering without phone verification");
      setIsLoading(true);
      
      // Format the phone number
      const formattedPhone = formatPhoneNumber(phoneNumber);
      setTempPhoneNumber(formattedPhone);
      
      // Check if a user with this phone number already exists
      try {
        const existingUser = await findUserByPhone(formattedPhone);
        if (existingUser) {
          console.log("Found existing user with this phone number:", existingUser.id);
          
          // Update the existing user
          const updatedUser = new User({
            ...existingUser,
            isAuthenticated: true,
            updatedAt: new Date().toISOString()
          });
          
          // Save user data
          await updatedUser.save();
          
          // Update state
          setUser(updatedUser);
          // For direct registration, we should set existingUser to isNewUser=false 
          setIsNewUser(false);
          await AsyncStorage.setItem('isNewUser', 'false');
          setIsLoading(false);
          
          console.log("Using existing user account, isNewUser=false");
          return { success: true, isNewUser: false, existingUser: true };
        }
      } catch (findError) {
        console.log("No existing user found or error checking:", findError);
        // Continue with new user creation
      }
      
      // Generate a unique ID for the user (using timestamp + random string)
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const userId = `user_${timestamp}_${randomStr}`;
      
      console.log("Generated user ID:", userId);
      
      // Create a new user instance
      const newUser = new User({
        id: userId,
        phoneNumber: formattedPhone,
        isAuthenticated: true,
        newUser: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Save to AsyncStorage and Firestore
      await newUser.save();
      
      // Update state
      setUser(newUser);
      // For new users, set isNewUser=true (explicitly)
      setIsNewUser(true);
      await AsyncStorage.setItem('isNewUser', 'true');
      setIsLoading(false);
      
      console.log("Created new user, isNewUser=true");
      return { success: true, isNewUser: true, existingUser: false };
    } catch (error) {
      console.error("Error registering user without verification:", error);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Create value object with state and functions
  const value = {
    user,
    isLoading,
    isNewUser,
    verificationId,
    tempPhoneNumber,
    isLoggedIn: !!user && user.isAuthenticated === true,
    setUser,
    sendVerificationCode,
    verifyCode,
    register,
    updateProfile,
    logout,
    formatPhoneNumber,
    handleAuthResult,
    registerWithoutVerification,
    fetchUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Add fetchUserData to the auth context for direct access
  return {
    ...context,
    fetchUserData: context.fetchUserData
  };
}

export default AuthContext; 