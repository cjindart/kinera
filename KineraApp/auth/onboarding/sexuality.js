import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OPTIONS = [
  { label: "Girls", value: "girls" },
  { label: "Guys", value: "guys" },
  { label: "Both!", value: "both" },
  { label: "Everyone in between", value: "everyone_in_between" },
];

export default function SexualityScreen({ navigation, route }) {
  const [selected, setSelected] = useState(null);

  const handleContinue = async () => {
    // Placeholder for backend logic
    console.log("Submitting sexuality to backend:", { lookingFor: selected });
    try {
      await AsyncStorage.mergeItem(
        "user",
        JSON.stringify({ lookingFor: selected })
      );
    } catch (error) {
      console.error("Error saving sexuality to AsyncStorage:", error);
    }
    navigation.navigate("lastStep", { ...route?.params, lookingFor: selected });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.navigate("Step7")}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Who are you{"\n"}looking for?</Text>
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
