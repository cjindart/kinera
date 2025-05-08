import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db, isDevelopmentMode } from "../utils/firebase";
import { initializeFirestore } from "../utils/firestoreSetup";

/**
 * User Types Enum
 */
export const USER_TYPES = {
  DATER_SWIPER: "Dater & Match Maker",
  DATER: "Dater",
  SWIPER: "Match Maker",
};
// const USER_TYPES = [
//   {
//     label: "Match Maker",
//     value: "match_maker",
//   },
//   {
//     label: "Dater",
//     value: "dater",
//   },
//   {
//     label: "Dater & Match Maker",
//     value: "both",
//   },
// ];

/**
 * Gender Options Enum
 */
export const GENDER_OPTIONS = {
  MALE: "male",
  FEMALE: "female",
  NON_BINARY: "non_binary",
  OTHER: "other",
};

/**
 * Sexuality Options Enum
 */
export const SEXUALITY_OPTIONS = {
  STRAIGHT: "straight",
  GAY: "gay",
  LESBIAN: "lesbian",
  BISEXUAL: "bisexual",
  PANSEXUAL: "pansexual",
  ASEXUAL: "asexual",
  OTHER: "other",
};

/**
 * Match Status Enum
 */
export const MATCH_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed",
};

/**
 * User model class to handle user data and operations
 */
class User {
  /**
   * Create a new user instance
   * @param {Object} userData - User data object
   */
  constructor(userData = {}) {
    // Basic info
    this.id = userData.id || userData.userId || null;
    this.name = userData.name || null;
    this.phoneNumber = userData.phoneNumber || userData.phone || null;
    this.userType = userData.userType || null;
    this.isAuthenticated = userData.isAuthenticated || false;
    this.updatedAt = userData.updatedAt || new Date().toISOString();
    this.createdAt = userData.createdAt || new Date().toISOString();

    // Profile data - combined from both direct properties and profileData object
    this.profileData = {
      age: userData.profileData?.age || userData.age || null,
      gender: userData.profileData?.gender || userData.gender || null,
      height: userData.profileData?.height || userData.height || null,
      year: userData.profileData?.year || userData.classYear || null,
      interests: userData.profileData?.interests || userData.interests || [],
      dateActivities:
        userData.profileData?.dateActivities || userData.activities || [],
      photos: userData.profileData?.photos || userData.photos || [],
      updatedAt: userData.profileData?.updatedAt || new Date().toISOString(),
    };

    // Handle lookingFor/sexuality field which might be named differently
    this.sexuality = userData.sexuality || userData.lookingFor || null;

    // Social connections - friends might be just names or objects
    this.friends = userData.friends || [];
    // Convert any string friends to objects if needed
    if (this.friends.length > 0 && typeof this.friends[0] === "string") {
      this.friends = this.friends.map((friend, index) => ({
        id: `friend_${index}`,
        name: friend,
        avatar: null,
      }));
    }

    // Dating data
    this.swipingPool = userData.swipingPool || {};
    this.matches = userData.matches || [];
  }

  /**
   * Save user data to AsyncStorage and Firestore
   */
  async save() {
    try {
      // First save to AsyncStorage for local persistence (this must always work)
      try {
        await AsyncStorage.setItem("user", JSON.stringify(this));
        console.log("User data saved to AsyncStorage");
      } catch (localError) {
        console.error("Error saving to AsyncStorage:", localError);
        // Don't return here, still try Firestore if needed
      }

      // Save to Firestore if user has an ID and not in development mode
      if (this.id && !isDevelopmentMode()) {
        try {
          console.log("Attempting to save user data to Firestore...");
          console.log("User ID:", this.id);
          console.log("User data contains name:", !!this.name);

          const userRef = doc(db, "users", this.id);

          // Simplify the data for troubleshooting
          const simplifiedData = {
            id: this.id,
            name: this.name || "Unknown",
            updatedAt: new Date().toISOString(),
          };

          await setDoc(userRef, simplifiedData, { merge: true });
          console.log("Basic user data saved to Firestore successfully");

          // Now try to save the full user data
          try {
            await setDoc(userRef, this.toFirestore(), { merge: true });
            console.log("Complete user data saved to Firestore");
          } catch (fullDataError) {
            console.error(
              "Error saving full data to Firestore:",
              fullDataError
            );
            // Already saved basic data, so consider this a partial success
          }
        } catch (firebaseError) {
          console.error("Error saving to Firestore:", firebaseError);
          console.log("Firebase error details:", {
            code: firebaseError.code,
            message: firebaseError.message,
            stack: firebaseError.stack,
          });
          console.log("Continuing with local storage only");
        }
      } else if (isDevelopmentMode()) {
        console.log(
          "Development mode: Skipping Firestore save, using local storage only"
        );
      } else if (!this.id) {
        console.warn("Cannot save to Firestore: User ID is missing");
      }

      // If we got here, consider the operation successful because at least AsyncStorage should have worked
      return true;
    } catch (error) {
      console.error("Unexpected error in save method:", error);
      return false;
    }
  }

  /**
   * Convert user object to Firestore format
   * @returns {Object} Firestore-formatted user data
   */
  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      phoneNumber: this.phoneNumber,
      userType: this.userType,
      profileData: this.profileData,
      sexuality: this.sexuality,
      friends: this.friends,
      swipingPool: this.swipingPool,
      matches: this.matches,
      updatedAt: new Date().toISOString(),
      createdAt: this.createdAt,
    };
  }

  /**
   * Initialize user data in Firestore
   * This should be called when a new user is created
   */
  async initialize() {
    if (!isDevelopmentMode() && this.id) {
      try {
        // Initialize user data in Firestore
        await initializeFirestore(this.id, this);
        console.log("User data initialized in Firestore");
        return true;
      } catch (error) {
        console.error("Error initializing user in Firestore:", error);
        return false;
      }
    }
    return true; // In development mode, just return success
  }

  /**
   * Load user data from AsyncStorage
   * @returns {User} User instance or null if not found
   */
  static async load() {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        return new User(JSON.parse(userData));
      }
      return null;
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  }

  /**
   * Fetch user data from Firestore by ID
   * @param {string} userId - User ID
   * @returns {User} User instance or null if not found
   */
  static async fetchById(userId) {
    try {
      // Skip Firestore in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore fetchById");
        return null;
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return new User(userData);
      }

      return null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  /**
   * Fetch user data from Firestore by phone number
   * @param {string} phoneNumber - User phone number
   * @returns {User} User instance or null if not found
   */
  static async fetchByPhone(phoneNumber) {
    try {
      // Skip Firestore in development mode
      if (isDevelopmentMode()) {
        console.log("Development mode: Skipping Firestore fetchByPhone");
        return null;
      }

      // In a production app, you would use a query to find the user
      console.warn(
        "fetchByPhone: This would query Firestore for a user with this phone number"
      );
      return null;
    } catch (error) {
      console.error("Error fetching user by phone:", error);
      return null;
    }
  }

  /**
   * Check if the user is authenticated
   * @returns {boolean} Authentication status
   */
  isLoggedIn() {
    return this.isAuthenticated === true;
  }

  /**
   * Check if user is a matchmaker
   * @returns {boolean} True if user is a matchmaker
   */
  isMatchMaker() {
    return (
      this.userType === USER_TYPES.SWIPER ||
      this.userType === USER_TYPES.DATER_SWIPER
    );
  }

  /**
   * Check if user is a dater
   * @returns {boolean} True if user is a dater
   */
  isDater() {
    return (
      this.userType === USER_TYPES.DATER ||
      this.userType === USER_TYPES.DATER_SWIPER
    );
  }

  /**
   * Add a friend to user's friend list
   * @param {Object} friend - Friend user object
   */
  addFriend(friend) {
    if (!this.friends.some((f) => f.id === friend.id)) {
      this.friends.push({
        id: friend.id,
        name: friend.name,
        avatar:
          friend.profileData?.photos && friend.profileData.photos.length > 0
            ? friend.profileData.photos[0]
            : null,
      });
    }
  }

  /**
   * Remove a friend from user's friend list
   * @param {string} friendId - Friend's user ID
   */
  removeFriend(friendId) {
    this.friends = this.friends.filter((friend) => friend.id !== friendId);
  }

  /**
   * Update user profile data
   * @param {Object} profileData - Updated profile data
   */
  updateProfile(profileData) {
    // Update timestamps
    this.updatedAt = new Date().toISOString();

    // Update basic profile fields
    if (profileData.name) this.name = profileData.name;
    if (profileData.userType) this.userType = profileData.userType;
    if (profileData.sexuality) this.sexuality = profileData.sexuality;

    // Update nested profile data
    if (profileData.profileData) {
      // If a complete profileData object is provided
      this.profileData = {
        ...this.profileData,
        ...profileData.profileData,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Update individual fields
      if (profileData.age) this.profileData.age = profileData.age;
      if (profileData.gender) this.profileData.gender = profileData.gender;
      if (profileData.height) this.profileData.height = profileData.height;
      if (profileData.year) this.profileData.year = profileData.year;
      if (profileData.interests)
        this.profileData.interests = profileData.interests;
      if (profileData.dateActivities)
        this.profileData.dateActivities = profileData.dateActivities;
      if (profileData.photos) this.profileData.photos = profileData.photos;

      // Always update timestamp
      this.profileData.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Clear all user data (logout)
   */
  static async logout() {
    try {
      await AsyncStorage.removeItem("user");
      return true;
    } catch (error) {
      console.error("Error logging out user:", error);
      return false;
    }
  }
}

export default User;
