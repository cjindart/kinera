import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Step1Screen({ navigation }) {
  const [name, setName] = useState("");

  const handleNext = () => {
    // Save step data
    //either go to step5 screen (finish profile setup) or enter app as just swiper
    navigation.navigate("Step4", { name });
    //or
    //navigation.navigate('Main');
  };

  const handleBack = () => {
    navigation.navigate("Step2");
  };

  return (
    <SafeAreaView>
      <Text>Step 3: What are you doing on SetUp?</Text>
      <TextInput placeholder="Your name" value={name} onChangeText={setName} />
      <Button title="Next" onPress={handleNext} />
      <Button title="Back" onPress={handleBack} />
    </SafeAreaView>
  );
}
