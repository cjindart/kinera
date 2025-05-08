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
   * @returns {Promise<string>} Verification ID
   */
  const sendVerificationCode = async (phoneNumber) => {
    try {
      // Format phone number to E.164 format
      const formattedPhone = formatPhoneNumber(phoneNumber);
      setTempPhoneNumber(formattedPhone);
      
      console.log(`Sending verification code to ${formattedPhone}`);
      console.log(`Development mode: ${isDevelopmentMode()}`);
      
      // In development mode, simulate sending a verification code
      if (isDevelopmentMode()) {
        console.log(`Development mode: Simulating verification for ${formattedPhone}`);
        Alert.alert("Test Mode", "Use verification code: 123456");
        
        // Generate a mock verification ID
        const mockVerificationId = `verify_${Date.now()}`;
        setVerificationId(mockVerificationId);
        
        return mockVerificationId;
      }
      
      // *** FORCE LOCAL DIRECT AUTH FOR TESTING LOCAL IP ***
      // This bypasses the web browser flow and uses Firebase directly
      console.log('Using direct Firebase auth with local IP');
      
      // Check for test numbers to simplify testing
      const testPhoneNumbers = ['+17206336712'];
      if (testPhoneNumbers.includes(formattedPhone)) {
        console.log('Test phone number detected, using simulated code');
        Alert.alert('Verification Code', 'For testing, use code: 123456');
        const mockId = `direct_${Date.now()}`;
        setVerificationId(mockId);
        return mockId;
      }
      
      // For real phone numbers, try direct Firebase Auth
      try {
        console.log(`Sending real verification code to ${formattedPhone}`);
        console.log('Using direct signInWithPhoneNumber API');
        
        // Try to directly use Firebase auth
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone);
        
        console.log('Firebase verification code sent successfully');
        Alert.alert('Verification Code Sent', 'A verification code has been sent to your phone.');
        
        // Store the verification ID
        const authVerificationId = confirmationResult.verificationId;
        setVerificationId(authVerificationId);
        
        console.log('Verification ID stored:', authVerificationId);
        return authVerificationId;
      } catch (firebaseError) {
        console.error('Firebase phone auth error:', firebaseError);
        
        if (firebaseError.code === 'auth/captcha-check-failed' || 
            firebaseError.code === 'auth/missing-verification-id') {
          // Fall back to web auth if reCAPTCHA is needed
          console.log('Direct auth failed, falling back to web auth flow');
          return handleWebAuth(formattedPhone);
        }
        
        // Check for common error causes
        if (firebaseError.code === 'auth/invalid-phone-number') {
          Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
        } else if (firebaseError.code === 'auth/quota-exceeded') {
          Alert.alert('Too Many Attempts', 'Too many verification attempts. Please try again later.');
        } else {
          Alert.alert('Error', 'Failed to send verification code. Please try again.');
        }
        
        throw firebaseError;
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
   * @returns {Promise<Object>} Authentication result
   */
  const verifyCode = async (code) => {
    try {
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
      
      // Production mode verification
      console.log(`Verifying code ${code} for verification ID ${verificationId}`);
      
      // Handle test verification IDs for local testing
      if (verificationId && (verificationId.startsWith('direct_') || verificationId.startsWith('auth_'))) {
        console.log('Using local test verification');
        
        // For local testing, accept 123456 as valid code
        if (code === '123456') {
          console.log('Local test verification successful');
          
          // If using a direct test verification ID, simulate successful auth
          const testUid = `local_${Date.now()}`;
          const mockAuthResult = {
            user: { uid: testUid },
            isNewUser: true,
            phoneNumber: tempPhoneNumber
          };
          
          // Handle the test auth result
          const authResult = await handleAuthResult(mockAuthResult);
          return { ...authResult, success: true };
        } else {
          console.error('Invalid test verification code');
          return { success: false, error: 'Invalid verification code' };
        }
      }
      
      // Standard Firebase phone verification using credential
      if (!verificationId) {
        console.error("No verification ID found for verification attempt");
        return { success: false, error: "No verification ID found" };
      }
      
      // Create credential
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Sign in with credential
      try {
        console.log('Signing in with phone credential');
        const authResult = await signInWithCredential(auth, credential);
        
        console.log("Phone verification successful");
        
        // Get user data
        const result = await handleAuthResult({
          user: authResult.user,
          isNewUser: authResult._tokenResponse?.isNewUser,
          phoneNumber: tempPhoneNumber || authResult.user.phoneNumber
        });
        
        return result;
      } catch (credentialError) {
        console.error('Credential verification error:', credentialError);
        Alert.alert('Verification Failed', 'The verification code is invalid. Please try again.');
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
      console.log("Starting registration process...");
      
      // Check if we're in development mode and handle accordingly
      if (isDevelopmentMode()) {
        console.log("Development mode: Creating simulated user");
        
        // Create a local user ID for development
        const devUserId = `dev_${Date.now()}`;
        
        // Create new user object with local ID
        const newUser = new User({
          ...userData,
          id: devUserId,
          phoneNumber: tempPhoneNumber || '1234567890',
          isAuthenticated: true,
          newUser: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        console.log("Created development user:", {
          id: newUser.id,
          name: newUser.name,
          hasPhoneNumber: !!newUser.phoneNumber,
          userType: newUser.userType,
        });
        
        // Save locally
        try {
          await newUser.save();
          console.log("Development user saved to AsyncStorage");
        } catch (saveError) {
          console.error("Error saving development user:", saveError);
        }
        
        // Set user in state
        setUser(newUser);
        setIsNewUser(true);
        
        return true;
      }
      
      // PRODUCTION MODE - Use Firebase Auth
      
      // ALWAYS use Firebase Auth UID when available
      if (!auth.currentUser) {
        console.error("No authenticated user found. Cannot register without Firebase Auth.");
        return false;
      }
      
      const userId = auth.currentUser.uid;
      console.log("Using Firebase Auth UID:", userId);
      
      // Check if a user with this phone number already exists in Firestore
      let existingUser = null;
      try {
        console.log("Checking for existing user with phone:", tempPhoneNumber);
        const userByPhone = await findUserByPhone(tempPhoneNumber);
        
        if (userByPhone) {
          console.log("Found existing user with this phone number:", userByPhone.id);
          existingUser = userByPhone;
        } else {
          console.log("No existing user found with this phone number");
        }
      } catch (findError) {
        console.error("Error checking for existing user:", findError);
        // Continue with registration even if check fails
      }
      
      // Handle existing user
      if (existingUser) {
        if (existingUser.id !== userId) {
          // This is a case where the user exists but with a different ID
          console.log("User exists with different ID. Will update to use Firebase UID.");
          
          // Create updated user with Firebase UID
          const updatedUser = new User({
            ...existingUser,
            id: userId,
            name: userData.name || existingUser.name,
            userType: userData.userType || existingUser.userType,
            previousId: existingUser.id,
            isAuthenticated: true,
            updatedAt: new Date().toISOString()
          });
          
          // Save with new ID
          console.log("Saving updated user with Firebase UID");
          const saveResult = await updatedUser.save();
          console.log("Save result:", saveResult ? "Success" : "Failed");
          
          setUser(updatedUser);
          setIsNewUser(false);
          return true;
        } else {
          // User exists with correct ID, just update profile
          console.log("User exists with correct ID. Updating profile data.");
          
          // Update the existing user with new data
          const updatedUser = new User({
            ...existingUser,
            ...userData,
            isAuthenticated: true,
            updatedAt: new Date().toISOString()
          });
          
          await updatedUser.save();
          setUser(updatedUser);
          setIsNewUser(false);
          return true;
        }
      }
      
      // Create new user for Firestore
      console.log("Creating new user in Firestore");
      const newUser = new User({
        ...userData,
        id: userId, // Always use Firebase UID
        phoneNumber: tempPhoneNumber,
        isAuthenticated: true,
        newUser: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log("Created user object:", {
        id: newUser.id,
        name: newUser.name,
        hasPhoneNumber: !!newUser.phoneNumber,
        userType: newUser.userType,
      });
      
      // Initialize in Firestore
      console.log("Initializing user in Firestore...");
      const saveResult = await newUser.save();
      console.log("Firestore save result:", saveResult ? "Success" : "Failed");
      
      // Set user in state
      setUser(newUser);
      setIsNewUser(true);
      
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
      
      console.log("Updating profile for user:", userToUpdate.id || "new user");
      
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
      
      // Update timestamps
      userToUpdate.updatedAt = new Date().toISOString();
      userToUpdate.profileData.updatedAt = new Date().toISOString();
      
      // Set authentication flag if it's a new user
      if (profileData.isNewUser) {
        userToUpdate.isAuthenticated = true;
      }
      
      // Save user data (this will handle both AsyncStorage and Firestore)
      console.log("Saving updated profile...");
      const saveResult = await userToUpdate.save();
      
      if (!saveResult && !isDevelopmentMode()) {
        console.warn("Failed to save user data to Firestore");
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

  // Create value object with state and functions
  const value = {
    user,
    isLoading,
    isNewUser,
    isLoggedIn: !!user?.isAuthenticated,
    sendVerificationCode,
    verifyCode,
    register,
    updateProfile,
    logout,
    setUser,
    handleAuthResult,
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
  return context;
}

export default AuthContext; 