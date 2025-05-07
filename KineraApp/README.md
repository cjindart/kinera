# Kinera App

A React Native mobile app for finding activities and dates with friends and new connections.

## Firebase Setup

The app uses Firebase for authentication, database, and storage. Follow these steps to set up Firebase:

### 1. Firebase Configuration

The app is pre-configured with Firebase credentials in `utils/firebase.js`. If you need to use your own Firebase project:

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Phone Authentication, Firestore Database, and Storage
3. Update the Firebase configuration in `utils/firebase.js`

### 2. Phone Authentication

The app uses phone authentication. For development:
- Add test phone numbers in the Firebase Console (Authentication > Phone > Phone numbers for testing)
- Use verification code "123456" for these test numbers

### 3. Common Firebase Issues and Solutions

#### Authentication Persistence
- Make sure to initialize Firebase Auth with AsyncStorage persistence:
```js
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

#### Firebase Analytics in Expo
- Firebase Analytics is not fully supported in the Expo Go app
- For development and testing, we conditionally skip analytics initialization in Expo environments
- For production builds, analytics will work properly

#### Circular Dependencies
- Avoid circular imports between files (e.g., `User.js` and `firestoreSetup.js`)
- Define shared constants in a separate file or in the file where they're used

#### Expo Firebase Modules
- Install `expo-firebase-core` for proper Expo integration

## Development

### Running the App

```bash
# Install dependencies
npm install

# Start the Expo development server
npm start
```

### Testing

Test the app with the Expo Go app on your phone by scanning the QR code from the terminal.

For development, you can use the simulated authentication mode to bypass real Firebase authentication.

## Production

When ready for production:

1. Upgrade to Firebase Blaze plan if you need full phone authentication
2. Build the app with Expo:
```bash
expo build:android
expo build:ios
```

## Data Models

### User Model

```javascript
{
  id: String,
  name: String,
  phoneNumber: String,
  userType: Enum['dater-swiper', 'dater', 'swiper'],
  profileData: {
    age: Number,
    gender: String,
    height: String,
    year: String,
    interests: Array<String>,
    dateActivities: Array<String>,
    photos: Array<String> // URLs to photos
  },
  sexuality: String,
  friends: Array<{id: String, name: String, avatar: String}>,
  swipingPool: Map<UserId, {approvalRate: Number, matchBack: Boolean}>,
  matches: Array<{userId: String, activityId: String, status: String}>
}
```

### Activity Model

```javascript
{
  id: String,
  name: String,
  description: String,
  location: String,
  availableTimes: Array<DateTime>,
  createdBy: String, // User ID
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## Features

- Phone number authentication
- Profile creation and editing
- Friends management
- Date activities
- Matching

## Tech Stack

- React Native with Expo
- Firebase (Authentication, Firestore, Storage)
- AsyncStorage for local caching
- Expo Image Picker for camera and photo library access

## Sprint 1: Authentication & User Types

In this sprint, we've implemented:

### Authentication

- Phone-based authentication with verification codes
- Persistent login using AsyncStorage
- User registration and login flows
- Authentication state management with React Context

### User Model & Types

- User model with different user types (Match Maker, Dater, or Both)
- Profile data structure with photos, interests, and personal details
- Friend connections and matching system

### User Onboarding

- Multi-step onboarding flow
- Dynamic screens based on user type
- Photo upload functionality
- Profile information collection

### Utility Functions

- Friend management (requests, accepting, rejecting)
- Match suggestions and handling
- Profile data management

## Project Structure

```
KineraApp/
├── auth/                # Authentication components
│   ├── AuthNavigator.js # Navigation for auth flows
│   ├── LoginScreen.js   # Phone login screen
│   └── onboarding/      # Onboarding screens
│       ├── index.js     # Onboarding navigator
│       ├── userType.js  # User type selection screen
│       └── ...          # Other onboarding steps
├── context/
│   └── AuthContext.js   # Authentication context
├── models/
│   └── User.js          # User data model
├── tabs/                # Main app tabs
│   ├── Home.js          # Home screen
│   ├── Profile.js       # User profile
│   └── Availability.js  # Match portal
├── utils/               # Utility functions
│   ├── friendUtils.js   # Friend management
│   └── matchUtils.js    # Match management
├── App.js               # Main app component
└── _layout.js           # Navigation layout
```

## User Flows

### Authentication Flow

1. User enters phone number
2. Verification code is sent (mocked in this version)
3. User enters verification code
4. If existing user, they are logged in
5. If new user, they enter their name and proceed to onboarding

### Onboarding Flow

1. Basic info collection
2. Photo upload
3. User type selection
   - Match Maker: Add friends to set up
   - Dater: Complete dating profile
   - Both: Complete full profile

### Main App Flow

- **Match Makers**: Can suggest matches between friends
- **Daters**: Can view and respond to suggested matches
- **Both**: Can do both activities

## Next Steps

- Implement profile editing
- Build the swiping interface for match suggestions
- Create the match portal for matchmakers
- Add notification system for matches and friend requests

## Technical Notes

- Uses React Native with Expo
- Data storage with AsyncStorage (would be replaced with a backend in production)
- Navigation with React Navigation

## Development

This project is built with Expo, a framework for building React Native applications.

### Running the App

```
cd KineraApp
npm install
npx expo start
``` 