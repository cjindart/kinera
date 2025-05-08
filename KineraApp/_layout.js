import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View, StyleSheet } from "react-native";

import HomeScreen from "./tabs/Home";
import ProfileScreen from "./tabs/Profile";
import MatchPortalScreen from "./tabs/MatchPortal";
import CandidateProfile from "./tabs/CandidateProfile";
import SelectLiaison from "./tabs/SelectLiaison";
import MatchCompare from "./tabs/MatchCompare";
import AuthNavigator from "./auth/AuthNavigator";
import { useAuth } from "./context/AuthContext";

// Create stack navigators for each tab to allow for nested navigation
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
// const AvailabilityStack = createNativeStackNavigator();
const MatchPortalStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Stack navigator for Home tab
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="CandidateProfile" component={CandidateProfile} />
    </HomeStack.Navigator>
  );
}

// Stack navigator for Profile tab
function ProfileStackScreen() {
  const { user } = useAuth();
  
  // Create a unique key based on user data to force remounting when it changes
  // We'll use the updatedAt timestamp if available, or a random number if not
  const profileKey = user?.updatedAt?.toString() || 
                    user?.profileData?.updatedAt?.toString() || 
                    Date.now().toString();
  
  return (
    <ProfileStack.Navigator 
      screenOptions={{ headerShown: false }}
      key={`profile-${profileKey}`} // Force remount when key changes
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// Stack navigator for Availability tab
function AvailabilityStackScreen() {
  return (
    <MatchPortalStack.Navigator screenOptions={{ headerShown: false }}>
      <MatchPortalStack.Screen
        name="MatchPortalMain"
        component={MatchPortalScreen}
      />
      <MatchPortalStack.Screen
        name="MatchCompare"
        component={MatchCompare}
      />
      <MatchPortalStack.Screen
        name="SelectLiaison"
        component={SelectLiaison}
      />
    </MatchPortalStack.Navigator>
  );
}

function TabNavigator() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "AvailabilityTab") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ED7E31", // Using accent orange from our color scheme
        tabBarInactiveTintColor: "#A9B7C5", // Using muted blue from our color scheme
      })}
    >
      {/* Show Match Portal tab for all users */}
      <Tab.Screen
        name="AvailabilityTab"
        component={AvailabilityStackScreen}
        options={{ tabBarLabel: "Match Portal" }}
      />
      
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: "Home" }}
      />
      
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function Layout() {
  const { user, isLoading, isNewUser } = useAuth();
  
  // Determine if user is logged in
  const isLoggedIn = !!user && user.isAuthenticated === true;
  
  console.log("Layout render - Auth state:", { 
    hasUser: !!user, 
    isAuthenticated: !!user?.isAuthenticated,
    isLoading,
    isNewUser
  });

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED7E31" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={isLoggedIn ? (isNewUser ? "Auth" : "Main") : "Auth"}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ gestureEnabled: false }} // Prevent swipe back to auth
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
