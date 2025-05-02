import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Step1Screen({ navigation }) {
  const [name, setName] = useState("");

  const handleNext = () => {
    // Save step data
    navigation.navigate("Step5", { name });
  };
  const handleBack = () => {
    navigation.navigate("Step3");
  };

  return (
    <SafeAreaView>
      <Text>Step 4: What is your gender?</Text>
      <TextInput placeholder="Your name" value={name} onChangeText={setName} />
      <Button title="Next" onPress={handleNext} />
      <Button title="Back" onPress={handleBack} />
    </SafeAreaView>
  );
}
