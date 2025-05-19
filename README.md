# Kinera

## Setup Instructions

### Firebase Configuration

This app uses Firebase for authentication, database, and storage. For security reasons, Firebase API keys and configuration values are not committed to the repository. Follow these steps to set up your environment:

1. Copy the `.env.example` file in the KineraApp directory to a new file named `.env`
2. Fill in your Firebase project details in the `.env` file:
   ```
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   FIREBASE_RECAPTCHA_KEY=your_recaptcha_key
   
   # Development Settings
   FORCE_DEVELOPMENT_MODE=true
   ```
3. Install dependencies:
   ```
   cd KineraApp
   npm install
   ```

4. Start the Expo app:
   ```
   npm start
   ```

### Development Mode

You can toggle between development and production modes by changing the `FORCE_DEVELOPMENT_MODE` value in your `.env` file:
- Set to `true` for development (simulated Firebase services)
- Set to `false` for production (real Firebase services)

This setting can be found in the `.env` file and gets loaded through the app.config.js into your app.

### Getting Firebase Configuration

To get your own Firebase configuration:
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Add a web app to your project
4. Copy the configuration values from the Firebase SDK snippet