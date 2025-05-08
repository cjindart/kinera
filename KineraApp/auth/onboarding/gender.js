import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  ScrollView,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

const CIRCLE_SIZE = width * 0.5; // 50% of screen width

// Gender symbol components
const FemaleSymbol = () => (
  <Text style={{ fontSize: width * 0.12, color: "#3A5A6A" }}>♀</Text>
);
const MaleSymbol = () => (
  <Text style={{ fontSize: width * 0.12, color: "#3A5A6A" }}>♂</Text>
);
const BothSymbol = () => (
  <View style={{ alignItems: "center" }}>
    <Text style={{ fontSize: width * 0.12, color: "#3A5A6A" }}>♀</Text>
    <Text
      style={{
        fontSize: width * 0.08,
        color: "#3A5A6A",
        marginTop: -width * 0.06,
      }}
    >
      ♂
    </Text>
  </View>
);

const OPTIONS = [
  { label: "female", value: "female", Icon: FemaleSymbol },
  { label: "male", value: "male", Icon: MaleSymbol },
  { label: "other", value: "other", Icon: null },
];

export default function GenderScreen({ navigation, route }) {
  const [selected, setSelected] = useState(null);
  const [otherText, setOtherText] = useState("");
  const { updateProfile } = useAuth();

  const handleNext = async () => {
    if (!selected) return;
    
    try {
      const gender = selected === "other" ? otherText : selected;
      console.log("Submitting gender:", { gender });
      
      // Save gender to the profileData structure
      await updateProfile({ 
        profileData: { 
          gender 
        } 
      });
      
      // Navigate to next screen
      navigation.navigate("sexuality", { ...route.params, gender });
    } catch (error) {
      console.error("Error saving gender:", error);
      Alert.alert("Error", "There was a problem saving your selection.");
    }
  };
  const handleBack = () => {
    navigation.goBack();
  };

  const isContinueEnabled =
    selected &&
    (selected !== "other" ||
      (selected === "other" && otherText.trim().length > 0));

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backArrow} onPress={handleBack}>
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>What's your{"\n"}gender?</Text>
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
              {option.Icon && <option.Icon />}
              <Text
                style={[
                  styles.optionText,
                  selected === option.value && styles.selectedText,
                ]}
              >
                {option.label}
              </Text>
              {/* Show text input if "other" is selected */}
              {option.value === "other" && (
                <TextInput
                  style={styles.otherInput}
                  placeholder="Please specify"
                  placeholderTextColor="#B0B0B0"
                  value={otherText}
                  onChangeText={setOtherText}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.continueButton, !isContinueEnabled && { opacity: 0.5 }]}
        onPress={handleNext}
        disabled={!isContinueEnabled}
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
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.05,
  },
  backArrow: {
    position: "absolute",
    top: "5%",
    left: "5%",
    zIndex: 1,
  },
  arrowText: {
    fontSize: width * 0.08,
    color: "#3A5A6A",
  },
  title: {
    fontSize: width * 0.08,
    color: "#3A5A6A",
    fontWeight: "400",
    textAlign: "center",
    //marginTop: height * 0.05,
    //marginBottom: height * 0.04,
    //fontFamily: "Noteworthy-Bold",
  },
  optionsContainer: {
    marginTop: height * 0.04,
    marginBottom: height * 0.03,
    alignItems: "center",
  },
  optionButton: {
    backgroundColor: "#E6EEF3",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: "#3A5A6A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3A5A6A",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: height * 0.025,
    flexDirection: "column",
  },
  selectedButton: {
    backgroundColor: "#B0C4D9",
    borderColor: "#3A5A6A",
  },
  optionText: {
    color: "#3A5A6A",
    fontSize: width * 0.06,
    // fontFamily: "Noteworthy-Bold",
    marginTop: 8,
  },
  selectedText: {
    color: "#fff",
  },
  otherInput: {
    marginTop: height * 0.015,
    borderWidth: 1.5,
    borderColor: "#3A5A6A",
    borderRadius: 12,
    padding: height * 0.015,
    width: "80%",
    fontSize: width * 0.045,
    color: "#3A5A6A",
    backgroundColor: "#F8F9FB",
    //fontFamily: "Noteworthy-Bold",
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    paddingVertical: height * 0.02,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3A5A6A",
    marginTop: height * 0.02,
    width: "100%",
  },
  continueText: {
    color: "#3A5A6A",
    fontSize: width * 0.06,
    //fontFamily: "Noteworthy-Bold",
  },
});
