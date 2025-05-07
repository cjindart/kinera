import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { app, auth } from './firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';

// Initialize WebBrowser for recaptcha
WebBrowser.maybeCompleteAuthSession();

// App's Firebase configuration
const recaptchaVerifierOptions = {
  title: 'Verify you are human',
  cancelLabel: 'Close',
  webOptions: { 
    size: 'normal',
    theme: 'light',
    invisible: false // Make sure reCAPTCHA is visible
  }
};

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

const PhoneAuth = ({ onAuthSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const recaptchaVerifier = useRef(null);
  
  // Listen for incoming deep links
  useEffect(() => {
    // Set up linking listener for iOS
    const linkingListener = Linking.addEventListener('url', handleDeepLink);
    
    // Clean up
    return () => {
      linkingListener.remove();
    };
  }, []);
  
  // Handle deep link (for iOS reCAPTCHA)
  const handleDeepLink = (event) => {
    const url = event.url;
    console.log('Received deep link:', url);
    setDebugInfo(`Received deep link: ${url}`);
    
    // Handle the URL in Firebase Auth
    if (auth && typeof auth.canHandleURL === 'function') {
      auth.canHandleURL(url);
    }
  };

  // Add logging whenever reCAPTCHA state changes
  useEffect(() => {
    const captchaVerifier = recaptchaVerifier.current;
    if (captchaVerifier) {
      console.log('reCAPTCHA verifier initialized');
    }
  }, [recaptchaVerifier.current]);

  // Format phone number for UI display
  const formatPhone = (input) => {
    // Strip all non-numeric characters
    const cleaned = input.replace(/\D/g, "");
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  // Format phone number for Firebase (E.164 format)
  const formatPhoneForAuth = (input) => {
    const cleaned = input.replace(/\D/g, "");
    
    // Ensure US format with country code
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    } else {
      // Default return with + prefix
      return `+${cleaned}`;
    }
  };

  // Validate US phone number
  const validatePhone = (phoneNumber) => {
    // Remove any non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, "");
    
    // Check if it's a valid 10-digit US number
    return cleaned.length === 10;
  };

  // Check if we should use development mode
  const isDevelopment = () => {
    // For now, always use development mode for easier testing
    return true;
  };

  // Check if test verification should be used
  const shouldUseTestVerification = (phone) => {
    // On Spark plan or in dev mode, we should use test verification
    // Either the test number or a real number added to the Firebase test numbers
    return isDevelopment() || phone === "+11234567890";
  };

  // Send verification code
  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      setDebugInfo('Sending verification code...');
      
      if (!validatePhone(phoneNumber)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
        setLoading(false);
        return;
      }
      
      const formattedPhone = formatPhoneForAuth(phoneNumber);
      console.log(`Sending verification code to ${formattedPhone}`);
      setDebugInfo(`Phone: ${formattedPhone}`);
      
      // Development mode shortcut for the test number
      if (shouldUseTestVerification(formattedPhone)) {
        console.log("Using test verification for:", formattedPhone);
        setVerificationId("dev-verification-id");
        Alert.alert('Test Mode', 'Verification code: 123456\n\nIn production, a real SMS would be sent.');
        setLoading(false);
        return;
      }
      
      // Get the reCAPTCHA verification ID
      const captchaVerifier = recaptchaVerifier.current;
      
      if (!captchaVerifier) {
        const error = 'reCAPTCHA verifier not initialized';
        setDebugInfo(`Error: ${error}`);
        throw new Error(error);
      }
      
      setDebugInfo('Calling verifyPhoneNumber...');
      
      // Request SMS verification from Firebase
      const provider = new PhoneAuthProvider(auth);
      try {
        // Per Firebase docs, use the reCAPTCHA verifier to verify the user
        const verificationId = await provider.verifyPhoneNumber(
          formattedPhone, 
          captchaVerifier
        );
        
        setDebugInfo('verifyPhoneNumber succeeded: ' + verificationId);
        setVerificationId(verificationId);
        Alert.alert('Success', 'Verification code has been sent to your phone.');
      } catch (err) {
        setDebugInfo(`verifyPhoneNumber error: ${err.message}`);
        
        // Handle specific Firebase errors
        if (err.message.includes('auth/invalid-phone-number')) {
          Alert.alert(
            'Invalid Phone Number', 
            'Please enter a valid phone number with country code.'
          );
        } else if (err.message.includes('auth/captcha-check-failed')) {
          Alert.alert(
            'reCAPTCHA Failed', 
            'Please try again and complete the reCAPTCHA verification.'
          );
        } else if (err.message.includes('auth/quota-exceeded')) {
          Alert.alert(
            'Verification Limit Reached', 
            'You have reached the limit for phone verification attempts. Please try again later or use the development test number (123-456-7890).'
          );
        } else if (err.message.includes('auth/missing-phone-number')) {
          Alert.alert(
            'Missing Phone Number', 
            'Please enter a valid phone number.'
          );
        } else if (err.message.includes('auth/app-not-authorized')) {
          Alert.alert(
            'App Not Authorized', 
            'This app is not authorized to use Firebase Authentication. Please check your Firebase project configuration.'
          );
        } else if (err.message.includes('auth/unauthorized-domain')) {
          Alert.alert(
            'Unauthorized Domain', 
            'This domain is not authorized to use Firebase Authentication. Please add this domain to your Firebase project.'
          );
        } else if (err.message.includes('Firebase: Error (auth/')) {
          // For Spark plan users
          Alert.alert(
            'Free Plan Limitation', 
            'The Firebase Spark (free) plan only allows verifying test phone numbers. Please use the development test mode with phone number 123-456-7890 and code 123456.\n\nAlternatively, add your phone number to the test phone numbers list in the Firebase Console.',
            [
              { text: 'Use Test Mode', onPress: () => {
                setPhoneNumber('(123) 456-7890');
                sendVerificationCode(); 
              }},
              { text: 'OK', style: 'cancel' }
            ]
          );
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setDebugInfo(`Error: ${error.message}`);
      Alert.alert('Error', `Failed to send verification code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Verify code and sign in
  const confirmCode = async () => {
    try {
      setLoading(true);
      setDebugInfo('Confirming verification code...');
      
      if (!verificationId) {
        Alert.alert('Error', 'Please request a verification code first.');
        setLoading(false);
        return;
      }
      
      if (!verificationCode || verificationCode.length < 6) {
        Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
        setLoading(false);
        return;
      }
      
      // Development mode shortcut
      if (verificationId === "dev-verification-id" && verificationCode === "123456") {
        console.log("Using test verification code");
        
        // Create a mock user object for development
        const mockUser = { 
          uid: `dev-user-${Date.now()}`, 
          metadata: { 
            creationTime: new Date().toISOString(), 
            lastSignInTime: new Date().toISOString() 
          }
        };
        
        setDebugInfo('Simulating successful verification');
        
        // Simulate success after a short delay to make it feel more realistic
        setTimeout(() => {
          onAuthSuccess({
            user: mockUser,
            isNewUser: true,
            phoneNumber: formatPhoneForAuth(phoneNumber)
          });
          setLoading(false);
        }, 1000);
        
        return;
      }
      
      setDebugInfo('Creating credential with ID: ' + verificationId);
      
      // Create a phone auth credential
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      
      setDebugInfo('Signing in with credential...');
      
      // Sign in user with credential
      const userCredential = await signInWithCredential(auth, credential);
      
      setDebugInfo('Sign in successful');
      
      // User successfully signed in
      if (userCredential.user) {
        // Check if user is new by comparing user creation time with last sign-in time
        const user = userCredential.user;
        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
        
        console.log('User authenticated:', user.uid);
        console.log('Is new user:', isNewUser);
        
        // Pass the result to the parent component
        onAuthSuccess({
          user: user,
          isNewUser: isNewUser,
          phoneNumber: formatPhoneForAuth(phoneNumber)
        });
      }
    } catch (error) {
      console.error('Error confirming verification code:', error);
      setDebugInfo(`Error: ${error.message}`);
      Alert.alert('Error', `Failed to verify code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel authentication
  const handleCancel = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  // Development helper message
  const renderDevHelper = () => {
    return (
      <View style={styles.devHelper}>
        <Text style={styles.devHelperText}>
          Use phone 123-456-7890 and code 123456 for testing
        </Text>
        {debugInfo ? (
          <Text style={styles.debugText}>Status: {debugInfo}</Text>
        ) : null}
      </View>
    );
  };

  // Manual verification trigger for debugging
  const triggerManualVerification = async () => {
    try {
      const captchaVerifier = recaptchaVerifier.current;
      if (!captchaVerifier) {
        setDebugInfo('reCAPTCHA verifier not initialized');
        return;
      }
      
      setDebugInfo('Manually triggering reCAPTCHA...');
      
      // Attempt to manually trigger reCAPTCHA
      await captchaVerifier.verify();
      setDebugInfo('reCAPTCHA manually triggered successfully');
    } catch (error) {
      setDebugInfo(`Manual trigger error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        title={recaptchaVerifierOptions.title}
        cancelLabel={recaptchaVerifierOptions.cancelLabel}
        webOptions={recaptchaVerifierOptions.webOptions}
        attemptInvisibleVerification={false}
      />
      
      {!verificationId ? (
        // Phone Number Input Screen
        <>
          <Text style={styles.title}>Phone Verification</Text>
          <Text style={styles.subtitle}>Enter your phone number to verify your account</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhone(text))}
              keyboardType="phone-pad"
              placeholder="(555) 123-4567"
              placeholderTextColor={COLORS.mutedBlue}
              autoFocus
            />
          </View>
          
          {renderDevHelper()}
          
          <TouchableOpacity 
            style={[styles.button, !validatePhone(phoneNumber) && styles.buttonDisabled]} 
            onPress={sendVerificationCode}
            disabled={!validatePhone(phoneNumber) || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={triggerManualVerification}
          >
            <Text style={styles.debugButtonText}>Manually Trigger reCAPTCHA</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Verification Code Screen
        <>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>A 6-digit code has been sent to {phoneNumber}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor={COLORS.mutedBlue}
              maxLength={6}
              autoFocus
            />
          </View>
          
          {renderDevHelper()}
          
          <TouchableOpacity 
            style={[styles.button, verificationCode.length !== 6 && styles.buttonDisabled]} 
            onPress={confirmCode}
            disabled={verificationCode.length !== 6 || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.resendContainer}>
            <TouchableOpacity 
              style={styles.resendButton} 
              onPress={sendVerificationCode}
              disabled={loading}
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setVerificationId(null)}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Back</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primaryNavy,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mutedBlue,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: COLORS.primaryNavy,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: COLORS.paleBlue,
  },
  button: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mutedBlue,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    color: COLORS.accentOrange,
    fontSize: 16,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: COLORS.mutedBlue,
    fontSize: 16,
  },
  devHelper: {
    marginVertical: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  devHelperText: {
    fontSize: 12,
    color: '#5D4037',
  },
  debugText: {
    fontSize: 11,
    color: '#BF360C',
    marginTop: 4,
  },
  debugButton: {
    backgroundColor: '#ECEFF1',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  debugButtonText: {
    color: '#546E7A',
    fontSize: 12,
  },
});

export default PhoneAuth; 