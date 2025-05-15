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
  const [stanfordEmail, setStanfordEmail] = useState("");
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
    if (!name.trim()) {
      Alert.alert("Invalid Name", "Please enter your name.");
      return;
    }
    if (!stanfordEmail.trim() || !stanfordEmail.endsWith("@stanford.edu")) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid Stanford email address ending with @stanford.edu."
      );
      return;
    }
    const userData = { phone, email, city, name, stanfordEmail };
    try {
      await AsyncStorage.mergeItem("user", JSON.stringify(userData));
      await updateProfile({ stanfordEmail });
      //send to backend
      console.log(
        "BasicInfo: Saving user data and navigating to photos screen"
      );
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
        {/* <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity> */}

        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          We already have your name and phone number from login.
        </Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#A9B7C5"
            autoCapitalize="words"
            keyboardType="default"
            autoFocus
          />
        </View>
        {/* Stanford Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Stanford Email</Text>
          <TextInput
            style={styles.input}
            value={stanfordEmail}
            onChangeText={setStanfordEmail}
            placeholder="Enter your Stanford email"
            placeholderTextColor="#A9B7C5"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <Text style={styles.title}>Where are you from?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter as 'City, State' or Country"
          placeholderTextColor="#B0B0B0"
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!name.trim() ||
              !stanfordEmail.trim() ||
              !stanfordEmail.endsWith("@stanford.edu")) &&
              styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={
            !name.trim() ||
            !stanfordEmail.trim() ||
            !stanfordEmail.endsWith("@stanford.edu")
          }
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    color: "#3A5A6A",
    marginBottom: 8,
  },
});
