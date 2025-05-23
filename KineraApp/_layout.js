import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";

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
function ProfileStackScreen(props) {
  const { user } = useAuth();
  
  // Create a unique key based on user data to force remounting when it changes
  // We'll use the updatedAt timestamp if available, or a random number if not
  const profileKey = user?.updatedAt?.toString() || 
                    user?.profileData?.updatedAt?.toString() || 
                    Date.now().toString();
  
  // Debug the route params passed to ProfileStackScreen
  console.log("ProfileStackScreen: Received props:", JSON.stringify(props.route?.params));
  
  return (
    <ProfileStack.Navigator 
      screenOptions={{ headerShown: false }}
      key={`profile-${profileKey}`} // Force remount when key changes
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        initialParams={props.route?.params} // Just pass through the params, don't force welcome
      />
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

function TabNavigator({ route }) {
  const { user } = useAuth();
  // Check if we're coming from onboarding and should show Profile first
  const initialTabName = route?.params?.screen || 'ProfileTab';
  const showWelcomeAnimation = route?.params?.params?.showWelcome || false;
  
  console.log(`TabNavigator: Initial tab set to ${initialTabName}, showWelcome: ${showWelcomeAnimation}`);
  
  return (
    <Tab.Navigator
      initialRouteName={initialTabName}
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
      {/* Profile tab first for better initial experience */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ tabBarLabel: "Profile" }}
        initialParams={route?.params?.params} // Just pass through the params, don't add flags
      />
      
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: "Home" }}
      />
      
      {/* Show Match Portal tab for all users */}
      <Tab.Screen
        name="AvailabilityTab"
        component={AvailabilityStackScreen}
        options={{ tabBarLabel: "Match Portal" }}
      />
    </Tab.Navigator>
  );
}

// Simple test auth component to debug the white screen issue
function TestAuthComponent() {
  console.log("🧪 TestAuthComponent rendering");
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      padding: 20
    }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>
        🔓 Auth Screen Working!
      </Text>
      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        This means the logout transition works.
        {'\n'}The issue was with AuthNavigator.
      </Text>
    </View>
  );
}

export default function Layout() {
  const { user, isLoading, isNewUser } = useAuth();
  
  // Determine if user is logged in
  const isLoggedIn = !!user && user.isAuthenticated === true;
  
  console.log("🔄 Layout render - Auth state:", { 
    hasUser: !!user, 
    isAuthenticated: !!user?.isAuthenticated,
    isLoading,
    isNewUser: isNewUser,
    shouldGoToMain: isLoggedIn && !isNewUser,
    willShowAuth: !isLoggedIn,
    willShowMain: isLoggedIn
  });

  // Show loading screen while checking auth status
  if (isLoading) {
    console.log("⏳ Layout: Showing loading screen");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED7E31" />
      </View>
    );
  }

  console.log(`🏗️ Layout: Rendering NavigationContainer with ${isLoggedIn ? 'Main' : 'Auth'} screen`);

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {isLoggedIn ? (
          // User is logged in - show main app
          <RootStack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{ gestureEnabled: false }} // Prevent swipe back to auth
          />
        ) : (
          // User is not logged in - show auth flow
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
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
