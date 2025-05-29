import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions } from "react-native";

const OPTIONS = [
  { label: "Straight", value: "straight" },
  { label: "Gay", value: "gay" },
  { label: "Bisexual", value: "bisexual" },
  { label: "Pansexual", value: "pansexual" },
];

export default function SexualityScreen({ navigation, route }) {
  const [selected, setSelected] = useState(null);
  const { updateProfile, updateIsNewUser } = useAuth();
  const { width, height } = Dimensions.get("window");

  const handleContinue = async () => {
    if (!selected) return;

    try {
      console.log("Submitting sexuality:", { sexuality: selected });

      // Save sexuality to profileData using the standard format
      await updateProfile({
        profileData: {
          sexuality: selected,
        },
      });

      // Mark onboarding as complete
      await AsyncStorage.setItem("onboardingComplete", "true");

      // Update the user's isNewUser status to false using the AuthContext function
      // This will trigger the _layout.js to re-render and show the main app
      await updateIsNewUser(false);

      // Update the profile to mark the user as no longer new
      await updateProfile({
        newUser: false,
      });

      console.log("✅ Onboarding completed successfully - user should transition to main app");

    } catch (error) {
      console.error("Error saving sexuality:", error);
      Alert.alert("Error", "There was a problem saving your selection.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Back Arrow */}
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>What is your{"\n"}sexuality?</Text>
        <Text style={{ color: "#3A5A6A", fontSize: width * 0.04 }}>
          We'll need this info to match you with others if you ever want to date
          on our platform
        </Text>
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selected === option.value && styles.selectedButton,
              ]}
              onPress={() => setSelected(option.value)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.continueButton, !selected && { opacity: 0.5 }]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  backArrow: {
    position: "absolute",
    top: "5%",
    left: "5%",
    zIndex: 1,
  },
  arrowText: {
    fontSize: 32,
    color: "#3A5A6A",
  },
  title: {
    fontSize: 32,
    color: "#3A5A6A",
    fontWeight: "400",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  optionsContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#3A5A6A",
    paddingVertical: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#B0C4D9",
    borderColor: "#3A5A6A",
  },
  optionText: {
    color: "#3A5A6A",
    fontSize: 28,
  },
  continueButton: {
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3A5A6A",
    marginTop: 16,
  },
  continueText: {
    color: "#3A5A6A",
    fontSize: 24,
  },
});
