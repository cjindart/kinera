# Firebase Authentication Setup Guide for Kinera App

This guide will walk you through setting up Firebase authentication with phone verification for the Kinera app.

## Prerequisites

- A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
- Expo development environment set up
- Kinera app repository cloned

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enter a project name (e.g., "Kinera App")
4. Configure Google Analytics if desired
5. Click "Create project"

## Step 2: Register Your App with Firebase

1. In the Firebase Console, click on your project
2. Click the web icon (`</>`) to add a web app
3. Register your app with a nickname (e.g., "Kinera Web")
4. Check the "Also set up Firebase Hosting" option if you plan to use it
5. Click "Register app"
6. Copy the Firebase configuration object provided

## Step 3: Update Firebase Configuration in the App

1. Open `KineraApp/utils/firebase.js`
2. Replace the placeholder values in the `firebaseConfig` object with your actual Firebase configuration values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 4: Enable Phone Authentication in Firebase

1. In the Firebase Console, navigate to your project
2. Go to "Authentication" in the left sidebar
3. Click on the "Sign-in method" tab
4. Find "Phone" in the list of sign-in providers and click the pencil icon
5. Toggle the "Enable" switch to on
6. Click "Save"

## Step 5: Set Up Firebase Phone Authentication with reCAPTCHA for Expo

### For Development Testing:

1. Add phone numbers for testing:
   - In the Firebase Console, go to "Authentication" → "Phone" → "Phone numbers for testing"
   - Add your test phone numbers in the format `+1XXXXXXXXXX`
   - Add verification codes for each number (e.g., `123456`)

### For Production:

1. Create a reCAPTCHA verification:
   - Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Register a new site with the following settings:
     - Label: "Kinera App"
     - reCAPTCHA type: reCAPTCHA v2 (Invisible reCAPTCHA badge)
     - Domains: Add your app domains or localhost for testing
   - Click "Submit"
   - Copy the "Site Key" and "Secret Key"

2. Set up reCAPTCHA verification:
   - In your app's `PhoneAuth.js` file, uncomment the following line:
     ```javascript
     attemptInvisibleVerification={true}
     ```

## Step 6: Configure Firestore Security Rules

1. In the Firebase Console, navigate to "Firestore Database"
2. Go to the "Rules" tab
3. Update the rules to allow authenticated users to read/write their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and update their own data
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Add more specific rules for your app's data model here
  }
}
```

4. Click "Publish"

## Step 7: Update Firebase Storage Rules (for profile images)

1. In the Firebase Console, navigate to "Storage"
2. Go to the "Rules" tab
3. Update the rules to allow authenticated users to upload and access images:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload and access their own profile images
    match /profiles/{userId}/{allImages=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click "Publish"

## Step 8: Set Up Expo Environment with Firebase

1. Make sure Expo `expo-firebase-recaptcha` package is installed:
   ```bash
   npm install expo-firebase-recaptcha
   ```

2. Configure your app.json for Firebase:
   ```json
   "expo": {
     ...
     "web": {
       "config": {
         "firebase": {
           "apiKey": "YOUR_API_KEY",
           "authDomain": "YOUR_AUTH_DOMAIN",
           "projectId": "YOUR_PROJECT_ID",
           "storageBucket": "YOUR_STORAGE_BUCKET",
           "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
           "appId": "YOUR_APP_ID",
           "measurementId": "YOUR_MEASUREMENT_ID"
         }
       }
     }
   }
   ```

## Step 9: Testing Phone Authentication

1. Run your Expo app
2. Navigate to the login screen
3. Enter a phone number (use a test number if in development)
4. Complete the reCAPTCHA verification if prompted
5. Enter the verification code (use your test code if in development)

## Troubleshooting

### Common Issues:

1. **ReCAPTCHA verification fails**:
   - Check if your Firebase configuration is correct
   - Ensure you're using a valid domain in the reCAPTCHA settings
   - Try using a different browser or device

2. **Verification code is not sent**:
   - Verify phone number is in proper format (+1XXXXXXXXXX)
   - Check Firebase console for error messages
   - Ensure your Firebase project is on the Blaze plan (pay-as-you-go) for production SMS sending

3. **Firebase authentication fails**:
   - Check Firebase Authentication logs in the console
   - Verify your security rules are correctly set up
   - Ensure your app is using the correct Firebase project configuration

## Additional Resources

- [Firebase Phone Authentication Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Expo Firebase Authentication Guide](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules) 