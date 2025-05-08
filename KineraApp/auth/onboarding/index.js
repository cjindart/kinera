import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function OnboardingNavigator({ navigation, route }) {
  const { user, isNewUser: contextIsNewUser } = useAuth();
  const [isNewUser, setIsNewUser] = useState(true);
  
  // Simpler, more deterministic approach to decide if we should show onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        console.log("OnboardingNavigator: Checking if user should see onboarding...");
        console.log("Current user:", user ? { 
          id: user.id, 
          name: user.name,
          hasProfile: !!user.profileData,
          profileFields: Object.keys(user.profileData || {}).length
        } : "No user");
        
        // HIGHEST PRIORITY: Check for explicit params from the navigation
        if (route?.params?.forceOnboarding) {
          console.log("OnboardingNavigator: forceOnboarding param received, showing onboarding");
          setIsNewUser(true);
          return;
        }
        
        // Next, check AsyncStorage for authoritative isNewUser value
        const storedValue = await AsyncStorage.getItem('isNewUser');
        console.log(`OnboardingNavigator: AsyncStorage isNewUser = '${storedValue}'`);
        
        if (storedValue === 'true') {
          // AsyncStorage says user is new, so show onboarding
          console.log("OnboardingNavigator: AsyncStorage indicates new user, showing onboarding");
          setIsNewUser(true);
          return;
        }
        
        // Check if user profile data exists and has required fields
        const hasRequiredFields = user && 
                                 user.profileData && 
                                 user.profileData.gender && 
                                 user.profileData.interests && 
                                 user.profileData.interests.length > 0;
                                 
        if (!hasRequiredFields) {
          console.log("OnboardingNavigator: User missing required profile fields, showing onboarding");
          setIsNewUser(true);
          return;
        }
        
        // If we don't have explicit storage value, check context
        if (contextIsNewUser === true) {
          console.log("OnboardingNavigator: Context indicates new user, showing onboarding");
          setIsNewUser(true);
          return;
        }
        
        // Additional safety: If coming from Registration screen, always show onboarding
        const previousScreen = route?.params?.comingFrom;
        if (previousScreen === 'Registration') {
          console.log("OnboardingNavigator: Coming from Registration, forcing onboarding");
          setIsNewUser(true);
          return;
        }
        
        // If we get here, user should not see onboarding
        console.log("OnboardingNavigator: User is not new, redirecting to Main");
        setIsNewUser(false);
        navigation.replace("Main");
      } catch (error) {
        console.error("OnboardingNavigator: Error checking onboarding status:", error);
        // Default to showing onboarding on error
        setIsNewUser(true);
      }
    };
    
    checkOnboardingStatus();
  }, [navigation, route, contextIsNewUser]);

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
