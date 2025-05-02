import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import basicInfo from "./basicInfo";
import photos from "./photos";
import userType from "./userType";
import lastStep from "./ProfileSetupScreen";
import gender from "./gender";
import ageAndHeight from "./ageAndHeight";
import sexuality from "./sexuality";
import activities from "./activities";
import interests from "./interests";
const OnboardingStack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        // Prevent going back to login
        gestureEnabled: false,
      }}
    >
      <OnboardingStack.Screen name="Step1" component={basicInfo} />
      <OnboardingStack.Screen name="Step2" component={photos} />
      <OnboardingStack.Screen name="Step3" component={userType} />
      <OnboardingStack.Screen name="Step4" component={gender} />
      <OnboardingStack.Screen name="Step5" component={ageAndHeight} />
      <OnboardingStack.Screen name="Step6" component={activities} />
      <OnboardingStack.Screen name="Step7" component={interests} />
      <OnboardingStack.Screen name="lastStep" component={sexuality} />
    </OnboardingStack.Navigator>
  );
}
