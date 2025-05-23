import React, { useEffect } from "react";
import { Linking, Platform, Text, View } from "react-native";
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
  console.log('🚀 App component rendering...', { platform: Platform.OS });
  
  // Initialize web browser sessions for authentication flows
  useEffect(() => {
    console.log('🌐 Setting up web browser for auth...');
    WebBrowser.maybeCompleteAuthSession();
    
    // Setup deep linking for auth redirects
    setupDeepLinking();
    
    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Deep link received while app open:', event.url);
    });

    return () => subscription?.remove();
  }, []);

  console.log('🏗️ Rendering AuthProvider + Layout...');

  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
