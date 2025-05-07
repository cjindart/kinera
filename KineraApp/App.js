import React, { useEffect } from "react";
import { Linking, Platform } from "react-native";
import Layout from "./_layout";
import { AuthProvider } from "./context/AuthContext";
import * as WebBrowser from 'expo-web-browser';
import { auth } from "./utils/firebase";

export default function App() {
  // Initialize web browser sessions for authentication flows
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    
    // Handle deep links for Firebase authentication
    setupDeepLinking();
    
    return () => {
      // Clean up deep link handling if needed
    };
  }, []);
  
  // Set up deep link handling for Firebase authentication
  const setupDeepLinking = () => {
    // Handle initial URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("App opened with URL:", url);
        handleUrl(url);
      }
    }).catch(err => console.error('Error getting initial URL', err));
    
    // Add event listener for deep links while the app is running
    const linkingListener = Linking.addEventListener('url', (event) => {
      console.log("Deep link received:", event.url);
      handleUrl(event.url);
    });
    
    return () => {
      // Clean up
      linkingListener.remove();
    };
  };
  
  // Handle URL for Firebase authentication
  const handleUrl = (url) => {
    if (url && typeof url === 'string') {
      // Pass URL to Firebase Auth for handling
      if (Platform.OS === 'ios' && auth && typeof auth.canHandleURL === 'function') {
        auth.canHandleURL(url);
      }
    }
  };

  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
