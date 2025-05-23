import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text } from "react-native";
import SimpleLoginScreen from "./SimpleLoginScreen";
import RegistrationScreen from "./RegistrationScreen";
import OnboardingNavigator from "./onboarding";

const AuthStack = createNativeStackNavigator();

export default function AuthNavigator() {
  console.log("🚪 AuthNavigator rendering with SimpleLoginScreen...");
  
  try {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={SimpleLoginScreen} />
        <AuthStack.Screen name="Registration" component={RegistrationScreen} />
        <AuthStack.Screen name="Onboarding" component={OnboardingNavigator} />
      </AuthStack.Navigator>
    );
  } catch (error) {
    console.error("💥 Error in AuthNavigator:", error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 18, textAlign: 'center' }}>
          AuthNavigator Error: {error.message}
        </Text>
      </View>
    );
  }
}
