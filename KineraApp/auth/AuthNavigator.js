import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./LoginScreen";
import RegistrationScreen from "./RegistrationScreen";
import OnboardingNavigator from "./onboarding";

const AuthStack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Registration" component={RegistrationScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingNavigator} />
    </AuthStack.Navigator>
  );
}
