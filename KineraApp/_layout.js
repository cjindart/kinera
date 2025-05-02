import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./tabs/Home";
import ProfileScreen from "./tabs/Profile";
import AvailabilityScreen from "./tabs/Availability";
import CandidateProfile from "./tabs/CandidateProfile";

const Tab = createBottomTabNavigator();
const AvailabilityStack = createNativeStackNavigator();

// Stack navigator for Availability tab
function AvailabilityStackScreen() {
  return (
    <AvailabilityStack.Navigator screenOptions={{ headerShown: false }}>
      <AvailabilityStack.Screen name="AvailabilityMain" component={AvailabilityScreen} />
      <AvailabilityStack.Screen name="CandidateProfile" component={CandidateProfile} />
    </AvailabilityStack.Navigator>
  );
}

export default function Layout() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Availability") {
              iconName = focused ? "calendar" : "calendar-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "orange",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Availability" component={AvailabilityStackScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
