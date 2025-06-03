import React, { useState } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, setIsNewUser } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import User from "../models/User";

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
  const auth = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("initial"); // 'initial', 'signup', 'login'

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

  const handleContinue = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      // Format phone number to E.164 format
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, "")}`;
      console.log(`Searching for user with phone: ${formattedPhone}`);

      // Direct Firestore query
      const {
        collection,
        query,
        where,
        getDocs,
      } = require("firebase/firestore");
      const { db } = require("../utils/firebase");

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phoneNumber", "==", formattedPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User found in Firestore
        const userData = querySnapshot.docs[0].data();
        const userId = querySnapshot.docs[0].id;
        console.log(`Found user with ID: ${userId}`);

        // Create a complete user object with all necessary data
        const user = {
          ...userData,
          id: userId,
          phoneNumber: formattedPhone,
          isAuthenticated: true,
          updatedAt: new Date().toISOString(),
        };

        console.log("🔑 LoginScreen: Setting user with data:", {
          id: user.id,
          isAuthenticated: user.isAuthenticated,
          hasProfileData: !!user.profileData,
          phoneNumber: user.phoneNumber,
          timestamp: user.updatedAt,
        });

        // Update auth context with complete user data and wait for it to complete
        await auth.setUser(user);

        // Create a User instance and save to ensure phone number is persisted
        const User = require("../models/User").default;
        const userInstance = new User(user);
        await userInstance.save();
        console.log(
          "📱 LoginScreen: User data saved with phone number:",
          formattedPhone
        );

        // IMPORTANT: Set isNewUser to false for existing users
        // This ensures they go directly to the Profile screen instead of onboarding
        await auth.updateIsNewUser(false);

        console.log(
          "✅ LoginScreen: User state set successfully, isNewUser set to false"
        );
      } else {
        console.log("No user found with this phone number");
        // Navigate to registration
        navigation.replace("Registration", { phoneNumber: formattedPhone });
      }
    } catch (error) {
      console.error("Error during login process:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    setMode("signup");
  };

  const navigateToLogin = () => {
    setMode("login");
  };

  const goBack = () => {
    setMode("initial");
  };

  // Initial welcome screen with login/signup options
  const renderInitialScreen = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
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

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Welcome to Vouch!</Text>

        <Text style={styles.infoSubtitle}>The rules are simple:</Text>
        <Text style={styles.infoText}>• Login and create a profile</Text>
        <Text style={styles.infoText}>
          • Choose if you want to date or just help match your friends
        </Text>
        <Text style={styles.infoText}>
          • Get your friends to join (at least 3 need to vouch for you)
        </Text>
        <Text style={styles.infoText}>• Go Vouch!</Text>

        <Text style={styles.infoSubtitle}>Instructions for dating option:</Text>
        <Text style={styles.infoText}>
          1. Once you have made your profile, if you have chosen to date, the
          app will generate a few candidates for you, and your friends will
          decide your fate!
        </Text>
        <Text style={styles.infoText}>
          2. The more friends you have on the app, the more the decision is
          distributed between them. If you have a few friends, more of the
          decision will fall on them, so choose carefully who you want to Vouch
          for you.
        </Text>
        <Text style={styles.infoText}>
          3. Once enough of your friends and your matches' friends have
          approved, you will be prompted with a google form to input your
          availability and a date will be set up for you!
        </Text>
        <Text style={styles.infoText}>
          4. The time and location will be determined by the preferences you
          have selected and then we will organize the date for you, all you have
          to do is show up!
        </Text>

        <Text style={styles.infoSubtitle}>Instructions for vouching:</Text>
        <Text style={styles.infoText}>
          1.As soon as you have friends who have selected the date option, your
          main screen will show you match options for them.
        </Text>
        <Text style={styles.infoText}>
          2. You will see which friend you are vouching for and who their match
          is and you can click to see additional details.
        </Text>
        <Text style={styles.infoText}>
          3.Then you get to choose yes or no for the match. You won't be able to
          see other's responses to this match, and others will not see your
          response either. It is completely anonymous.
        </Text>

        <Text style={styles.infoText}>
          You can do both!! Be a dater and a matchmaker.
        </Text>
      </View>
    </ScrollView>
  );

  // Phone number input screen
  const renderPhoneScreen = () => (
    <View style={styles.contentContainer}>
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
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground source={SUNSET_BG} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
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
    justifyContent: "center",
    alignItems: "center",
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
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
  },
  infoContainer: {
    width: width * 0.85,
    marginTop: 20,
    padding: 30,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 20,
    alignItems: "flex-start",
  },
  infoTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
  },
  infoSubtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 10,
    lineHeight: 22,
  },
});
