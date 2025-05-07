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
import { findUserByPhone } from '../utils/firestoreSetup';
import { testFirebaseConnection, testUserDataWrite } from '../utils/firebaseDebug';

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
      
      if (firebaseUser) {
        // In development mode, still create a user object
        if (isDevelopmentMode()) {
          console.log('Development mode: Creating simulated user');
          setIsNewUser(true);
          return { success: true, isNewUser: true };
        }
        
        // If user is in Firestore, fetch their data
        if (!isNew) {
          const userData = await fetchUserData(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            setIsNewUser(false);
            
            return { success: true, isNewUser: false };
          }
          
          // If we couldn't find user in Firestore but Firebase says they exist,
          // check by phone number
          const userByPhone = await findUserByPhone(phoneNumber);
          if (userByPhone) {
            // User found by phone, update their ID
            const updatedUser = new User({
              ...userByPhone,
              id: firebaseUser.uid,
              isAuthenticated: true
            });
            
            await updatedUser.save();
            setUser(updatedUser);
            setIsNewUser(false);
            
            return { success: true, isNewUser: false };
          }
        }
        
        // If it's a new user or we couldn't find user data
        setIsNewUser(true);
        return { success: true, isNewUser: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error handling auth result:', error);
      return { success: false };
    }
  };

  /**
   * Send verification code to phone number
   * This method is kept for backward compatibility but will be deprecated
   * @param {string} phoneNumber User's phone number
   * @returns {Promise<string>} Verification ID
   */
  const sendVerificationCode = async (phoneNumber) => {
    try {
      // Format phone number to E.164 format
      const formattedPhone = formatPhoneNumber(phoneNumber);
      setTempPhoneNumber(formattedPhone);
      
      if (isDevelopmentMode()) {
        console.log(`Development mode: Simulating verification code sent to ${formattedPhone}`);
      } else {
        console.log(`Sending verification code to ${formattedPhone}`);
        // In a real app, this would use Firebase's recaptcha verification
      }
      
      // Generate a mock verification ID
      const mockVerificationId = `verify_${Date.now()}`;
      setVerificationId(mockVerificationId);
      
      return mockVerificationId;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  };

  /**
   * Verify phone number with code
   * This method is kept for backward compatibility but will be deprecated
   * @param {string} code Verification code
   * @returns {Promise<boolean>} Success status
   */
  const verifyCode = async (code) => {
    try {
      // In a real app, this would verify the code with Firebase
      // For this implementation, we'll simulate the verification process
      console.log(`Verifying code ${code} for verification ID ${verificationId}`);
      
      // Fast path for development mode
      if (isDevelopmentMode() && code === '123456') {
        console.log('Development mode: Skipping Firestore checks and creating new user');
        setIsNewUser(true);
        return { success: true, isNewUser: true };
      }
      
      // Simulate verification success (in a real app, this would check the code)
      if (code === '123456') {
        try {
          // Check if user exists
          const userByPhone = await findUserByPhone(tempPhoneNumber);
          
          if (userByPhone) {
            // User exists - return user data
            const existingUser = new User({
              ...userByPhone,
              isAuthenticated: true
            });
            
            await existingUser.save();
            setUser(existingUser);
            setIsNewUser(false);
            
            return { success: true, isNewUser: false };
          } else {
            // New user - set flag for registration
            setIsNewUser(true);
            return { success: true, isNewUser: true };
          }
        } catch (error) {
          console.error('Error checking user in Firestore:', error);
          // If Firestore fails, still allow user to proceed as new user
          setIsNewUser(true);
          return { success: true, isNewUser: true };
        }
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error verifying code:', error);
      return { success: false };
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
      
      // In a real app, we would use the Firebase user ID
      // For development mode, generate a user ID
      const userId = auth.currentUser?.uid || `user_${Date.now()}`;
      console.log("Using user ID:", userId);
      
      // Check Firestore connectivity before trying to write
      if (!isDevelopmentMode()) {
        console.log("Testing Firebase connection before registration...");
        const connectionTest = await testFirebaseConnection();
        console.log("Firebase connection test results:", connectionTest);
        
        if (connectionTest.errors.length > 0) {
          console.warn("Firebase connectivity issues detected, but will attempt registration anyway");
        }
      }
      
      // Create new user object
      const newUser = new User({
        ...userData,
        id: userId,
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
      
      // Initialize in Firestore if not in development mode
      let firebaseSuccess = true;
      if (!isDevelopmentMode()) {
        try {
          console.log("Attempting to initialize user in Firestore...");
          await newUser.initialize();
          console.log("User initialized in Firestore successfully");
        } catch (firebaseError) {
          console.error("Error initializing in Firestore:", firebaseError);
          firebaseSuccess = false;
          // Don't return, continue with local storage
        }
      } else {
        console.log('Development mode: Skipping Firestore save for registration');
      }
      
      // Always save locally
      try {
        console.log("Saving user to AsyncStorage...");
        await newUser.save();
        console.log("User saved to AsyncStorage successfully");
      } catch (saveError) {
        console.error("Error saving user locally:", saveError);
        // Still continue
      }
      
      // Set user in state
      setUser(newUser);
      setIsNewUser(true);
      
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      // Try to save to AsyncStorage anyway as a last resort
      try {
        const fallbackUser = new User({
          ...userData,
          id: `local_${Date.now()}`,
          isAuthenticated: true,
          newUser: true
        });
        await AsyncStorage.setItem("user", JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        return true; // Return success since we have at least local data
      } catch (fallbackError) {
        console.error("Even fallback save failed:", fallbackError);
        return false;
      }
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
      if (!user) {
        console.error("Cannot update profile: No user is logged in");
        return false;
      }
      
      console.log("Updating profile with data:", JSON.stringify({
        name: profileData.name,
        hasProfileData: !!profileData.profileData
      }));
      
      // Update user object
      user.updateProfile(profileData);
      
      // Try saving to AsyncStorage first
      try {
        console.log("Saving updated user to AsyncStorage...");
        await AsyncStorage.setItem("user", JSON.stringify(user));
        console.log("User saved to AsyncStorage successfully");
      } catch (storageError) {
        console.error("Error saving to AsyncStorage:", storageError);
        // Continue with Firestore attempt
      }
      
      // If in production mode, test writing user data to Firestore
      if (!isDevelopmentMode()) {
        console.log("Testing user data write to Firestore...");
        const writeTest = await testUserDataWrite({
          id: user.id,
          name: user.name
        });
        console.log("Firestore write test results:", writeTest);
      }
      
      // Save full user data
      try {
        console.log("Saving complete user data...");
        await user.save();
        console.log("User data saved successfully");
      } catch (saveError) {
        console.error("Error in user.save():", saveError);
        // We already saved to AsyncStorage, so continue
      }
      
      // Update state with new user object to trigger re-renders
      console.log("Updating state with new user data");
      setUser({ ...user });
      
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