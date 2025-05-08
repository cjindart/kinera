import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { testFirebaseServices, testUserDataWrite } from '../utils/firebaseDebug';
import { useAuth } from '../context/AuthContext';

const FirebaseTest = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileTestResults, setProfileTestResults] = useState(null);
  const { user } = useAuth();

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

  const testProfileData = async () => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error('No user found. Please sign in first.');
      }
      
      console.log('Current user profile data:', user.profileData);
      
      // Create a profile data sample based on the current user's data
      const profileData = {
        id: user.id,
        name: user.name || 'Test User',
        phoneNumber: user.phoneNumber,
        profileData: {
          // Use real user data if available, fall back to test data
          age: user.profileData?.age || 21,
          gender: user.profileData?.gender || 'Test Gender',
          height: user.profileData?.height || '5\'10"',
          year: user.profileData?.year || 'Senior',
          interests: user.profileData?.interests?.length > 0 
            ? [...user.profileData.interests] 
            : ['Testing', 'Debugging'],
          dateActivities: user.profileData?.dateActivities?.length > 0 
            ? [...user.profileData.dateActivities] 
            : ['Coding', 'Coffee'],
          photos: user.profileData?.photos || []
        }
      };
      
      console.log('Testing with profile data:', profileData);
      
      // Test writing the profile data
      const testResults = await testUserDataWrite(profileData);
      setProfileTestResults(testResults);
    } catch (error) {
      console.error('Profile test error:', error);
      setProfileTestResults({
        success: false,
        error: {
          message: error.message,
          code: error.code || 'unknown'
        }
      });
    }
    setLoading(false);
  };

  const renderProfileTestResults = () => {
    if (!profileTestResults) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Data Test Results</Text>
        <Text style={styles.timestamp}>Timestamp: {profileTestResults.timings?.end || new Date().toISOString()}</Text>
        
        <Text>Test Success: {profileTestResults.success ? '✅' : '❌'}</Text>
        
        {profileTestResults.readData && (
          <View style={styles.dataSection}>
            <Text style={styles.subtitle}>Data Read Back:</Text>
            <Text>User ID: {profileTestResults.readData.id}</Text>
            <Text>Name: {profileTestResults.readData.name}</Text>
            <Text>Phone: {profileTestResults.readData.phoneNumber}</Text>
            <Text>Updated At: {profileTestResults.readData.updatedAt}</Text>
            
            {profileTestResults.readData.profileData && (
              <View style={styles.nestedDataSection}>
                <Text style={styles.dataLabel}>Profile Data:</Text>
                <Text>Age: {profileTestResults.readData.profileData.age}</Text>
                <Text>Gender: {profileTestResults.readData.profileData.gender}</Text>
                <Text>Height: {profileTestResults.readData.profileData.height}</Text>
                <Text>Year: {profileTestResults.readData.profileData.year}</Text>
                
                <Text style={styles.dataLabel}>Interests:</Text>
                {profileTestResults.readData.profileData.interests?.map((interest, idx) => (
                  <Text key={`interest-${idx}`}>• {interest}</Text>
                ))}
                
                <Text style={styles.dataLabel}>Date Activities:</Text>
                {profileTestResults.readData.profileData.dateActivities?.map((activity, idx) => (
                  <Text key={`activity-${idx}`}>• {activity}</Text>
                ))}
                
                <Text style={styles.dataLabel}>Photos Count: {
                  profileTestResults.readData.profileData.photos?.length || 0
                }</Text>
              </View>
            )}
          </View>
        )}
        
        {profileTestResults.errors && profileTestResults.errors.length > 0 && (
          <View style={styles.dataSection}>
            <Text style={styles.error}>Errors:</Text>
            {profileTestResults.errors.map((error, index) => (
              <Text key={index} style={styles.error}>{error.message}</Text>
            ))}
          </View>
        )}
        
        {profileTestResults.error && (
          <Text style={styles.error}>Error: {profileTestResults.error.message}</Text>
        )}
      </View>
    );
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <Text style={styles.timestamp}>Timestamp: {results.timestamp}</Text>

        <Text style={styles.subtitle}>Authentication</Text>
        <Text>Initialized: {results.auth.initialized ? '✅' : '❌'}</Text>
        <Text>Current User: {results.auth.currentUser ? '✅' : '❌'}</Text>

        <Text style={styles.subtitle}>Firestore</Text>
        <Text>Success: {results.firestore.success ? '✅' : '❌'}</Text>
        {results.firestore.error && (
          <Text style={styles.error}>Error: {results.firestore.error.message}</Text>
        )}

        <Text style={styles.subtitle}>Storage</Text>
        <Text>Success: {results.storage.success ? '✅' : '❌'}</Text>
        {results.storage.error && (
          <Text style={styles.error}>Error: {results.storage.error.message}</Text>
        )}

        {results.error && (
          <Text style={styles.error}>Overall Error: {results.error.message}</Text>
        )}
      </View>
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
      
      <TouchableOpacity 
        style={[styles.button, styles.profileButton]} 
        onPress={testProfileData}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Profile Data Storage'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.resultsContainer}>
        {renderResults()}
        {renderProfileTestResults()}
      </ScrollView>
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
    marginBottom: 10,
  },
  profileButton: {
    backgroundColor: '#ED7E31',
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
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#325475',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#325475',
  },
  timestamp: {
    color: '#666',
    marginBottom: 15,
  },
  error: {
    color: 'red',
    marginTop: 5,
  },
  dataSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  nestedDataSection: {
    marginTop: 10,
    paddingTop: 10,
    paddingLeft: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dataLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 5,
    color: '#666'
  }
});

export default FirebaseTest; 