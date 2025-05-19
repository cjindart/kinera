import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function InterestsScreen({ navigation, route }) {
  const [isEditing, setIsEditing] = useState(true); // Always editing in onboarding
  const [interests, setInterests] = useState([]);
  const [newInterestText, setNewInterestText] = useState("");
  const { updateProfile } = useAuth();

  const addNewInterest = () => {
    if (newInterestText.trim() === "") return;
    if (!interests.includes(newInterestText.trim())) {
      setInterests([...interests, newInterestText.trim()]);
      setNewInterestText("");
    } else {
      Alert.alert("Duplicate", "This interest already exists!");
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter((item) => item !== interest));
  };

  const handleContinue = async () => {
    if (!canContinue) {
      Alert.alert("Please add at least 3 interests");
      return;
    }
    
    try {
      console.log("Saving interests:", interests);
      
      // Save interests using the standardized structure
      await updateProfile({
        profileData: {
          interests: interests
        }
      });
      
      // Navigate to next screen
      navigation.navigate("activities", { ...route?.params, interests });
    } catch (error) {
      console.error("Error saving interests:", error);
      Alert.alert("Error", "There was a problem saving your interests.");
    }
  };

  // Uncomment the following line to require at least 3 interests before continuing
  const canContinue = interests.length >= 3;
  // const canContinue = true;

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>What are your interests?</Text>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Enter at least 3 interests:</Text>
          {isEditing && (
            <TouchableOpacity
              style={styles.addCircleButton}
              onPress={() => {
                if (newInterestText.trim() !== "") {
                  addNewInterest();
                } else {
                  Alert.alert("Please enter an interest in the field below");
                }
              }}
            >
              <Ionicons name="add" size={20} color="#FAEFE4" />
            </TouchableOpacity>
          )}
        </View>
        {isEditing && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Music, Sports, Art, Animals, etc."
              value={newInterestText}
              onChangeText={setNewInterestText}
              onSubmitEditing={addNewInterest}
            />
          </View>
        )}
        <View style={styles.tagsContainer}>
          {interests.map((interest, index) => (
            <View key={index} style={[styles.tagPill, styles.editableTagPill]}>
              <Text style={styles.tagText}>{interest}</Text>
              <TouchableOpacity
                style={styles.removeIconContainer}
                onPress={() => removeInterest(interest)}
              >
                <Ionicons name="close-circle" size={18} color="#325475" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
  sectionContainer: {
    paddingHorizontal: 0,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 18,
    color: "#325475",
  },
  addCircleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ED7E31",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#A9B7C5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#E6EEF4",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagPill: {
    backgroundColor: "#FAEFE4",
    borderWidth: 1,
    borderColor: "#325475",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  editableTagPill: {
    paddingRight: 25, // Make room for the remove icon
    backgroundColor: "#E6EEF4",
    borderColor: "#A9B7C5",
  },
  tagText: {
    fontSize: 14,
    color: "#325475",
  },
  removeIconContainer: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  button: {
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#3A5A6A",
  },
  buttonText: {
    color: "#3A5A6A",
    fontSize: 24,
  },
});
