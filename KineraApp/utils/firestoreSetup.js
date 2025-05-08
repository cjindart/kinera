import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, getDoc } from 'firebase/firestore';

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

/**
 * Migrate user data from one ID to another
 * This is used when a user has a local ID but gets authenticated with Firebase Auth
 * @param {string} oldId - The old local ID
 * @param {string} newId - The new Firebase Auth UID
 * @returns {Promise<boolean>} Success status
 */
export const migrateUserData = async (oldId, newId) => {
  try {
    console.log(`Migrating user data from ${oldId} to ${newId}`);
    
    // Get the old user data
    const oldUserRef = doc(db, 'users', oldId);
    const oldUserDoc = await getDoc(oldUserRef);
    
    if (!oldUserDoc.exists()) {
      console.log(`No user document found with ID ${oldId}`);
      return false;
    }
    
    const userData = oldUserDoc.data();
    
    // Create new document with the same data but new ID
    const newUserRef = doc(db, 'users', newId);
    
    // Update the data with the new ID and metadata
    const updatedData = {
      ...userData,
      id: newId,
      previousId: oldId,
      updatedAt: new Date().toISOString(),
      migratedAt: new Date().toISOString()
    };
    
    // Save to the new location
    await setDoc(newUserRef, updatedData);
    
    // Mark the old document as migrated
    await setDoc(oldUserRef, {
      migratedTo: newId,
      active: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`Successfully migrated user data from ${oldId} to ${newId}`);
    return true;
  } catch (error) {
    console.error('Error migrating user data:', error);
    return false;
  }
};

/**
 * Merge all duplicate users with the same phone number into a single user
 * @param {string} phoneNumber - The phone number to check for duplicates
 * @param {string} primaryUserId - The user ID to keep (usually the Firebase Auth UID)
 * @returns {Promise<Object>} Result of the merge operation
 */
export const mergeDuplicateUsers = async (phoneNumber, primaryUserId) => {
  const result = {
    success: false,
    mergedCount: 0,
    errors: [],
    mergedUserData: null
  };
  
  try {
    // Find all users with this phone number
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No users found with phone number ${phoneNumber}`);
      return result;
    }
    
    // Get all users with this phone number
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (users.length <= 1) {
      console.log('No duplicate users found to merge');
      result.success = true;
      return result;
    }
    
    console.log(`Found ${users.length} users with phone number ${phoneNumber}`);
    
    // Find the primary user (the one with Firebase Auth UID)
    let primaryUser = users.find(user => user.id === primaryUserId);
    
    // If primary user not found, use the newest user
    if (!primaryUser) {
      primaryUser = users.sort((a, b) => {
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      })[0];
    }
    
    console.log(`Using ${primaryUser.id} as primary user`);
    
    // Merge data from all users
    const mergedData = {
      ...primaryUser,
      id: primaryUserId,
      previousIds: users.filter(u => u.id !== primaryUserId).map(u => u.id),
      updatedAt: new Date().toISOString(),
      mergedAt: new Date().toISOString()
    };
    
    // Loop through other users and merge their data
    for (const user of users.filter(u => u.id !== primaryUser.id)) {
      // Merge profile data if primary user has none
      if (!primaryUser.profileData?.age && user.profileData?.age) {
        mergedData.profileData = {
          ...mergedData.profileData,
          ...user.profileData
        };
      }
      
      // Merge friends if not already in the list
      if (user.friends && user.friends.length > 0) {
        const existingFriendIds = (mergedData.friends || []).map(f => f.id);
        const newFriends = user.friends.filter(f => !existingFriendIds.includes(f.id));
        mergedData.friends = [...(mergedData.friends || []), ...newFriends];
      }
      
      // Mark old document as merged
      const oldUserRef = doc(db, 'users', user.id);
      await setDoc(oldUserRef, {
        active: false,
        mergedTo: primaryUserId,
        mergedAt: new Date().toISOString()
      }, { merge: true });
      
      result.mergedCount++;
    }
    
    // Save merged data to primary user
    const primaryUserRef = doc(db, 'users', primaryUserId);
    await setDoc(primaryUserRef, mergedData, { merge: true });
    
    result.success = true;
    result.mergedUserData = mergedData;
    
    return result;
  } catch (error) {
    console.error('Error merging duplicate users:', error);
    result.errors.push(error.message);
    return result;
  }
};

// Export USER_TYPES to maintain compatibility with any code that imports it from here
export { USER_TYPES }; 