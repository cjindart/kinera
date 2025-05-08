/**
 * Deploy Auth HTML Script
 * This script creates the auth.html file and pushes it to Firebase hosting
 * 
 * Usage:
 * node deploy-auth.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getAuthHtmlContent } = require('./utils/authRedirect');

// Configuration
const PUBLIC_DIR = path.join(__dirname, 'public');
const AUTH_HTML_PATH = path.join(PUBLIC_DIR, 'auth.html');

// Ensure the public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  console.log('Creating public directory...');
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Generate the auth.html content
console.log('Generating auth.html content...');
const authHtmlContent = getAuthHtmlContent();

// Write the auth.html file
console.log(`Writing auth.html file to ${AUTH_HTML_PATH}...`);
fs.writeFileSync(AUTH_HTML_PATH, authHtmlContent, 'utf8');
console.log('File written successfully!');

// Deploy to Firebase Hosting
try {
  console.log('\nDeploying to Firebase Hosting...');
  console.log('This will deploy only the auth.html file without affecting other files.');
  
  // Run Firebase deploy command with target files
  const deployCommand = 'firebase deploy --only hosting:vouch-e7830 --public public';
  console.log(`Running: ${deployCommand}`);
  
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('\n✅ Deployment successful!');
  console.log('You can now access auth.html at: https://vouch-e7830.firebaseapp.com/auth.html');
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\nYou may need to install and configure the Firebase CLI:');
  console.log('  npm install -g firebase-tools');
  console.log('  firebase login');
  console.log('  firebase init hosting');
}

console.log('\n📝 To test authentication from Expo, try re-running your app with:');
console.log('  yarn start');
console.log('The app should now use the authorized domain for authentication in production mode.'); 