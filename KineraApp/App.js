import React, { useEffect } from "react";
import { Linking, Platform } from "react-native";
import Layout from "./_layout";
import { AuthProvider } from "./context/AuthContext";
import * as WebBrowser from 'expo-web-browser';
import { auth, isDevelopmentMode } from "./utils/firebase";
import { setupDeepLinking } from "./utils/authRedirect";
import Constants from 'expo-constants';

// Import development setup utilities conditionally
if (__DEV__ || isDevelopmentMode()) {
  // This will run the development setup code
  require('./devSetup');
  console.log('Development setup imported');
}

export default function App() {
  // Initialize web browser sessions for authentication flows
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    
    // Handle deep links for Firebase authentication
    const cleanupDeepLinking = setupDeepLinking();
    
    // Get local IP information
    const localIp = Constants.expoConfig?.extra?.localIp || '10.27.145.110';
    
    // Log environment information
    if (isDevelopmentMode()) {
      console.log('🛠️ Running in development mode - Firebase Auth simulated');
    } else {
      console.log(`🚀 Running in PRODUCTION mode on local IP (${localIp})`);
      console.log('Using real Firebase services with direct authentication');
      console.log('Stanford email verification will be simulated for testing');
    }
    
    return () => {
      // Clean up deep linking
      if (cleanupDeepLinking) {
        cleanupDeepLinking();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
