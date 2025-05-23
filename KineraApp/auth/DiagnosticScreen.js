import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import Constants from 'expo-constants';

export default function DiagnosticScreen() {
  const [diagnostics, setDiagnostics] = useState({});
  const auth = useAuth();

  useEffect(() => {
    // Collect diagnostic information
    const collectDiagnostics = () => {
      const info = {
        // Platform info
        platform: require('react-native').Platform.OS,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        
        // Environment variables
        envVars: {
          hasFirebaseApiKey: !!process.env.FIREBASE_API_KEY,
          hasFirebaseAuthDomain: !!process.env.FIREBASE_AUTH_DOMAIN,
          hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
          firebaseApiKeyStart: process.env.FIREBASE_API_KEY ? process.env.FIREBASE_API_KEY.substring(0, 10) + '...' : 'NOT SET',
        },
        
        // Expo constants
        expoConstants: {
          hasFirebaseApiKey: !!Constants.expoConfig?.extra?.firebaseApiKey,
          hasFirebaseAuthDomain: !!Constants.expoConfig?.extra?.firebaseAuthDomain,
          hasFirebaseProjectId: !!Constants.expoConfig?.extra?.firebaseProjectId,
          firebaseApiKeyStart: Constants.expoConfig?.extra?.firebaseApiKey ? 
            Constants.expoConfig.extra.firebaseApiKey.substring(0, 10) + '...' : 'NOT SET',
        },
        
        // Auth context
        authContext: {
          hasUser: !!auth.user,
          isLoading: auth.isLoading,
          isNewUser: auth.isNewUser,
          hasRegisterFunction: !!auth.registerWithoutVerification,
        },
        
        // Error catching
        errors: [],
        timestamp: new Date().toISOString()
      };
      
      // Test Firebase config
      try {
        const { firebaseConfig } = require("../utils/firebase");
        info.firebaseConfig = {
          hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'fallback-api-key',
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          apiKeyStart: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'MISSING'
        };
      } catch (error) {
        info.errors.push(`Firebase config error: ${error.message}`);
      }
      
      setDiagnostics(info);
      console.log('🔍 Diagnostic Info:', info);
    };
    
    collectDiagnostics();
  }, [auth]);

  const handleTestAuth = async () => {
    try {
      console.log('🧪 Testing auth registration...');
      const result = await auth.registerWithoutVerification('+15551234567');
      console.log('✅ Test auth result:', result);
      alert(`Test auth result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('❌ Test auth error:', error);
      alert(`Test auth error: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Kinera Diagnostics</Text>
        <Text style={styles.subtitle}>Debugging Production Issues</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Info</Text>
        <Text style={styles.item}>Platform: {diagnostics.platform}</Text>
        <Text style={styles.item}>Hostname: {diagnostics.hostname}</Text>
        <Text style={styles.item}>Timestamp: {diagnostics.timestamp}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Variables</Text>
        <Text style={styles.item}>
          Firebase API Key: {diagnostics.envVars?.hasFirebaseApiKey ? '✅' : '❌'} 
          {diagnostics.envVars?.firebaseApiKeyStart}
        </Text>
        <Text style={styles.item}>
          Auth Domain: {diagnostics.envVars?.hasFirebaseAuthDomain ? '✅' : '❌'}
        </Text>
        <Text style={styles.item}>
          Project ID: {diagnostics.envVars?.hasFirebaseProjectId ? '✅' : '❌'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expo Constants</Text>
        <Text style={styles.item}>
          Firebase API Key: {diagnostics.expoConstants?.hasFirebaseApiKey ? '✅' : '❌'} 
          {diagnostics.expoConstants?.firebaseApiKeyStart}
        </Text>
        <Text style={styles.item}>
          Auth Domain: {diagnostics.expoConstants?.hasFirebaseAuthDomain ? '✅' : '❌'}
        </Text>
        <Text style={styles.item}>
          Project ID: {diagnostics.expoConstants?.hasFirebaseProjectId ? '✅' : '❌'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firebase Config</Text>
        <Text style={styles.item}>
          Valid API Key: {diagnostics.firebaseConfig?.hasApiKey ? '✅' : '❌'}
        </Text>
        <Text style={styles.item}>Auth Domain: {diagnostics.firebaseConfig?.authDomain}</Text>
        <Text style={styles.item}>Project ID: {diagnostics.firebaseConfig?.projectId}</Text>
        <Text style={styles.item}>API Key Start: {diagnostics.firebaseConfig?.apiKeyStart}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Context</Text>
        <Text style={styles.item}>Has User: {diagnostics.authContext?.hasUser ? '✅' : '❌'}</Text>
        <Text style={styles.item}>Is Loading: {diagnostics.authContext?.isLoading ? '⏳' : '✅'}</Text>
        <Text style={styles.item}>
          Register Function: {diagnostics.authContext?.hasRegisterFunction ? '✅' : '❌'}
        </Text>
      </View>

      {diagnostics.errors && diagnostics.errors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Errors</Text>
          {diagnostics.errors.map((error, index) => (
            <Text key={index} style={styles.error}>{error}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.testButton} onPress={handleTestAuth}>
        <Text style={styles.testButtonText}>🧪 Test Auth Registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#325475',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#325475',
  },
  item: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: '#ED7E31',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 