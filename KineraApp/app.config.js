const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables based on the environment
function getEnvVars() {
  // Read the appropriate .env file
  const basePath = path.resolve(__dirname);
  const envPath = path.resolve(basePath, '.env');
  
  // If .env file exists, parse it and return the variables
  if (fs.existsSync(envPath)) {
    return dotenv.parse(fs.readFileSync(envPath));
  }
  
  // Default values if no .env file exists
  return {
    FIREBASE_API_KEY: "",
    FIREBASE_AUTH_DOMAIN: "",
    FIREBASE_PROJECT_ID: "",
    FIREBASE_STORAGE_BUCKET: "",
    FIREBASE_MESSAGING_SENDER_ID: "",
    FIREBASE_APP_ID: "",
    FIREBASE_MEASUREMENT_ID: "",
    FIREBASE_RECAPTCHA_KEY: "",
    FORCE_DEVELOPMENT_MODE: "true"
  };
}

// Get the environment variables
const envVars = getEnvVars();

// Export the Expo configuration
module.exports = {
  name: "Kinera",
  slug: "kinera",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.kinera.app",
    buildNumber: "1.0.0"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    },
    package: "com.kinera.app",
    versionCode: 1
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  // Pass environment variables to the app
  extra: {
    // Firebase config
    firebaseApiKey: envVars.FIREBASE_API_KEY,
    firebaseAuthDomain: envVars.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: envVars.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: envVars.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: envVars.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: envVars.FIREBASE_APP_ID,
    firebaseMeasurementId: envVars.FIREBASE_MEASUREMENT_ID,
    firebaseRecaptchaKey: envVars.FIREBASE_RECAPTCHA_KEY,
    
    // Development mode
    forceDevelopmentMode: envVars.FORCE_DEVELOPMENT_MODE === "true"
  }
}; 