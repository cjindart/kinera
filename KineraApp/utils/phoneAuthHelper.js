import * as React from "react";
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha"; // Temporarily unused
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
// All Firebase imports for reCAPTCHA/auth temporarily unused if we bypass checks
// import { RecaptchaVerifier as FirebaseRecaptchaVerifier, getAuth } from "firebase/auth";
// import { getApp } from 'firebase/app'; 
// import { initFirebase, firebaseConfig } from "./firebase"; 

/**
 * A hook to manage Firebase Phone Authentication in Expo
 * @returns {Object} Phone auth utilities
 */
export function usePhoneAuth() {
  // initFirebase(); // Temporarily skip if all Firebase interaction is off
  
  // Refs are not actively used if reCAPTCHA is bypassed
  // const recaptchaVerifierRef = React.useRef(null); 
  // const webRecaptchaVerifierInstance = React.useRef(null); 
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  /**
   * TEMPORARILY MODIFIED: Bypasses all reCAPTCHA and Firebase auth.
   * Immediately simulates a successful phone number submission.
   */
  const sendVerificationCode = async (phoneNumber) => {
    setLoading(true);
    setError(null);
    console.log(`[TEMP BYPASS] Pretending to process phone: ${phoneNumber}`);

    try {
      await AsyncStorage.setItem("originalPhoneNumber", phoneNumber);
      console.log("[TEMP BYPASS] Saved original phone number to storage:", phoneNumber);

      // Simulate immediate success without any reCAPTCHA or Firebase auth
      const mockUser = {
        uid: `temp_bypass_user_${Date.now()}`,
        phoneNumber: phoneNumber,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };
      
      // Simulate new user flag, adjust if needed for testing login vs signup
      await AsyncStorage.setItem("isNewUser", "true"); 

      console.log("[TEMP BYPASS] Simulated success for phone:", phoneNumber);
      setLoading(false);
      return {
        success: true,
        user: mockUser,
        isNewUser: true, // Adjust for testing login (false) vs signup (true)
        phoneNumber: phoneNumber,
      };

    } catch (e) {
      console.error("[TEMP BYPASS] Error during AsyncStorage or mock user creation:", e);
      setError(e.message || "An unexpected error occurred during bypass.");
      setLoading(false);
      return { success: false, error: e.message || "Unexpected bypass error" };
    }
  };

  // confirmVerificationCode remains deprecated and largely a passthrough
  const confirmVerificationCode = async (verificationCode_IGNORED) => {
    console.warn("[TEMP BYPASS] confirmVerificationCode is deprecated.");
    setLoading(true);
    let originalPhoneNumber = null;
    try {
      originalPhoneNumber = await AsyncStorage.getItem("originalPhoneNumber");
      if (!originalPhoneNumber) throw new Error("Original phone number not found.");
      
      const mockUser = {
        uid: `temp_bypass_confirm_${Date.now()}`,
        phoneNumber: originalPhoneNumber,
        metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
        },
      };
      await AsyncStorage.setItem("isNewUser", "true");
      setLoading(false);
      return {
        success: true,
        user: mockUser,
        isNewUser: true, 
        phoneNumber: originalPhoneNumber
      };
    } catch (error) {
      console.error("[TEMP BYPASS] Error in deprecated confirmVerificationCode:", error);
      setError(error.message || "Failed to confirm (simulated)");
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const resetVerification = () => {
    setError(null);
    // No webRecaptchaVerifierInstance to clear in bypass mode
    console.log("[TEMP BYPASS] resetVerification called.");
  };

  return {
    // recaptchaVerifierRef, // Not used in bypass mode
    loading,
    error,
    sendVerificationCode,
    confirmVerificationCode, 
    resetVerification,
  };
}

/**
 * TEMPORARILY MODIFIED: RecaptchaComponent does nothing when bypassed.
 */
export function RecaptchaComponent({ recaptchaVerifier, onTokenReceived }) { 
  console.log("[TEMP BYPASS] RecaptchaComponent rendered, but is inactive.");
  // Render nothing, or a placeholder if it helps layout, but it won't be functional.
  return null; 
}

export { RecaptchaComponent as RecaptchaVerifier };
