const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env and process.env
function getEnvVars() {
  const envPath = path.resolve(__dirname, '.env');
  let envVars = {};
  
  // First, load from .env file if it exists (local development)
  if (fs.existsSync(envPath)) {
    envVars = dotenv.parse(fs.readFileSync(envPath));
  }
  
  // Then, override with process.env variables (Vercel deployment)
  // This ensures Vercel environment variables take precedence
  return {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || envVars.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || envVars.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || envVars.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || envVars.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || envVars.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || envVars.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || envVars.FIREBASE_MEASUREMENT_ID,
    FIREBASE_RECAPTCHA_KEY: process.env.FIREBASE_RECAPTCHA_KEY || envVars.FIREBASE_RECAPTCHA_KEY,
    FORCE_DEVELOPMENT_MODE: process.env.FORCE_DEVELOPMENT_MODE || envVars.FORCE_DEVELOPMENT_MODE,
    HOST_URI: process.env.HOST_URI || envVars.HOST_URI,
    LOCAL_IP: process.env.LOCAL_IP || envVars.LOCAL_IP
  };
}

const envVars = getEnvVars();

module.exports = {
  expo: {
    name: "Vouch",
    slug: "vouch",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    sdkVersion: "53.0.0",
    scheme: "vouch",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cs278.vouch",
      buildNumber: "1.0.0",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to let you add photos to your profile.",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to let you select profile pictures.",
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ["vouch"]
          }
        ],
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        FirebaseAppDelegateProxyEnabled: true
      },
      associatedDomains: [
        "applinks:vouch-e7830.firebaseapp.com"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.cs278.vouch",
      versionCode: 1,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
        "android.permission.INTERNET",
        "android.permission.RECEIVE_SMS"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "vouch", host: "*" },
            { scheme: "https", host: "*.firebaseapp.com", pathPrefix: "/__/auth/callback" }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them with your friends."
        }
      ],
    ],
    extra: {
      eas: {
        projectId: "636414de-630c-4bf7-a2ff-533c50050805"
      },
      // Firebase config from .env
      firebaseApiKey: envVars.FIREBASE_API_KEY,
      firebaseAuthDomain: envVars.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: envVars.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: envVars.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: envVars.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: envVars.FIREBASE_APP_ID,
      firebaseMeasurementId: envVars.FIREBASE_MEASUREMENT_ID,
      firebaseRecaptchaKey: envVars.FIREBASE_RECAPTCHA_KEY,
      forceDevelopmentMode: envVars.FORCE_DEVELOPMENT_MODE === "true",
      hostUri: envVars.HOST_URI || undefined,
      localIp: envVars.LOCAL_IP || undefined
    }
  }
}; 