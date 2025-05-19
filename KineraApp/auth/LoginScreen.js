import React, { useState, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePhoneAuth, RecaptchaVerifier } from '../utils/phoneAuthHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Background image of sunset
const SUNSET_BG = require('../assets/photos/sunset.jpg');

// Color scheme
const COLORS = {
  primaryNavy: "#325475",
  mutedBlue: "#A9B7C5",
  paleBlue: "#E6EEF4",
  offWhite: "#FAEFE4",
  accentOrange: "#ED7E31",
  buttonPeach: "#F7D0B5",
  buttonShadow: "#E98E42",
  transparent: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
};

export default function LoginScreen({ navigation }) {
  // Use the full auth context
  const auth = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState('initial'); // 'initial', 'signup', 'login'
  
  // Use the phoneAuth hook for Firebase Phone Authentication
  const { 
    recaptchaVerifier, 
    loading, 
    error, 
    sendVerificationCode, 
    confirmVerificationCode 
  } = usePhoneAuth();

  // Display any errors from phone authentication
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const formatPhoneNumber = (text) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
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
      // Format the phone number for Firebase (E.164 format)
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, '')}`;
      
      // Send verification code
      const success = await sendVerificationCode(formattedPhone);
      
      if (success) {
        setIsVerifying(true);
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      Alert.alert("Error", "Failed to send verification code. Please try again.");
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    try {
      // Verify the code
      const result = await confirmVerificationCode(verificationCode);
      
      if (result.success) {
        console.log("LoginScreen: Verification successful, result:", result);
        
        // Retrieve the original phone number if needed
        if (!result.phoneNumber) {
          try {
            const originalPhoneNumber = await AsyncStorage.getItem('originalPhoneNumber');
            if (originalPhoneNumber) {
              console.log("Retrieved original phone number from storage:", originalPhoneNumber);
              result.phoneNumber = originalPhoneNumber;
            }
          } catch (err) {
            console.warn("Failed to get original phone number from storage:", err);
          }
        }
        
        // IMPORTANT: Different behavior for login vs signup modes
        const currentMode = mode; // 'login' or 'signup'
        console.log(`Current mode: ${currentMode}`);
        
        // For signup, always force onboarding regardless of Firebase result
        if (currentMode === 'signup') {
          console.log("Signup mode - forcing onboarding flow");
          await AsyncStorage.setItem('isNewUser', 'true');
          
          // Register user with isNewUser flag set to true
          if (auth.register) {
            await auth.register({
              id: result.user.uid,
              phoneNumber: result.phoneNumber,
              isNewUser: true,
              isAuthenticated: true
            });
          }
          
          // Always go to onboarding for signup
          navigation.reset({
            index: 0,
            routes: [{ 
              name: "Registration",
              params: { forceOnboarding: true, comingFrom: 'Signup' }
            }]
          });
          return;
        }
        
        // For login mode (existing user), go directly to Main
        if (currentMode === 'login') {
          console.log("Login mode - Ensuring user is marked as existing user");
          
          // Set the isNewUser flag to false explicitly for login mode
          await AsyncStorage.setItem('isNewUser', 'false');
          
          // Look up the user by phone number in Firestore
          console.log(`Looking up user by phone number: ${result.phoneNumber}`);
          let existingUser = null;
          
          try {
            // Try to find the user by phone number first
            if (auth.findUserByPhone && result.phoneNumber) {
              // Make sure phone number is properly formatted
              const formattedPhone = result.phoneNumber.startsWith('+') ? 
                result.phoneNumber : 
                `+1${result.phoneNumber.replace(/\D/g, '')}`;
              
              console.log(`Searching Firestore with formatted phone: ${formattedPhone}`);
              existingUser = await auth.findUserByPhone(formattedPhone);
              console.log("Phone lookup result:", existingUser ? "User found" : "No user found");
            }
            
            // If no user found by phone, try by UID (fallback)
            if (!existingUser && auth.fetchUserData && result.user?.uid) {
              console.log("Fallback: Fetching user data by UID");
              existingUser = await auth.fetchUserData(result.user.uid);
            }
          } catch (error) {
            console.error("Error looking up existing user:", error);
          }
          
          // Register user with the right ID and phone number
          if (auth.register) {
            // If we have an existing user, use their ID to maintain the same record
            const userId = existingUser?.id || result.user.uid;
            console.log(`Using user ID for login registration: ${userId}`);
            
            await auth.register({
              // Start with any existing data
              ...(existingUser || {}),
              // Ensure these fields are set correctly
              id: userId,
              phoneNumber: result.phoneNumber,
              isNewUser: false,
              isAuthenticated: true
            });
          }
          
          // Navigate directly to the Main screen for login
          console.log("Login mode - Navigating directly to Main");
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }]
          });
          return;
        }
        
        // This is the fallback logic if mode is not explicitly set
        // For login mode, check if the user has an existing profile
        const userHasProfile = result.user && 
                              result.user.profileData && 
                              Object.keys(result.user.profileData || {}).length > 0;
        
        // Get user document from Firestore directly to ensure latest data
        let userDocumentExists = false;
        try {
          if (auth.fetchUserData && result.user?.uid) {
            const userData = await auth.fetchUserData(result.user.uid);
            userDocumentExists = !!userData;
            console.log("User document exists in Firestore:", userDocumentExists);
          }
        } catch (error) {
          console.error("Error checking user document:", error);
        }
        
        // Log what we found
        console.log("User check details:", {
          mode: currentMode,
          hasProfile: userHasProfile,
          userDocExists: userDocumentExists,
          isNewUserFromFirebase: result.isNewUser
        });
        
        // Determine if user should see onboarding based on all criteria
        const shouldShowOnboarding = result.isNewUser || (!userHasProfile && !userDocumentExists);
        
        // Set the isNewUser flag in AsyncStorage
        await AsyncStorage.setItem('isNewUser', shouldShowOnboarding ? 'true' : 'false');
        
        // Register user with the correct isNewUser flag
        if (auth.register) {
          await auth.register({
            id: result.user.uid,
            phoneNumber: result.phoneNumber,
            isNewUser: shouldShowOnboarding,
            isAuthenticated: true
          });
        }
        
        // Navigate to the right destination
        if (shouldShowOnboarding) {
          console.log("Login mode - User needs onboarding, redirecting to Registration");
          navigation.reset({
            index: 0,
            routes: [{ 
              name: "Registration",
              params: { forceOnboarding: true, comingFrom: 'Login' }
            }]
          });
        } else {
          console.log("Login mode - User already has profile, going to Main");
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }]
          });
        }
      } else {
        Alert.alert("Invalid Code", "The verification code you entered is invalid. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      Alert.alert("Error", "Failed to verify code. Please try again.");
    }
  };

  const navigateToSignup = () => {
    setMode('signup');
  };

  const navigateToLogin = () => {
    setMode('login');
  };

  const goBack = () => {
    if (isVerifying) {
      setIsVerifying(false);
      setVerificationCode('');
    } else {
      setMode('initial');
    }
  };

  // Initial welcome screen with login/signup options
  const renderInitialScreen = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.appTitle}>Vouch</Text>
      <Text style={styles.welcomeText}>Find activities and dates with friends</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={navigateToSignup}>
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={navigateToLogin}>
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Phone number input screen (both login and signup)
  const renderPhoneScreen = () => (
    <View style={styles.contentContainer}>
      {isVerifying ? (
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
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.instructionText}>
            {mode === 'signup' 
              ? 'Enter your phone number to get started' 
              : 'Enter your phone number to log in'}
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
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <ImageBackground source={SUNSET_BG} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        {/* Invisible reCAPTCHA component needed for Firebase Phone Auth */}
        <RecaptchaVerifier recaptchaVerifier={recaptchaVerifier} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.overlay}>
            {mode === 'initial' ? renderInitialScreen() : renderPhoneScreen()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 30,
    textAlign: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.primaryNavy,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.accentOrange,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
});
