import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";

// Import onboarding screens
import BasicInfoScreen from "./basicInfo";
import UserTypeScreen from "./userType";
import GenderScreen from "./gender";
import SexualityScreen from "./sexuality";
import AgeHeightScreen from "./ageAndHeight";
import PhotosScreen from "./photos";
import InterestsScreen from "./interests";
import ActivitiesScreen from "./activities";
import AddFriendsScreen from "./addFriends";
import StanfordEmailScreen from "./stanfordEmail";

const OnboardingStack = createNativeStackNavigator();

export default function OnboardingNavigator({ navigation }) {
  const { user, isNewUser, updateProfile } = useAuth();
  
  // Force new user flag to be set if coming from auth flow
  useEffect(() => {
    if (!isNewUser) {
      // This prevents users from accessing onboarding again after completing it
      navigation.replace("Main");
    }
  }, [isNewUser, navigation]);

  return (
    <OnboardingStack.Navigator
      initialRouteName="basicInfo"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back
      }}
    >
      {/* Basic Info - Always first */}
      <OnboardingStack.Screen name="basicInfo" component={BasicInfoScreen} />
      
      {/* Photos - Always second */}
      <OnboardingStack.Screen name="photos" component={PhotosScreen} />
      
      {/* User Type Selection - Always third */}
      <OnboardingStack.Screen name="userType" component={UserTypeScreen} />
      
      {/* Screens for daters - only shown if user type is "dater" or "both" */}
      <OnboardingStack.Screen name="gender" component={GenderScreen} />
      <OnboardingStack.Screen name="sexuality" component={SexualityScreen} />
      <OnboardingStack.Screen name="ageAndHeight" component={AgeHeightScreen} />
      <OnboardingStack.Screen name="interests" component={InterestsScreen} />
      
      {/* Activities selection - shown to both user types */}
      <OnboardingStack.Screen name="activities" component={ActivitiesScreen} />
      
      {/* Stanford email verification - before adding friends */}
      <OnboardingStack.Screen name="stanfordEmail" component={StanfordEmailScreen} />
      
      {/* Add Friends - last screen, shown to all user types */}
      <OnboardingStack.Screen name="addFriends" component={AddFriendsScreen} />
    </OnboardingStack.Navigator>
  );
}
