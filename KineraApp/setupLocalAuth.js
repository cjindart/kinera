/**
 * Local Authentication Setup Script
 * 
 * This script helps configure Firebase to work with local IP addresses
 * in production mode for testing purposes.
 * 
 * Usage:
 * node setupLocalAuth.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Configuration
const LOCAL_IP = '10.27.145.110'; // Your local IP address
const PROJECT_ID = 'vouch-e7830'; // Your Firebase project ID

// Get all network interfaces
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const interfaceData = interfaces[interfaceName];
    for (const data of interfaceData) {
      // Skip internal and non-IPv4 addresses
      if (!data.internal && data.family === 'IPv4') {
        addresses.push(data.address);
      }
    }
  }
  
  return addresses;
}

// Main function
async function setupLocalAuth() {
  console.log('🔥 Firebase Local Authentication Setup 🔥\n');
  
  // Display the configured IP
  console.log(`Configured IP address: ${LOCAL_IP}`);
  
  // Check if the configured IP matches any local network interfaces
  const localIps = getLocalIpAddresses();
  console.log('Detected local IP addresses:', localIps.join(', '));
  
  if (!localIps.includes(LOCAL_IP)) {
    console.warn(`⚠️  Warning: Configured IP (${LOCAL_IP}) doesn't match any of your current network interfaces`);
    console.log('This might cause issues with authentication. Consider updating the IP address in:');
    console.log('- app.json');
    console.log('- utils/firebase.js');
  }
  
  // Create Firebase hosting file for local development
  console.log('\nCreating local Firebase configuration files...');
  
  // Create firebase-local.json
  const firebaseLocalConfig = {
    "hosting": {
      "headers": [
        {
          "source": "**",
          "headers": [
            {
              "key": "Access-Control-Allow-Origin",
              "value": "*"
            }
          ]
        }
      ]
    },
    "emulators": {
      "auth": {
        "port": 9099,
        "host": "0.0.0.0"
      },
      "firestore": {
        "port": 8080,
        "host": "0.0.0.0"
      },
      "storage": {
        "port": 9199,
        "host": "0.0.0.0"
      },
      "ui": {
        "enabled": true,
        "port": 4000
      }
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'firebase-local.json'),
    JSON.stringify(firebaseLocalConfig, null, 2)
  );
  
  console.log('Created firebase-local.json configuration');
  
  // Remind user about updating their Firebase Auth settings
  console.log('\n🔐 Important: Add these domains to Firebase Authentication allowed domains:');
  console.log(`- ${LOCAL_IP}`);
  console.log(`- ${LOCAL_IP}:8081`);
  console.log(`- exp://${LOCAL_IP}:8081`);
  console.log(`- exp://${LOCAL_IP}:19000`);
  console.log(`- exp://${LOCAL_IP}:19001`);
  console.log('\nInstructions:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/' + PROJECT_ID);
  console.log('2. Navigate to Authentication > Settings > Authorized domains');
  console.log('3. Add the domains listed above');
  
  console.log('\n📱 Now you can test authentication with your local IP in production mode!');
  console.log('To start Expo with your IP explicitly:');
  console.log(`expo start --host=${LOCAL_IP}`);
}

// Run the setup
setupLocalAuth().catch(error => {
  console.error('Error setting up local auth:', error);
}); 