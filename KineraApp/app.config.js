const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env
function getEnvVars() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    return dotenv.parse(fs.readFileSync(envPath));
  }
  return {};
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