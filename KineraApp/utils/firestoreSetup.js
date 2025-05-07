import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

// Define user types here instead of importing from User.js to avoid circular dependency
const USER_TYPES = {
  DATER_SWIPER: "dater-swiper",
  DATER: "dater",
  SWIPER: "swiper"
};

/**
 * Initialize or update essential Firestore collections
 * @param {string} userId - Current user's ID
 * @param {Object} userData - User data to save
 */
export const initializeFirestore = async (userId, userData = null) => {
  try {
    // Check if users collection exists and create if needed
    if (userData) {
      const userRef = doc(db, 'users', userId);
      
      // Prepare user data for Firestore
      const firestoreUserData = {
        id: userId,
        name: userData.name || 'New User',
        phoneNumber: userData.phoneNumber || null,
        userType: userData.userType || USER_TYPES.DATER_SWIPER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileData: userData.profileData || {
          age: null,
          gender: null,
          height: null,
          year: null,
          interests: [],
          dateActivities: [],
          photos: []
        },
        friends: userData.friends || [],
        matches: userData.matches || []
      };
      
      // Save user data to Firestore
      await setDoc(userRef, firestoreUserData, { merge: true });
      console.log('User data initialized in Firestore');
      
      return firestoreUserData;
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
  }
};

/**
 * Check if a user exists in Firestore
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<Object|null>} User data if found, null otherwise
 */
export const findUserByPhone = async (phoneNumber) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User found
      const userData = querySnapshot.docs[0].data();
      return {
        ...userData,
        id: querySnapshot.docs[0].id
      };
    }
    
    // User not found
    return null;
  } catch (error) {
    console.error('Error finding user by phone:', error);
    throw error;
  }
};

/**
 * Save a new activity to Firestore
 * @param {Object} activityData - Activity data
 * @returns {Promise<string>} Activity ID
 */
export const saveActivity = async (activityData) => {
  try {
    // Create a new activity document with auto-generated ID
    const activitiesRef = collection(db, 'activities');
    const activityRef = doc(activitiesRef);
    const activityId = activityRef.id;
    
    // Prepare activity data
    const firestoreActivityData = {
      id: activityId,
      name: activityData.name,
      description: activityData.description || '',
      location: activityData.location || '',
      availableTimes: activityData.availableTimes || [],
      creatorId: activityData.creatorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save activity data to Firestore
    await setDoc(activityRef, firestoreActivityData);
    console.log('Activity saved to Firestore:', activityId);
    
    return activityId;
  } catch (error) {
    console.error('Error saving activity:', error);
    throw error;
  }
};

// Export USER_TYPES to maintain compatibility with any code that imports it from here
export { USER_TYPES }; 