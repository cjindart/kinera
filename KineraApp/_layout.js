import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "./tabs/Home";
import ProfileScreen from "./tabs/Profile";
import AvailabilityScreen from "./tabs/Availability";
import CandidateProfile from "./tabs/CandidateProfile";
import AuthNavigator from "./auth/AuthNavigator";
import tabNav from "./tabs/tabNav";

// Create stack navigators for each tab to allow for nested navigation
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AvailabilityStack = createNativeStackNavigator();
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
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// Stack navigator for Availability tab
function AvailabilityStackScreen() {
  return (
    <AvailabilityStack.Navigator screenOptions={{ headerShown: false }}>
      <AvailabilityStack.Screen
        name="AvailabilityMain"
        component={AvailabilityScreen}
      />
      <AvailabilityStack.Screen
        name="CandidateProfile"
        component={CandidateProfile}
      />
    </AvailabilityStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "AvailabilityTab") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "orange",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="AvailabilityTab"
        component={AvailabilityStackScreen}
        options={{ tabBarLabel: "Availability" }}
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
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      setInitialRoute(!!user ? "Main" : "Auth");
    } catch (error) {
      setInitialRoute("Auth");
    }
  };

  if (initialRoute === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={TabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
