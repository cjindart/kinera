import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import only the screens we need for simplified flow
import BasicInfoScreen from "./basicInfo";
import UserTypeScreen from "./userType";
import PhotosScreen from "./photos";
import GenderScreen from "./gender";
import SexualityScreen from "./sexuality";

// Import but don't use the rest (kept for reference)
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
        console.log(
          "OnboardingNavigator: Checking if user should see onboarding..."
        );

        // Only skip onboarding if user has completed all required steps
        const onboardingComplete = await AsyncStorage.getItem(
          "onboardingComplete"
        );
        const hasUserType = user && user.userType;
        const hasGender = user?.profileData?.gender;
        const hasSexuality = user?.profileData?.sexuality;

        if (
          onboardingComplete === "true" &&
          hasUserType &&
          hasGender &&
          hasSexuality
        ) {
          console.log(
            "OnboardingNavigator: User has completed all required steps, going to Profile"
          );
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "Main",
                params: {
                  screen: "Profile",
                  params: {
                    showWelcome: true,
                    isNewUser: true,
                  },
                },
              },
            ],
          });
          return;
        }

        // If not completed all steps, ensure we're in onboarding
        if (!route?.params?.forceOnboarding) {
          console.log(
            "OnboardingNavigator: User has not completed all steps, staying in onboarding"
          );
        }
      } catch (error) {
        console.error(
          "OnboardingNavigator: Error checking onboarding status:",
          error
        );
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
      <OnboardingStack.Screen name="basicInfo" component={BasicInfoScreen} />
      <OnboardingStack.Screen name="photos" component={PhotosScreen} />
      <OnboardingStack.Screen name="userType" component={UserTypeScreen} />
      <OnboardingStack.Screen name="gender" component={GenderScreen} />
      <OnboardingStack.Screen
        name="sexuality"
        component={SexualityScreen}
        initialParams={{ isLastScreen: true }}
      />
    </OnboardingStack.Navigator>
  );
}
