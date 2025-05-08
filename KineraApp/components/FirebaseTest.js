import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { testFirebaseServices } from '../utils/firebaseDebug';

const FirebaseTest = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const testResults = await testFirebaseServices();
      setResults(testResults);
    } catch (error) {
      setResults({
        error: {
          message: error.message,
          code: error.code
        }
      });
    }
    setLoading(false);
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <Text style={styles.timestamp}>Timestamp: {results.timestamp}</Text>

        <Text style={styles.sectionTitle}>Authentication</Text>
        <Text>Initialized: {results.auth.initialized ? '✅' : '❌'}</Text>
        <Text>Current User: {results.auth.currentUser ? '✅' : '❌'}</Text>

        <Text style={styles.sectionTitle}>Firestore</Text>
        <Text>Success: {results.firestore.success ? '✅' : '❌'}</Text>
        {results.firestore.error && (
          <Text style={styles.error}>Error: {results.firestore.error.message}</Text>
        )}

        <Text style={styles.sectionTitle}>Storage</Text>
        <Text>Success: {results.storage.success ? '✅' : '❌'}</Text>
        {results.storage.error && (
          <Text style={styles.error}>Error: {results.storage.error.message}</Text>
        )}

        {results.error && (
          <Text style={styles.error}>Overall Error: {results.error.message}</Text>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={runTests}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Firebase Services'}
        </Text>
      </TouchableOpacity>
      {renderResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#325475',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#325475',
  },
  timestamp: {
    color: '#666',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginTop: 5,
  },
});

export default FirebaseTest; 