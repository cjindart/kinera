/**
 * Utility to check if the app is running in development environment
 */

// Check if __DEV__ is available and properly defined
const checkDevEnvironment = () => {
  try {
    // Try accessing __DEV__ globally
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__ === true;
    
    console.log(`__DEV__ exists: ${typeof __DEV__ !== 'undefined'}`);
    console.log(`__DEV__ value: ${typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined'}`);
    
    return {
      exists: typeof __DEV__ !== 'undefined',
      value: isDev,
      // Alternative ways to detect development mode
      nodeEnv: process.env.NODE_ENV === 'development',
      prodEnv: process.env.NODE_ENV !== 'production',
    };
  } catch (error) {
    console.error('Error checking development environment:', error);
    
    return {
      exists: false,
      value: false,
      error: error.message
    };
  }
};

// Fallback check for development mode that doesn't rely on __DEV__
export const isDev = () => {
  // Try different ways to detect development mode
  try {
    // Method 1: Check __DEV__
    if (typeof __DEV__ !== 'undefined') {
      return !!__DEV__;
    }
    
    // Method 2: Check NODE_ENV
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
      return process.env.NODE_ENV === 'development';
    }
    
    // Method 3: Check for development server features in React Native
    if (typeof global !== 'undefined' && global.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      return true;
    }
    
    // Method 4: If building for specific platforms, we might have platform-specific ways
    // to detect development mode
    
    // Default to false if we can't determine
    return false;
  } catch (error) {
    console.error('Error in isDev check:', error);
    return false;
  }
};

export { checkDevEnvironment };

// Run check on module load
console.log('Development environment check:', checkDevEnvironment()); 