import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Step1Screen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  const handleContinue = async () => {
    const userData = { phone, name, city };
    try {
      await AsyncStorage.mergeItem("user", JSON.stringify(userData));
      //send to backend
      console.log(userData);
    } catch (error) {
      console.error("Error saving user data to AsyncStorage:", error);
    }
    navigation.navigate("Step2", userData);
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

        <Text style={styles.title}>Enter your phone number</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your number here"
          placeholderTextColor="#B0B0B0"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Text style={styles.title}>What's Your Name?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name first last"
          placeholderTextColor="#B0B0B0"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.title}>Where are you from?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter as 'City, State' or Country"
          placeholderTextColor="#B0B0B0"
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
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
});
