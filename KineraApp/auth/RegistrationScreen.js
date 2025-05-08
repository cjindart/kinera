import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES } from '../models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Color scheme
const COLORS = {
  primaryNavy: "#325475",
  mutedBlue: "#A9B7C5",
  skyBlue: "#C2D7E5",
  paleBlue: "#E6EEF4",
  offWhite: "#FAEFE4",
  accentOrange: "#ED7E31",
  lightPeach: "#F6D3B7",
  buttonPeach: "#F7D0B5",
  buttonShadow: "#E98E42",
};

export default function RegistrationScreen({ navigation, route }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [userType, setUserType] = useState(USER_TYPES.DATER_SWIPER);
  const [loading, setLoading] = useState(false);

  // Handle registration with entered data
  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Invalid Name", "Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      // Check if we received forceOnboarding from parameters
      const forceOnboarding = route?.params?.forceOnboarding || false;
      console.log("Registration with forceOnboarding:", forceOnboarding);
      
      // Register the new user
      const success = await register({
        name,
        userType,
        isNewUser: true  // Explicitly set isNewUser flag to true
      });
      
      if (success) {
        // Store isNewUser in AsyncStorage to persist across app restarts
        await AsyncStorage.setItem('isNewUser', 'true');
        
        console.log("Registration successful, navigating to onboarding flow");
        
        // Use reset instead of navigate to clear the stack and force onboarding
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Onboarding",
              params: { 
                screen: "basicInfo",
                forceOnboarding: true,  // Always force onboarding
                comingFrom: 'Registration'  // Add this to help identify the source
              }
            }
          ]
        });
      } else {
        Alert.alert("Registration Failed", "There was a problem creating your account. Please try again.");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      Alert.alert("Error", "There was a problem creating your account.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle user type selection
  const toggleUserType = (type) => {
    setUserType(type);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primaryNavy} />
            </TouchableOpacity>

            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.mutedBlue}
                autoCapitalize="words"
                keyboardType="default"
                autoFocus
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Role</Text>
              <Text style={styles.infoText}>Choose how you want to use Vouch.</Text>
              
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    userType === USER_TYPES.DATER_SWIPER && styles.selectedRole
                  ]}
                  onPress={() => toggleUserType(USER_TYPES.DATER_SWIPER)}
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={userType === USER_TYPES.DATER_SWIPER ? "white" : COLORS.primaryNavy}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      userType === USER_TYPES.DATER_SWIPER && styles.selectedRoleText
                    ]}
                  >
                    Date & Match
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    userType === USER_TYPES.DATER && styles.selectedRole
                  ]}
                  onPress={() => toggleUserType(USER_TYPES.DATER)}
                >
                  <Ionicons
                    name="heart"
                    size={24}
                    color={userType === USER_TYPES.DATER ? "white" : COLORS.primaryNavy}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      userType === USER_TYPES.DATER && styles.selectedRoleText
                    ]}
                  >
                    Date Only
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    userType === USER_TYPES.SWIPER && styles.selectedRole
                  ]}
                  onPress={() => toggleUserType(USER_TYPES.SWIPER)}
                >
                  <Ionicons
                    name="hand-left"
                    size={24}
                    color={userType === USER_TYPES.SWIPER ? "white" : COLORS.primaryNavy}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      userType === USER_TYPES.SWIPER && styles.selectedRoleText
                    ]}
                  >
                    Match Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, !name.trim() && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primaryNavy,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mutedBlue,
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primaryNavy,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: COLORS.paleBlue,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.mutedBlue,
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  roleOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.paleBlue,
  },
  selectedRole: {
    backgroundColor: COLORS.accentOrange,
    borderColor: COLORS.accentOrange,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primaryNavy,
    marginTop: 6,
    textAlign: "center",
  },
  selectedRoleText: {
    color: "white",
  },
  button: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mutedBlue,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
}); 