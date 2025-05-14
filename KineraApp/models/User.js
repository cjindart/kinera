import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db, isDevelopmentMode, logFirebaseOperation } from "../utils/firebase";
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
    // Log what data we're starting with
    console.log(
      `Constructing User instance from data: ${JSON.stringify({
        hasId: !!userData.id || !!userData.userId,
        hasName: !!userData.name,
        hasPhoneNumber: !!userData.phoneNumber || !!userData.phone,
        hasProfileData: !!userData.profileData,
        profileDataKeys: userData.profileData
          ? Object.keys(userData.profileData)
          : [],
      })}`
    );

    // Basic info
    this.id = userData.id || userData.userId || null;
    this.name = userData.name || null;
    this.phoneNumber = userData.phoneNumber || userData.phone || null;
    this.userType = userData.userType || null;
    this.isAuthenticated = userData.isAuthenticated || false;
    this.updatedAt = userData.updatedAt || new Date().toISOString();
    this.createdAt = userData.createdAt || new Date().toISOString();

    // Stanford email verification
    this.stanfordEmail = userData.stanfordEmail || null;
    this.isStanfordVerified = userData.isStanfordVerified || false;

    // Profile data - standardize all profile-related fields into profileData object
    this.profileData = {
      ...userData.profileData,
      age: userData.profileData?.age || userData.age || null,
      gender: userData.profileData?.gender || userData.gender || null,
      height: userData.profileData?.height || userData.height || null,
      year: userData.profileData?.year || userData.classYear || null,
      interests: userData.profileData?.interests || userData.interests || [],
      dateActivities:
        userData.profileData?.dateActivities || userData.activities || [],
      photos: userData.profileData?.photos || userData.photos || [],
      sexuality:
        userData.profileData?.sexuality ||
        userData.sexuality ||
        userData.lookingFor ||
        null,
      city: userData.profileData?.city || userData.city || null,
      updatedAt: userData.profileData?.updatedAt || new Date().toISOString(),
    };

    // Handle lookingFor/sexuality field which might be named differently
    this.sexuality = userData.sexuality || userData.lookingFor || null;
    if (userData.profileData?.sexuality) {
      this.sexuality = userData.profileData.sexuality;
    }

    // Social connections - friends might be just names or objects
    this.friends = userData.friends || [];
    // Convert any string friends to objects if needed and ensure all friends are properly serialized
    if (this.friends.length > 0) {
      this.friends = this.friends.map((friend, index) => {
        // If it's a string, convert to basic object
        if (typeof friend === "string") {
          return {
            id: `friend_${Date.now()}_${index}_${Math.floor(
              Math.random() * 10000
            )}`,
            name: friend,
            avatar: null,
          };
        }
        // If it's already an object, ensure it has the right format
        if (typeof friend === "object" && friend !== null) {
          return {
            id:
              friend.id ||
              `friend_${Date.now()}_${index}_${Math.floor(
                Math.random() * 10000
              )}`,
            name: typeof friend.name === "string" ? friend.name : "Unknown",
            avatar: friend.avatar || null,
            interests: Array.isArray(friend.interests) ? friend.interests : [],
            dateActivities: Array.isArray(friend.dateActivities)
              ? friend.dateActivities
              : [],
          };
        }
        // Fallback for any other type
        return {
          id: `friend_${Date.now()}_${index}_${Math.floor(
            Math.random() * 10000
          )}`,
          name: "Unknown",
          avatar: null,
        };
      });
    }

    // Dating data
    this.swipingPool = userData.swipingPool || {};
    this.swipedPool = userData.swipedPool || [];
    this.matches = userData.matches || {};

    // Log final constructed user
    console.log(
      `User construction complete: ${JSON.stringify({
        id: this.id,
        hasName: !!this.name,
        hasProfileData: !!this.profileData,
        profileDataFields: Object.keys(this.profileData).length,
        friendsCount: this.friends.length,
      })}`
    );
  }

  /**
   * Save user data to AsyncStorage and Firestore
   * @returns {Promise<void>}
   */
  async save() {
    try {
      const startTime = Date.now();

      // Validate critical fields
      this._validateFields();

      // First save to AsyncStorage for local persistence (this must always work)
      try {
        // Save the full user data to AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(this));
        console.log("User data saved to AsyncStorage successfully");
      } catch (localError) {
        console.error("Error saving to AsyncStorage:", localError);
        // Don't return here, still try Firestore if needed
      }

      // Skip Firestore save in development mode
      if (isDevelopmentMode()) {
        console.log(
          "Development mode: Skipping Firestore save, using AsyncStorage only"
        );
        return true;
      }

      // Save to Firestore if user has an ID
      if (this.id) {
        try {
          console.log("Saving user data to Firestore...");
          console.log("User ID:", this.id);

          // Create a clean copy of the user data without circular references
          const userData = this.toFirestore();

          // Save to Firestore
          const userRef = doc(db, "users", this.id);

          // Always use setDoc with merge:true which works for both new and existing documents
          await setDoc(userRef, userData, { merge: true });
          console.log(
            this.newUser
              ? "New user created in Firestore"
              : "Existing user updated in Firestore"
          );

          // Clear the newUser flag after saving
          if (this.newUser) {
            delete this.newUser;
          }

          console.log(
            `User data saved to Firestore successfully (${
              Date.now() - startTime
            }ms)`
          );
        } catch (firestoreError) {
          console.error("Error saving to Firestore:", firestoreError);
          logFirebaseOperation(
            "user.save",
            `Failed to save user ${this.id}`,
            firestoreError
          );
          // Don't throw, the user data is already saved locally
        }
      } else {
        console.warn("No user ID available, skipping Firestore save");
      }

      return true;
    } catch (error) {
      console.error("Error in user.save():", error);
      // We still don't throw here to prevent app crashes, as the data may have been saved locally
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
      stanfordEmail: this.stanfordEmail,
      isStanfordVerified: this.isStanfordVerified,
      profileData: this.profileData,
      sexuality: this.sexuality,
      friends: this.friends,
      swipingPool: this.swipingPool,
      swipedPool: this.swipedPool,
      matches: this.matches,
      updatedAt: new Date().toISOString(),
      createdAt: this.createdAt,
    };
  }

  /**
   * Initialize user data in Firestore and set up initial swiping pool
   * This should be called when a new user is created
   * @param {Array} allUsers - Array of all users in the system
   */
  async initialize(allUsers = []) {
    console.log(
      `Initializing user ${this.name || this.id} with ${
        allUsers?.length || 0
      } users`
    );

    // Set up initial swiping pool only if allUsers is a valid array
    if (Array.isArray(allUsers)) {
      this.updateSwipingPool(allUsers);
    } else {
      console.warn("No users provided for swiping pool initialization");
      this.swipingPool = []; // Initialize empty pool
    }

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
   * Periodically update swiping pool to ensure it stays current
   * @param {Array} allUsers - Array of all users in the system
   */
  async refreshSwipingPool(allUsers) {
    this.updateSwipingPool(allUsers);
    await this.save();
  }

  /**
   * Handle new user joining the platform
   * Updates swiping pools for all existing users
   * @param {Array} allUsers - Array of all users in the system
   */
  static async handleNewUserJoin(newUser, allUsers) {
    // Update swiping pool for the new user
    newUser.updateSwipingPool(allUsers);
    await newUser.save();

    // Update swiping pools for all existing users
    for (const user of allUsers) {
      if (user.id !== newUser.id) {
        user.updateSwipingPool(allUsers);
        await user.save();
      }
    }
  }

  /**
   * Load user data from AsyncStorage
   * @returns {Promise<User|null>} User instance or null if not found
   */
  static async load() {
    try {
      // Try to load the complete user object first
      const userData = await AsyncStorage.getItem("user");

      if (userData) {
        console.log("Found complete user data in AsyncStorage");
        const parsedUser = JSON.parse(userData);
        return new User(parsedUser);
      }

      console.log("No user data found in AsyncStorage");
      return null;
    } catch (error) {
      console.error("Error loading user data from AsyncStorage:", error);
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
  async addFriend(friend) {
    if (!this.friends.some((f) => f.id === friend.id)) {
      this.friends.push({
        id: friend.id,
        name: friend.name,
        avatar:
          friend.profileData?.photos && friend.profileData.photos.length > 0
            ? friend.profileData.photos[0]
            : null,
      });

      // Save changes immediately
      await this.save();

      // Update AsyncStorage to ensure changes are reflected immediately
      try {
        await AsyncStorage.setItem("userData", JSON.stringify(this));
      } catch (error) {
        console.error(
          "Error updating AsyncStorage after adding friend:",
          error
        );
      }
    }
  }

  /**
   * Remove a friend from user's friend list
   * @param {string} friendId - Friend's user ID
   */
  async removeFriend(friendId) {
    this.friends = this.friends.filter((friend) => friend.id !== friendId);

    // Save changes immediately
    await this.save();

    // Update AsyncStorage to ensure changes are reflected immediately
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(this));
    } catch (error) {
      console.error(
        "Error updating AsyncStorage after removing friend:",
        error
      );
    }
  }

  /**
   * Update user profile data and refresh swiping pool
   * @param {Object} profileData - Updated profile data
   * @param {Array} allUsers - Array of all users in the system
   */
  async updateProfile(profileData, allUsers) {
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

    // Update swiping pool if gender or sexuality changed
    if (
      profileData.gender ||
      profileData.sexuality ||
      profileData.profileData?.gender ||
      profileData.profileData?.sexuality
    ) {
      this.updateSwipingPool(allUsers);
    }

    // Save changes
    await this.save();
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

  /**
   * Validate required fields and fix any inconsistencies
   * @private
   */
  _validateFields() {
    // Ensure profileData exists
    if (!this.profileData) {
      this.profileData = {};
    }

    // Ensure timestamps are valid
    this.updatedAt = new Date().toISOString();
    this.profileData.updatedAt = new Date().toISOString();

    // If we have no createdAt, set it
    if (!this.createdAt) {
      this.createdAt = new Date().toISOString();
    }

    // Move any fields that should be in profileData
    if (this.age && !this.profileData.age) {
      this.profileData.age = this.age;
      delete this.age;
    }

    if (this.gender && !this.profileData.gender) {
      this.profileData.gender = this.gender;
      delete this.gender;
    }

    if (this.height && !this.profileData.height) {
      this.profileData.height = this.height;
      delete this.height;
    }

    if (this.interests && !this.profileData.interests) {
      this.profileData.interests = this.interests;
      delete this.interests;
    }

    if (this.activities && !this.profileData.dateActivities) {
      this.profileData.dateActivities = this.activities;
      delete this.activities;
    }

    if (this.photos && !this.profileData.photos) {
      this.profileData.photos = this.photos;
      delete this.photos;
    }
  }

  /**
   * Populate swiping pool based on user's sexuality and gender preferences
   * @param {Array} allUsers - Array of all users in the system
   */
  updateSwipingPool(allUsers) {
    // Clear existing swiping pool
    this.swipingPool = [];

    // Skip if user is not a dater
    if (!this.isDater()) {
      console.log(
        `User ${this.name || this.id} is not a dater, skipping swiping pool`
      );
      return;
    }

    // Ensure allUsers is a valid array
    if (!allUsers || !Array.isArray(allUsers)) {
      console.warn(
        `Cannot update swiping pool: allUsers is ${
          allUsers ? "not an array" : "undefined"
        }`
      );
      return;
    }

    // Get user's gender and sexuality
    const userGender = this.profileData?.gender?.toLowerCase();
    const userSexuality = this.sexuality?.toLowerCase();

    console.log(
      `Updating swiping pool for ${
        this.name || this.id
      } (${userGender}, ${userSexuality})`
    );

    // Filter users based on matching rules
    const potentialMatches = allUsers.filter((potentialMatch) => {
      // Skip if potentialMatch is not a valid object
      if (!potentialMatch || typeof potentialMatch !== "object") {
        return false;
      }

      // Skip if it's the same user
      if (potentialMatch.id === this.id) {
        return false;
      }

      // Skip if potential match is not a dater
      if (
        typeof potentialMatch.isDater === "function" &&
        !potentialMatch.isDater()
      ) {
        return false;
      } else if (
        !potentialMatch.userType ||
        (potentialMatch.userType !== "Dater" &&
          potentialMatch.userType !== "Dater & Match Maker")
      ) {
        return false;
      }

      const matchGender = potentialMatch.profileData?.gender?.toLowerCase();
      const matchSexuality =
        potentialMatch.sexuality?.toLowerCase() ||
        potentialMatch.profileData?.sexuality?.toLowerCase();

      // If either user is missing gender or sexuality, skip matching
      if (!userGender || !userSexuality || !matchGender || !matchSexuality) {
        return false;
      }

      // Handle straight users
      if (userSexuality === "straight") {
        if (userGender === "male") {
          // Male straight users match with female non-gay users
          return matchGender === "female" && matchSexuality !== "gay";
        } else if (userGender === "female") {
          // Female straight users match with male non-gay users
          return matchGender === "male" && matchSexuality !== "gay";
        }
      }

      // Handle gay users
      if (userSexuality === "gay") {
        if (userGender === "male") {
          // Male gay users match with male non-straight users
          return matchGender === "male" && matchSexuality !== "straight";
        } else if (userGender === "female") {
          // Female gay users match with female non-straight users
          return matchGender === "female" && matchSexuality !== "straight";
        }
      }

      // Handle bisexual and pansexual users
      if (userSexuality === "bisexual" || userSexuality === "pansexual") {
        return true; // Match with everyone
      }

      return false;
    });

    console.log(
      `Found ${potentialMatches.length} potential matches for ${
        this.name || this.id
      }`
    );

    // Add filtered users to swiping pool with pending status
    potentialMatches.forEach((match) => {
      this.swipingPool.push(match.id);
    });
  }
}

export default User;
