// tabs/tabNav.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeStackScreen from "../_layout";
import AvailabilityStackScreen from "../_layout";
import ProfileStackScreen from "../_layout";

import theme from "../assets/theme";

const Tab = createBottomTabNavigator();

export default function TabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Match Portal") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.highlight,
        tabBarInactiveTintColor: "gray",
        // tabBarStyle: {
        //   backgroundColor: theme.colors.background,
        // },
        headerShown: false,
        tabBarStyle: {
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
      })}
    >
      <Tab.Screen name="Match Portal" component={AvailabilityStackScreen} />
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}
