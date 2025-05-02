import React from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
export default function ProfileSetupScreen({ navigation }) {
  const handleNext = () => {
    // Save step data
    navigation.navigate("Step6");
  };
  const handleBack = () => {
    navigation.navigate("Step4");
  };

  return (
    <SafeAreaView>
      <Text>Step 8: Who are you looking for?</Text>
      {/* Add more fields as needed */}
      <Button title="Finish" onPress={handleFinish} />
    </SafeAreaView>
  );
}
