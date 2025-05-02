import React from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
export default function ProfileSetupScreen({ navigation }) {
  const handleFinish = async () => {
    // Save profile setup, mark user as authenticated
    try {
      // Save user data in AsyncStorage
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ isAuthenticated: true })
      );
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              routes: [
                {
                  name: "HomeTab",
                  state: {
                    routes: [
                      {
                        name: "HomeMain",
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error saving auth status:", error);
    }
  };

  return (
    <SafeAreaView>
      <Text>Last Step: Who are you looking for?</Text>
      {/* Add more fields as needed */}
      <Button title="Finish" onPress={handleFinish} />
    </SafeAreaView>
  );
}
