import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const handleLogin = () => {
    // Save user info, then navigate to ProfileSetup
    navigation.navigate("ProfileSetup");
  };

  return (
    <SafeAreaView>
      <Text>Phone Number</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} />
      <Button title="Next" onPress={handleLogin} />
    </SafeAreaView>
  );
}
