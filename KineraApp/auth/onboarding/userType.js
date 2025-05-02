import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OPTIONS = [
  { label: "setting up a friend", value: "setup_friend" },
  { label: "getting set up by friends", value: "get_setup" },
  { label: "Both!", value: "both" },
];

export default function Step3PurposeScreen({ navigation, route }) {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    // You can use the selected value to determine the next step
    // Example: navigate to different screens based on selection
    if (selected === "setup_friend") {
      navigation.navigate("lastStep", { ...route.params, purpose: selected });
    } else if (selected === "get_setup") {
      navigation.navigate("Step4", {
        ...route.params,
        purpose: selected,
      });
    } else if (selected === "both") {
      navigation.navigate("Step4", { ...route.params, purpose: selected });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>What are you{"\n"}doing on setup?</Text>

      <View style={{ marginTop: 32, marginBottom: 24 }}>
        {OPTIONS.map((option, idx) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selected === option.value && styles.selectedButton,
            ]}
            onPress={() => setSelected(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                selected === option.value && styles.selectedText,
              ]}
            >
              {option.label}
            </Text>
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
    top: 20,
    left: 10,
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
    fontFamily: "Noteworthy-Bold",
  },
  optionButton: {
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#3A5A6A",
    paddingVertical: 18,
    marginBottom: 18,
    alignItems: "center",
    shadowColor: "#3A5A6A",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedButton: {
    backgroundColor: "#B0C4D9",
    borderColor: "#3A5A6A",
  },
  optionText: {
    color: "#3A5A6A",
    fontSize: 24,
    //fontFamily: "Noteworthy-Bold",
  },
  selectedText: {
    color: "#fff",
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
    fontFamily: "Noteworthy-Bold",
  },
});
