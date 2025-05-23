import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";

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

export default function SimpleLoginScreen({ navigation }) {
  const { registerWithoutVerification, isLoading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mode, setMode] = useState("initial"); // 'initial', 'signup', 'login'

  console.log("🔧 SimpleLoginScreen rendering, mode:", mode);

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

    try {
      console.log(`📱 ${mode} with phone: ${phoneNumber}`);
      
      // Format the phone number for registration
      const formattedPhone = `+1${phoneNumber.replace(/\D/g, "")}`;
      
      // Use registerWithoutVerification for web compatibility
      const result = await registerWithoutVerification(formattedPhone);
      
      if (result.success) {
        console.log("✅ Registration successful:", result);
        
        // Navigate based on whether user is new or existing
        if (result.isNewUser) {
          navigation.navigate("Onboarding");
        } else {
          // User will be automatically navigated to Main by Layout
          console.log("Existing user - Layout will handle navigation");
        }
      } else {
        Alert.alert("Error", result.error || "Registration failed");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      Alert.alert("Error", "Failed to continue. Please try again.");
    }
  };

  const renderInitialScreen = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Welcome to Kinera</Text>
      <Text style={styles.subtitle}>Connect with Stanford students</Text>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setMode("signup")}
      >
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setMode("login")}
      >
        <Text style={styles.secondaryButtonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhoneScreen = () => (
    <View style={styles.centerContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setMode("initial")}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>
        {mode === "signup" ? "Create Account" : "Welcome Back"}
      </Text>
      <Text style={styles.subtitle}>Enter your phone number</Text>
      
      <TextInput
        style={styles.phoneInput}
        placeholder="(555) 123-4567"
        placeholderTextColor={COLORS.mutedBlue}
        value={phoneNumber}
        onChangeText={handlePhoneNumberChange}
        keyboardType="phone-pad"
        maxLength={14}
      />
      
      <TouchableOpacity
        style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? "Processing..." : "Continue"}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.webNote}>
        📱 Web Mode: Using simplified authentication
      </Text>
    </View>
  );

  return (
    <ImageBackground source={SUNSET_BG} style={styles.container} resizeMode="cover">
      <View style={styles.overlay}>
        {mode === "initial" ? renderInitialScreen() : renderPhoneScreen()}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.transparent,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 200,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    minWidth: 200,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    top: 100,
    left: 40,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 18,
  },
  phoneInput: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 30,
    minWidth: 250,
    textAlign: "center",
  },
  webNote: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 20,
    textAlign: "center",
    opacity: 0.8,
  },
}); 