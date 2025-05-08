import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Step1Screen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const { user, updateProfile } = useAuth();

  // Load existing user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedData = JSON.parse(userData);
          // Set the phone and name from existing data
          if (parsedData.phoneNumber) setPhone(parsedData.phoneNumber);
          if (parsedData.name) setName(parsedData.name);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);
  //   if (user) {
  //     // Set the phone and name from existing data
  //     if (user.phoneNumber) setPhone(user.phoneNumber);
  //     if (user.name) setName(user.name);
  //   }
  // }, [user]);

  const handleContinue = async () => {
    const userData = { phone, email, city };
    try {
      await AsyncStorage.mergeItem("user", JSON.stringify(userData));
      //send to backend
      console.log(userData);
      navigation.navigate("photos", userData);
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "There was a problem saving your information.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          We already have your name and phone number from login.
        </Text>
        <Text style={styles.title}>What is your Stanford Email?</Text>
        <TextInput
          style={styles.input}
          placeholder="sunet@stanford.edu"
          placeholderTextColor="#B0B0B0"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.title}>Where are you from?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter as 'City, State' or Country"
          placeholderTextColor="#B0B0B0"
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity
          style={[styles.button, !city.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!city.trim()}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// Example color palette based on your sketch
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: "30%",
    paddingTop: "10%",
  },
  backArrow: {
    position: "absolute",
    top: "5%",
    left: "5%",
    zIndex: 1,
  },
  arrowText: {
    fontSize: 32,
    color: "#3A5A6A", // Example blue
  },
  title: {
    fontSize: 32,
    color: "#3A5A6A",
    fontWeight: "400",
    textAlign: "center",
    marginTop: "5%",
    marginBottom: 32,
    //fontFamily: "Noteworthy-Bold", // Use your custom font if available
  },
  subtitle: {
    fontSize: 16,
    color: "#3A5A6A",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 2,
    borderColor: "#3A5A6A",
    borderRadius: 18,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
    color: "#3A5A6A",
    backgroundColor: "#F8F9FB",
    //fontFamily: "Noteworthy-Bold",
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
    //fontFamily: "Noteworthy-Bold",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
