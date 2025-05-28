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
    console.log(`[TEMP BYPASS] Processing phone: ${phoneNumber}`);

    try {
      await AsyncStorage.setItem("originalPhoneNumber", phoneNumber);
      console.log(
        "[TEMP BYPASS] Saved original phone number to storage:",
        phoneNumber
      );

      // Check if user exists in AsyncStorage first
      const existingUserData = await AsyncStorage.getItem("userData");
      let isNewUser = true;
      let userId = `temp_bypass_user_${Date.now()}`;

      if (existingUserData) {
        try {
          const parsedData = JSON.parse(existingUserData);
          if (parsedData.phoneNumber === phoneNumber) {
            console.log("[TEMP BYPASS] Found existing user in storage");
            isNewUser = false;
            userId = parsedData.id || userId;
          }
        } catch (e) {
          console.warn("[TEMP BYPASS] Error parsing existing user data:", e);
        }
      }

      // Create mock user with proper flags
      const mockUser = {
        uid: userId,
        phoneNumber: phoneNumber,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Set isNewUser flag based on whether we found an existing user
      await AsyncStorage.setItem("isNewUser", isNewUser.toString());

      console.log(
        `[TEMP BYPASS] ${
          isNewUser ? "New" : "Existing"
        } user processed for phone:`,
        phoneNumber
      );
      setLoading(false);
      return {
        success: true,
        user: mockUser,
        isNewUser: isNewUser,
        phoneNumber: phoneNumber,
      };
    } catch (e) {
      console.error(
        "[TEMP BYPASS] Error during AsyncStorage or mock user creation:",
        e
      );
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
      if (!originalPhoneNumber)
        throw new Error("Original phone number not found.");

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
        phoneNumber: originalPhoneNumber,
      };
    } catch (error) {
      console.error(
        "[TEMP BYPASS] Error in deprecated confirmVerificationCode:",
        error
      );
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
