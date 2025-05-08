import { isDevelopmentMode } from '../utils/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import User from '../models/User';

/**
 * Simple test function to check if authentication and user creation works in development mode
 */
export const testAuthInDevMode = async () => {
  console.log("===== Testing Authentication in Development Mode =====");
  
  // Check development mode status
  const devMode = isDevelopmentMode();
  console.log(`Development mode status: ${devMode ? 'ENABLED' : 'DISABLED'}`);
  
  if (!devMode) {
    console.warn("⚠️ NOT in development mode. This test should only be run in dev mode.");
    return { success: false, error: "Not in development mode" };
  }
  
  // Try to create a test user
  try {
    console.log("Creating test user...");
    
    // Create a test user with a dev ID
    const testUser = new User({
      id: `dev_test_${Date.now()}`,
      name: "Test User",
      phoneNumber: "+1234567890",
      userType: "dater-swiper",
      isAuthenticated: true,
      profileData: {
        age: 25,
        gender: "male",
        interests: ["coding", "testing"],
      },
      stanfordEmail: "test@stanford.edu",
      isStanfordVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Save the test user
    console.log("Saving test user to AsyncStorage...");
    const saveResult = await testUser.save();
    
    if (saveResult) {
      console.log("✅ Test user created and saved successfully!");
      
      // Verify by reading from AsyncStorage
      const storedUserJson = await AsyncStorage.getItem("user");
      const storedUser = JSON.parse(storedUserJson);
      
      if (storedUser && storedUser.id === testUser.id) {
        console.log("✅ Test user verified in AsyncStorage");
        return { 
          success: true, 
          message: "Test user created and verified", 
          user: testUser 
        };
      } else {
        console.error("❌ Failed to verify test user in AsyncStorage");
        return { success: false, error: "Verification failed" };
      }
    } else {
      console.error("❌ Failed to save test user");
      return { success: false, error: "Save failed" };
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return { success: false, error: error.message };
  }
};

// To run this test, call testAuthInDevMode() somewhere in your app's test code
// or from a debug menu 