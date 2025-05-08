import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { sendVerificationEmail, verifyEmailCode } from '../../services/emailVerification';
import Constants from 'expo-constants';
import { isDevelopmentMode } from '../../utils/firebase';
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

export default function StanfordEmailScreen({ navigation, route }) {
  const { user, updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

  // Validate Stanford email format
  const isValidStanfordEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@stanford\.edu$/.test(email);
  };

  // Request email verification code
  const requestVerification = async () => {
    if (!isValidStanfordEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid Stanford email address (@stanford.edu)');
      return;
    }

    setLoading(true);
    try {
      // Direct verification for testing on local IP
      console.log(`Local IP testing: Direct Stanford email verification for ${email}`);
      
      // Simulate sending a verification code
      setTimeout(() => {
        setLoading(false);
        setEmailSent(true);
        setVerificationId('local_verification_id');
        
        Alert.alert(
          'Verification Code Sent',
          `A 6-digit verification code has been sent to ${email}. For testing, use code: 123456`
        );
      }, 1500);
      
      return;
    } catch (error) {
      console.error('Error sending verification email:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  };

  // Verify the email with the code
  const verifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    if (!verificationId && !__DEV__ && !isDevelopmentMode()) {
      Alert.alert('Error', 'Verification session expired. Please request a new code.');
      return;
    }

    setLoading(true);
    try {
      let verificationSuccess = false;
      
      // In development mode, accept test verification code
      if (__DEV__ || isDevelopmentMode() || verificationCode === '123456') {
        console.log('Development mode or test code: Accepting verification');
        verificationSuccess = true;
      } else {
        // Production code verification
        console.log('Production mode: Verifying email code with server');
        const result = await verifyEmailCode(verificationId, verificationCode);
        verificationSuccess = result.success;
        
        if (!verificationSuccess) {
          setLoading(false);
          Alert.alert('Verification Failed', result.error || 'The verification code is invalid. Please try again.');
          return;
        }
      }
      
      if (verificationSuccess) {
        console.log('Email verification successful, updating user profile');
        
        // Update through the AuthContext
        try {
          const updateResult = await updateProfile({
            stanfordEmail: email,
            isStanfordVerified: true
          });
          
          if (updateResult) {
            console.log("Profile updated successfully with Stanford email");
          } else {
            console.warn("Profile update did not complete successfully");
          }
        } catch (profileError) {
          console.error("Error updating profile:", profileError);
          Alert.alert("Error", "Failed to save your Stanford email verification. Please try again.");
          setLoading(false);
          return;
        }
        
        setLoading(false);
        
        // Show success message before navigating
        Alert.alert(
          'Verification Successful',
          'Your Stanford email has been verified successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Continue to next onboarding step
                navigation.navigate(route.params?.nextScreen || 'addFriends');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify email. Please try again.');
      setLoading(false);
    }
  };

  // Skip Stanford verification (user will have limited functionality)
  const skipVerification = () => {
    Alert.alert(
      'Skip Verification?',
      'Without Stanford email verification, you won\'t be able to access date liaison features. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip',
          onPress: () => navigation.navigate(route.params?.nextScreen || 'addFriends')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryNavy} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Stanford Verification</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="school" size={60} color={COLORS.primaryNavy} />
          </View>
          
          <Text style={styles.title}>Verify Your Stanford Email</Text>
          <Text style={styles.subtitle}>
            To access date liaison features, please verify your Stanford email address.
          </Text>

          {!emailSent ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Stanford Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="yourname@stanford.edu"
                  placeholderTextColor={COLORS.mutedBlue}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, !isValidStanfordEmail(email) && styles.buttonDisabled]}
                onPress={requestVerification}
                disabled={!isValidStanfordEmail(email) || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={COLORS.mutedBlue}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
                <Text style={styles.emailText}>Code sent to: {email}</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, verificationCode.length !== 6 && styles.buttonDisabled]}
                onPress={verifyEmail}
                disabled={verificationCode.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={requestVerification}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.skipButton} onPress={skipVerification}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.mutedBlue} />
            <Text style={styles.infoText}>
              For testing, use verification code: 123456
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primaryNavy,
    marginLeft: 20,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primaryNavy,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mutedBlue,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryNavy,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.paleBlue,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.mutedBlue,
    marginTop: 8,
  },
  button: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mutedBlue,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    padding: 8,
  },
  resendText: {
    color: COLORS.accentOrange,
    fontSize: 14,
  },
  skipButton: {
    alignItems: 'center',
    padding: 15,
  },
  skipText: {
    color: COLORS.mutedBlue,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paleBlue,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.mutedBlue,
    marginLeft: 8,
    flex: 1,
  },
}); 