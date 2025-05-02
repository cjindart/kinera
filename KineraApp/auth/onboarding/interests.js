import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Step1Screen({ navigation }) {
  const [name, setName] = useState("");

  const handleNext = () => {
    // Save step data
    navigation.navigate("lastStep");
  };
  const handleBack = () => {
    navigation.navigate("Step6");
  };

  return (
    <SafeAreaView>
      <Text>Step 7: interests</Text>
      <TextInput placeholder="Your name" value={name} onChangeText={setName} />
      <Button title="Next" onPress={handleNext} />
      <Button title="Back" onPress={handleBack} />
    </SafeAreaView>
  );
}
