import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";

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

  console.log("🎯 OnboardingNavigator rendered with params:", route?.params);

  // Simplified check for onboarding status
  useEffect(() => {
    console.log("🔄 OnboardingNavigator useEffect triggered with:", {
      hasUser: !!user,
      contextIsNewUser,
      routeParams: route?.params,
    });

    const checkOnboardingStatus = async () => {
      try {
        console.log("🔍 OnboardingNavigator: checkOnboardingStatus called...");
        console.log("📝 Route params:", route?.params);

        // If forceOnboarding is true, always show onboarding
        if (route?.params?.forceOnboarding) {
          console.log(
            "✅ OnboardingNavigator: forceOnboarding is true, showing onboarding"
          );
          return;
        }

        // Only skip onboarding if user has completed all required steps
        const onboardingComplete = await AsyncStorage.getItem(
          "onboardingComplete"
        );
        const hasUserType = user && user.userType;
        const hasGender = user?.profileData?.gender;
        const hasSexuality = user?.profileData?.sexuality;

        console.log("📊 Onboarding status check:", {
          onboardingComplete,
          hasUserType,
          hasGender,
          hasSexuality,
          forceOnboarding: route?.params?.forceOnboarding,
        });

        // If forceOnboarding is true or user hasn't completed all steps, stay in onboarding
        if (
          route?.params?.forceOnboarding ||
          !onboardingComplete ||
          !hasUserType ||
          !hasGender ||
          !hasSexuality
        ) {
          console.log(
            "⏳ OnboardingNavigator: User has not completed all steps or forceOnboarding is true, staying in onboarding"
          );
          return;
        }

        // Only navigate to Profile if all conditions are met
        console.log(
          "🎉 OnboardingNavigator: User has completed all required steps, going to Profile"
        );
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "Root",
                state: {
                  routes: [
                    {
                      name: "Main",
                      state: {
                        routes: [
                          {
                            name: "ProfileTab",
                            params: {
                              showWelcome: true,
                              isNewUser: false,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          })
        );
      } catch (error) {
        console.error(
          "💥 OnboardingNavigator: Error checking onboarding status:",
          error
        );
      }
    };

    checkOnboardingStatus();
  }, [navigation, route, contextIsNewUser, user]);

  // Simplified navigator with only the essential screens
  return (
    <OnboardingStack.Navigator
      initialRouteName="userType"
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
