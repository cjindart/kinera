return {
  apiKey: expoConstants.firebaseApiKey || process.env.FIREBASE_API_KEY || "",
  authDomain: expoConstants.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: expoConstants.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: expoConstants.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: expoConstants.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: expoConstants.firebaseAppId || process.env.FIREBASE_APP_ID || "",
  measurementId: expoConstants.firebaseMeasurementId || process.env.FIREBASE_MEASUREMENT_ID || ""
}; 

// Get reCAPTCHA key from environment variables or config
const recaptchaKey = Constants.expoConfig?.extra?.firebaseRecaptchaKey || 
                     process.env.FIREBASE_RECAPTCHA_KEY || 
                     '';

// Replace with your reCAPTCHA site key
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(recaptchaKey),
}); 