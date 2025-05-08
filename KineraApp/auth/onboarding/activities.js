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

export default function ActivitiesScreen({ navigation, route }) {
  const [isEditing, setIsEditing] = useState(true); // Always editing in onboarding
  const [activities, setActivities] = useState([]);
  const [newActivityText, setNewActivityText] = useState("");
  const { updateProfile } = useAuth();

  const addNewActivity = () => {
    if (newActivityText.trim() === "") return;
    if (!activities.includes(newActivityText.trim())) {
      setActivities([...activities, newActivityText.trim()]);
      setNewActivityText("");
    } else {
      Alert.alert("Duplicate", "This activity already exists!");
    }
  };

  const removeActivity = (activity) => {
    setActivities(activities.filter((item) => item !== activity));
  };

  const handleContinue = async () => {
    if (!canContinue) {
      Alert.alert("Please add at least 3 activities");
      return;
    }
    
    try {
      console.log("Saving activities:", activities);
      
      // Save activities using the standardized structure
      await updateProfile({
        profileData: {
          dateActivities: activities
        }
      });
      
      // Navigate to next screen
      navigation.navigate("stanfordEmail", { ...route?.params, activities });
    } catch (error) {
      console.error("Error saving activities:", error);
      Alert.alert("Error", "There was a problem saving your activities.");
    }
  };

  const canContinue = activities.length >= 3;
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
      <Text style={styles.title}>What are your favorite date activities?</Text>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Enter at least 3 activities:</Text>
          {isEditing && (
            <TouchableOpacity
              style={styles.addCircleButton}
              onPress={() => {
                if (newActivityText.trim() !== "") {
                  addNewActivity();
                } else {
                  Alert.alert("Please enter an activity in the field below");
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
              placeholder="Voyager, Jazz Night, Study Date, etc."
              value={newActivityText}
              onChangeText={setNewActivityText}
              onSubmitEditing={addNewActivity}
            />
          </View>
        )}
        <View style={styles.tagsContainer}>
          {activities.map((activity, index) => (
            <View key={index} style={[styles.tagPill, styles.editableTagPill]}>
              <Text style={styles.tagText}>{activity}</Text>
              <TouchableOpacity
                style={styles.removeIconContainer}
                onPress={() => removeActivity(activity)}
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
