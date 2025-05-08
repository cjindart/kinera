/**
 * Authentication domain and redirect utilities
 * This module provides utilities for working with Firebase authentication domains
 * and handling redirects for authentication in Expo.
 */

import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Authorized domains for Firebase Authentication
export const AUTHORIZED_DOMAINS = [
  'vouch-e7830.firebaseapp.com',
  'vouch-e7830.web.app',
  'localhost',
  'exp://10.27.145.110:8081'  // Expo domain
];

/**
 * Opens the Firebase authentication in an authorized domain
 * @param {string} operation - The authentication operation (e.g., 'verifyEmail', 'phoneAuth')
 * @param {Object} params - Parameters to pass to the auth page
 * @returns {Promise<Object>} Result of the operation
 */
export const openAuthDomain = async (operation, params = {}) => {
  try {
    // In web, we're already on a domain, so no redirect needed
    if (Platform.OS === 'web') {
      return { success: true, skipped: true, reason: 'Running on web' };
    }
    
    // For native platforms, open a web browser to an authorized domain
    const authDomain = AUTHORIZED_DOMAINS[0]; // Use the first authorized domain
    
    // Build the URL with query parameters
    const queryParams = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = `https://${authDomain}/auth.html?operation=${operation}${queryParams ? '&' + queryParams : ''}`;
    
    console.log(`Opening authentication browser for ${operation} at: ${url}`);
    
    // Open the web browser
    const result = await WebBrowser.openAuthSessionAsync(url, Constants.linkingUri);
    
    if (result.type === 'success') {
      // Extract any data returned in the URL
      const returnedUrl = result.url;
      console.log(`Auth browser returned with URL: ${returnedUrl}`);
      
      // Parse query parameters from the return URL
      const urlObj = new URL(returnedUrl);
      const successParam = urlObj.searchParams.get('success');
      const errorParam = urlObj.searchParams.get('error');
      
      if (successParam === 'true') {
        return { 
          success: true, 
          data: Object.fromEntries(urlObj.searchParams.entries()) 
        };
      } else if (errorParam) {
        return { 
          success: false, 
          error: errorParam 
        };
      }
      
      return { success: true };
    } else {
      console.log(`Auth browser closed with result type: ${result.type}`);
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('Error in openAuthDomain:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set up deep link handling for Firebase authentication
 * @returns {Function} Function to remove event listeners
 */
export const setupDeepLinking = () => {
  // Handle initial URL that opened the app
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log("App opened with URL:", url);
      handleDeepLink(url);
    }
  }).catch(err => console.error('Error getting initial URL', err));
  
  // Add event listener for deep links while the app is running
  const linkingListener = Linking.addEventListener('url', (event) => {
    console.log("Deep link received:", event.url);
    handleDeepLink(event.url);
  });
  
  return () => {
    // Clean up
    linkingListener.remove();
  };
};

/**
 * Handle a deep link URL for authentication
 * @param {string} url - The URL to handle
 */
const handleDeepLink = (url) => {
  if (!url || typeof url !== 'string') return;
  
  try {
    // Parse the URL to extract auth parameters
    const urlObj = new URL(url);
    const params = Object.fromEntries(urlObj.searchParams.entries());
    
    // Check if this is an auth callback
    if (params.auth === 'callback') {
      console.log('Received auth callback with params:', params);
      
      // You can dispatch events or update state here based on the auth result
      if (params.success === 'true') {
        console.log('Authentication was successful');
        // Handle successful auth
      } else if (params.error) {
        console.error('Authentication error:', params.error);
        // Handle auth error
      }
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
};

// Export a utility to create auth.html for hosting
export const getAuthHtmlContent = () => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authentication - Vouch</title>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"></script>
  <style>
    body {
      font-family: 'Helvetica', sans-serif;
      padding: 20px;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 30px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .message {
      margin-top: 20px;
      padding: 10px;
      border-radius: 5px;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <h1>Vouch Authentication</h1>
  <div id="loading">
    <div class="loader"></div>
    <p>Processing authentication request...</p>
  </div>
  <div id="message" class="message" style="display:none;"></div>

  <script>
    // Get params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const operation = urlParams.get('operation');
    const phoneNumber = urlParams.get('phoneNumber');
    const email = urlParams.get('email');
    const redirectUri = urlParams.get('redirectUri');
    
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyAxuR1sWinugIoS5XGwYGqbZb21wX14j9I",
      authDomain: "vouch-e7830.firebaseapp.com",
      projectId: "vouch-e7830",
      storageBucket: "vouch-e7830.firebasestorage.app",
      messagingSenderId: "812279492746",
      appId: "1:812279492746:web:2db7e5ff4747c1ee2c3d73"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Show message
    function showMessage(message, isError = false) {
      const messageEl = document.getElementById('message');
      messageEl.textContent = message;
      messageEl.className = 'message ' + (isError ? 'error' : 'success');
      messageEl.style.display = 'block';
      document.getElementById('loading').style.display = 'none';
    }
    
    // Redirect back to app
    function redirectToApp(success, params = {}) {
      if (!redirectUri) {
        showMessage(success ? 'Authentication successful! You can close this window.' : 'Authentication failed. Please try again.');
        return;
      }
      
      let finalRedirectUri = redirectUri;
      
      // Add params to the redirect URI
      const redirectParams = new URLSearchParams();
      redirectParams.append('auth', 'callback');
      redirectParams.append('success', success ? 'true' : 'false');
      
      for (const [key, value] of Object.entries(params)) {
        redirectParams.append(key, value);
      }
      
      if (redirectUri.includes('?')) {
        finalRedirectUri += '&' + redirectParams.toString();
      } else {
        finalRedirectUri += '?' + redirectParams.toString();
      }
      
      // Redirect
      window.location.href = finalRedirectUri;
    }
    
    // Handle phone authentication
    async function handlePhoneAuth() {
      if (!phoneNumber) {
        showMessage('Phone number is required', true);
        return;
      }
      
      try {
        // Setup recaptcha
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('loading', {
          'size': 'invisible'
        });
        
        // Send verification code
        const confirmationResult = await firebase.auth().signInWithPhoneNumber(
          phoneNumber, 
          window.recaptchaVerifier
        );
        
        // Store the confirmation result
        window.confirmationResult = confirmationResult;
        
        showMessage('Verification code sent to ' + phoneNumber);
        
        // Add code input
        const codeInput = document.createElement('div');
        codeInput.innerHTML = \`
          <p>Enter the 6-digit verification code sent to your phone:</p>
          <input type="text" id="code" maxlength="6" style="padding: 10px; font-size: 16px; width: 200px;">
          <button id="verify" style="padding: 10px; margin-top: 10px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Verify Code</button>
        \`;
        document.body.appendChild(codeInput);
        
        // Setup verify button
        document.getElementById('verify').addEventListener('click', async () => {
          const code = document.getElementById('code').value;
          if (!code || code.length !== 6) {
            showMessage('Please enter a valid 6-digit code', true);
            return;
          }
          
          try {
            const result = await window.confirmationResult.confirm(code);
            showMessage('Phone number verified successfully!');
            redirectToApp(true, { phoneVerified: 'true', uid: result.user.uid });
          } catch (error) {
            showMessage('Invalid verification code. Please try again.', true);
          }
        });
      } catch (error) {
        showMessage('Error: ' + error.message, true);
        redirectToApp(false, { error: error.message });
      }
    }
    
    // Main execution
    document.addEventListener('DOMContentLoaded', () => {
      if (operation === 'phoneAuth') {
        handlePhoneAuth();
      } else {
        showMessage('Unknown operation: ' + operation, true);
        redirectToApp(false, { error: 'Unknown operation' });
      }
    });
  </script>
</body>
</html>`;
}; 