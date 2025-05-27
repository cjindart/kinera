import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { usePhoneAuth, RecaptchaVerifier } from "../utils/phoneAuthHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// Background image of sunset
const SUNSET_BG = require("../assets/photos/sunset.jpg");

// Color scheme
const COLORS = {
  primaryNavy: "#325475",
  mutedBlue: "#A9B7C5",
  paleBlue: "#E6EEF4",
  offWhite: "#FAEFE4",
  accentOrange: "#ED7E31",
  buttonPeach: "#F7D0B5",
  buttonShadow: "#E98E42",
  transparent: "rgba(0,0,0,0.5)",
  white: "#FFFFFF",
};

export default function LoginScreen({ navigation }) {
  // Use the full auth context
  const auth = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState("initial"); // 'initial', 'signup', 'login'

  // Use the phoneAuth hook for Firebase Phone Authentication
  const {
    recaptchaVerifierRef,
    loading,
    error,
    sendVerificationCode,
    confirmVerificationCode,
    handleTokenReceived,
  } = usePhoneAuth();

  // Display any errors from phone authentication
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  const formatPhoneNumber = (text) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
      return;
    }

    try {
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, "")}`;
      
      // sendVerificationCode now attempts reCAPTCHA and returns a result object
      const result = await sendVerificationCode(formattedPhone);

      if (result && result.success) {
        console.log("LoginScreen: reCAPTCHA success, result from sendVerificationCode:", result);
        // No longer need to set isVerifying to true to show code input.
        // Directly use the result to proceed with login/signup logic.
        await processAuthResult(result); 
      } else {
        // Error handling if sendVerificationCode (reCAPTCHA) itself failed
        console.error("LoginScreen: sendVerificationCode (reCAPTCHA) failed or returned no success:", result);
        Alert.alert("Verification Failed", result?.error || "Could not verify. Please try again.");
      }
    } catch (error) {
      console.error("Error during sendVerificationCode call in LoginScreen:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred during verification. Please try again."
      );
    }
  };

  // This new function will contain the logic previously in handleVerifyCode
  // It's called with the result from a successful sendVerificationCode (post-reCAPTCHA)
  const processAuthResult = async (result) => {
    // The 'result' object here comes directly from sendVerificationCode after reCAPTCHA
    // It should contain: { success: true, user, isNewUser, phoneNumber }
    
    // setLoading(true); // sendVerificationCode already handles loading states

    try {
        console.log("LoginScreen: Processing auth result (post-reCAPTCHA):", result);

        // Retrieve the original phone number if needed (should be in result.phoneNumber)
        if (!result.phoneNumber) {
          try {
            const originalPhoneNumber = await AsyncStorage.getItem(
              "originalPhoneNumber"
            );
            if (originalPhoneNumber) {
              console.log(
                "Retrieved original phone number from storage (fallback):",
                originalPhoneNumber
              );
              result.phoneNumber = originalPhoneNumber;
            }
          } catch (err) {
            console.warn(
              "Failed to get original phone number from storage (fallback):",
              err
            );
          }
        }
        
        const currentMode = mode; 
        console.log(`Current mode for processing: ${currentMode}`);

        if (currentMode === "signup") {
          console.log("Signup mode - forcing onboarding flow");
          await AsyncStorage.setItem("isNewUser", "true");

          if (auth.register) {
            await auth.register({
              id: result.user.uid,
              phoneNumber: result.phoneNumber,
              isNewUser: true,
              isAuthenticated: true,
            });
          }
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "Registration",
                params: { forceOnboarding: true, comingFrom: "Signup" },
              },
            ],
          });
          return;
        }

        if (currentMode === "login") {
          console.log("Login mode - Ensuring user is marked as existing user");
          await AsyncStorage.setItem("isNewUser", "false");
          let existingUser = null;
          try {
            if (auth.findUserByPhone && result.phoneNumber) {
              const formattedPhoneForSearch = result.phoneNumber.startsWith("+")
                ? result.phoneNumber
                : `+1${result.phoneNumber.replace(/\D/g, "")}`;
              console.log(
                `Searching Firestore with formatted phone: ${formattedPhoneForSearch}`
              );
              existingUser = await auth.findUserByPhone(formattedPhoneForSearch);
              console.log(
                "Phone lookup result:",
                existingUser ? "User found" : "No user found"
              );
            }
            if (!existingUser && auth.fetchUserData && result.user?.uid) {
              console.log("Fallback: Fetching user data by UID");
              existingUser = await auth.fetchUserData(result.user.uid);
            }
          } catch (error) {
            console.error("Error looking up existing user:", error);
          }

          if (auth.register) {
            const userId = existingUser?.id || result.user.uid;
            console.log(`Using user ID for login registration: ${userId}`);
            await auth.register({
              ...(existingUser || {}),
              id: userId,
              phoneNumber: result.phoneNumber,
              isNewUser: false,
              isAuthenticated: true,
            });
          }
          console.log("Login mode - Navigating directly to Main");
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
          return;
        }

        // Fallback logic if mode is not explicitly 'signup' or 'login' (should ideally not happen)
        console.warn("Processing auth result in fallback mode path. Current mode:", currentMode);
        const userHasProfile =
          result.user &&
          result.user.profileData &&
          Object.keys(result.user.profileData || {}).length > 0;
        let userDocumentExists = false;
        try {
          if (auth.fetchUserData && result.user?.uid) {
            const userData = await auth.fetchUserData(result.user.uid);
            userDocumentExists = !!userData;
            console.log(
              "User document exists in Firestore (fallback path):",
              userDocumentExists
            );
          }
        } catch (error) {
          console.error("Error checking user document (fallback path):", error);
        }
        const shouldShowOnboarding =
          result.isNewUser || (!userHasProfile && !userDocumentExists);
        await AsyncStorage.setItem(
          "isNewUser",
          shouldShowOnboarding ? "true" : "false"
        );
        if (auth.register) {
          await auth.register({
            id: result.user.uid,
            phoneNumber: result.phoneNumber,
            isNewUser: shouldShowOnboarding,
            isAuthenticated: true,
          });
        }
        if (shouldShowOnboarding) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "Registration",
                params: { forceOnboarding: true, comingFrom: "Login_Fallback" },
              },
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        }
      // Original success part from handleVerifyCode is now integrated above
    } catch (error) {
      console.error("Error processing auth result (post-reCAPTCHA):", error);
      Alert.alert("Error", "Failed to process your request after verification. Please try again.");
    }
    // setLoading(false); // Ensure loading state is managed by sendVerificationCode
  };

  // handleVerifyCode is now effectively replaced by processAuthResult, 
  // called directly from handleSendCode. 
  // We can remove handleVerifyCode or comment it out.
  /*
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter the 6-digit verification code."
      );
      return;
    }
    try {
      // This confirmVerificationCode is the deprecated one from the helper
      const result = await confirmVerificationCode(verificationCode);
      if (result.success) {
        await processAuthResult(result); // Reuse the processing logic
      } else {
        Alert.alert(
          "Invalid Action", // Changed from "Invalid Code"
          result.error || "Could not complete the process. Please try again."
        );
      }
    } catch (error) {
      console.error("Error in (now deprecated) handleVerifyCode:", error);
      Alert.alert("Error", "Failed to complete process. Please try again.");
    }
  };
  */

  const navigateToSignup = () => {
    setMode("signup");
  };

  const navigateToLogin = () => {
    setMode("login");
  };

  const goBack = () => {
    if (isVerifying) {
      setIsVerifying(false);
      setVerificationCode("");
    } else {
      setMode("initial");
    }
  };

  // Initial welcome screen with login/signup options
  const renderInitialScreen = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.appTitle}>Vouch</Text>
      <Text style={styles.welcomeText}>
        Find activities and dates with friends
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={navigateToSignup}
        >
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={navigateToLogin}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Phone number input screen (both login and signup)
  const renderPhoneScreen = () => (
    <View style={styles.contentContainer}>
      {/* {isVerifying ? ( // This entire block for code verification is no longer needed */}
      {/* COMMENTING OUT THE VERIFICATION CODE INPUT UI
        <>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Verification Code</Text>
          <Text style={styles.instructionText}>
            Enter the 6-digit code sent to {phoneNumber}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={COLORS.mutedBlue}
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleVerifyCode} // This would call the deprecated version
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : ( */}
        {/* This is the phone number input part, which remains */}
        <>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {mode === "signup" ? "Create Your Account" : "Welcome Back"}
          </Text>
          <Text style={styles.instructionText}>
            {mode === "signup"
              ? "Enter your phone number to get started"
              : "Enter your phone number to log in"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="(___) ___-____"
            placeholderTextColor={COLORS.mutedBlue}
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSendCode} // This now triggers reCAPTCHA then processAuthResult
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </>
      {/* )} */}
    </View>
  );

  return (
    <ImageBackground source={SUNSET_BG} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        {/* Only render reCAPTCHA component when needed for phone auth */}
        {mode !== "initial" && (
          <RecaptchaVerifier 
            recaptchaVerifier={recaptchaVerifierRef} // For native
            // onTokenReceived={handleTokenReceived} // onTokenReceived is no longer used by phoneAuthHelper
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.overlay}>
            {mode === "initial" ? renderInitialScreen() : renderPhoneScreen()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: "center",
    alignItems: "center",
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
  },
  contentContainer: {
    width: width * 0.85,
    marginBottom: height * 0.03,
    padding: 30,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 20,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 30,
    textAlign: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.primaryNavy,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: COLORS.accentOrange,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
});
