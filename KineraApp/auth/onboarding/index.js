import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import only the screens we need for simplified flow
import BasicInfoScreen from "./basicInfo";
import UserTypeScreen from "./userType";
import PhotosScreen from "./photos";

// Import but don't use the rest (kept for reference)
import GenderScreen from "./gender";
import SexualityScreen from "./sexuality";
import AgeHeightScreen from "./ageAndHeight";
import InterestsScreen from "./interests";
import ActivitiesScreen from "./activities";
import AddFriendsScreen from "./addFriends";
import StanfordEmailScreen from "./stanfordEmail";

const OnboardingStack = createNativeStackNavigator();

export default function OnboardingNavigator({ navigation, route }) {
  const { user, isNewUser: contextIsNewUser } = useAuth();
  const [isNewUser, setIsNewUser] = useState(true);
  
  // Simplified check for onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        console.log("OnboardingNavigator: Checking if user should see onboarding...");
        
        // If user has userType and is not forced into onboarding, go to Profile
        if (user && user.userType && !route?.params?.forceOnboarding) {
          console.log("OnboardingNavigator: User already has userType, going to Profile");
          navigation.reset({
            index: 0,
            routes: [
              { 
                name: 'Main',
                params: { 
                  screen: 'Profile',
                  params: { 
                    showWelcome: true,
                    isNewUser: true
                  }
                }
              }
            ]
          });
          return;
        }
        
        if (!isNewUser && !route?.params?.forceOnboarding) {
          console.log("OnboardingNavigator: User is not new, redirecting to Main");
          navigation.replace("Main");
        }
      } catch (error) {
        console.error("OnboardingNavigator: Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, [navigation, route, contextIsNewUser, user]);

  // Simplified navigator with only the essential screens
  return (
    <OnboardingStack.Navigator
      initialRouteName="basicInfo"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back
      }}
    >
      {/* Only include the three essential screens */}
      <OnboardingStack.Screen name="basicInfo" component={BasicInfoScreen} />
      <OnboardingStack.Screen name="photos" component={PhotosScreen} />
      <OnboardingStack.Screen 
        name="userType" 
        component={UserTypeScreen} 
        initialParams={{ isLastScreen: true }}
      />
    </OnboardingStack.Navigator>
  );
}
