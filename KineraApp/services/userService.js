import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db, isDevelopmentMode } from "../utils/firebase";
import mockData from "../assets/mockUserData.json";

/**
 * Fetch all users from Firestore
 * @returns {Promise<Array>} Array of user objects
 */
export const fetchAllUsers = async () => {
  try {
    // In development mode, return mock data
    if (isDevelopmentMode()) {
      console.log("Development mode: Using mock user data");
      return mockData.users;
    }

    // In production, fetch from Firestore
    console.log("Fetching all users from Firestore");
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${users.length} users from Firestore`);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    // Fallback to mock data in case of error
    console.log("Falling back to mock data due to error");
    return mockData.users;
  }
};

/**
 * Fetch a user by ID
 * @param {string} userId User ID
 * @returns {Promise<Object|null>} User object or null
 */
export const fetchUserById = async (userId) => {
  try {
    // In development mode, use mock data
    if (isDevelopmentMode()) {
      const user = mockData.users.find((user) => user.id === userId);
      return user || null;
    }

    // In production, fetch from Firestore
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
};

/**
 * Get potential matches for a user based on gender and sexuality preferences
 * @param {Object} user Current user
 * @returns {Promise<Array>} Array of potential matches
 */
export const getPotentialMatches = async (user) => {
  try {
    // If no user or user lacks required fields, return empty array
    if (!user || !user.profileData) {
      console.log("No valid user provided for matching");
      return [];
    }

    const userGender = user.profileData.gender;
    const userSexuality = user.profileData.sexuality || user.sexuality;

    console.log(
      `Finding matches for user with gender: ${userGender}, sexuality: ${userSexuality}`
    );

    // Get all users
    const allUsers = await fetchAllUsers();

    // Only include users with userType 'Dater' or 'Dater & Match Maker'
    const eligibleUsers = allUsers.filter(
      (potentialMatch) =>
        potentialMatch.userType === "Dater" ||
        potentialMatch.userType === "Dater & Match Maker"
    );

    // Filter users based on gender and sexuality preferences
    const potentialMatches = eligibleUsers.filter((potentialMatch) => {
      // Don't match with self
      if (potentialMatch.id === user.id) return false;

      const matchGender = potentialMatch.profileData?.gender;
      const matchSexuality =
        potentialMatch.profileData?.sexuality || potentialMatch.sexuality;

      // Basic filtering logic based on gender and sexuality preferences
      // This is a simplified version - you can expand this based on your app's needs

      // If user is straight male, match with straight/bi females
      if (userGender === "male" && userSexuality === "straight") {
        return (
          matchGender === "female" &&
          ["straight", "bisexual"].includes(matchSexuality)
        );
      }

      // If user is straight female, match with straight/bi males
      if (userGender === "female" && userSexuality === "straight") {
        return (
          matchGender === "male" &&
          ["straight", "bisexual"].includes(matchSexuality)
        );
      }

      // If user is gay male, match with gay/bi males
      if (userGender === "male" && userSexuality === "gay") {
        return (
          matchGender === "male" && ["gay", "bisexual"].includes(matchSexuality)
        );
      }

      // If user is lesbian, match with lesbian/bi females
      if (userGender === "female" && userSexuality === "lesbian") {
        return (
          matchGender === "female" &&
          ["lesbian", "bisexual"].includes(matchSexuality)
        );
      }

      // If user is bisexual, match with compatible orientations
      if (userSexuality === "bisexual") {
        if (userGender === "male") {
          return (
            (matchGender === "female" &&
              ["straight", "bisexual"].includes(matchSexuality)) ||
            (matchGender === "male" &&
              ["gay", "bisexual"].includes(matchSexuality))
          );
        }
        if (userGender === "female") {
          return (
            (matchGender === "male" &&
              ["straight", "bisexual"].includes(matchSexuality)) ||
            (matchGender === "female" &&
              ["lesbian", "bisexual"].includes(matchSexuality))
          );
        }
      }

      // If sexuality is not specified, use a more lenient matching
      if (!userSexuality || !matchSexuality) {
        return true;
      }

      return false;
    });

    console.log(`Found ${potentialMatches.length} potential matches`);
    return potentialMatches;
  } catch (error) {
    console.error("Error getting potential matches:", error);
    return [];
  }
};

/**
 * Get candidates for a user to swipe on as a matchmaker
 * @param {Object} matchmakerUser The matchmaker user
 * @param {string} friendId Friend ID to get candidates for
 * @returns {Promise<Array>} Array of candidates
 */
export const getCandidatesForFriend = async (matchmakerUser, friendId) => {
  try {
    // Get the friend's user record
    const friend = await fetchUserById(friendId);

    if (!friend) {
      console.log(`Friend ${friendId} not found`);
      return [];
    }

    console.log(`Getting candidates for friend: ${friend.name} (${friendId})`);

    // Get all users
    const allUsers = await fetchAllUsers();

    // Get potential matches based on preferences
    const potentialMatches = await getPotentialMatches(friend);

    // Filter out the current user (matchmaker) from potential matches
    const filteredPotentialMatches = potentialMatches.filter(
      (match) => match.id !== matchmakerUser.id
    );

    // Initialize or get the matchmaker's swiping pool
    let swipingPools = friend.swipingPools || {};
    if (!swipingPools[matchmakerUser.id]) {
      swipingPools[matchmakerUser.id] = { pool: [], swipedPool: [] };
    }

    // Get this matchmaker's swiped pool
    const matchmakerSwipedPool = new Set(
      swipingPools[matchmakerUser.id].swipedPool || []
    );

    // Filter out users that this matchmaker has already swiped on
    const filteredMatches = filteredPotentialMatches.filter(
      (match) => !matchmakerSwipedPool.has(match.id)
    );

    // Update this matchmaker's pool with new potential matches
    swipingPools[matchmakerUser.id].pool = filteredMatches.map(
      (match) => match.id
    );

    // Update Firestore with the new swiping pools
    try {
      const userRef = doc(db, "users", friendId);
      await updateDoc(userRef, {
        swipingPools: swipingPools,
      });
      console.log(
        `Updated swipingPools for ${friend.name} with ${
          swipingPools[matchmakerUser.id].pool.length
        } candidates`
      );
    } catch (error) {
      console.error(`Error updating swipingPools for ${friend.name}:`, error);
    }

    // Return the filtered matches as candidate objects
    const candidates = filteredMatches.map((match) => ({
      ...match,
      _swipeStatus: "pending",
    }));

    console.log(`Returning ${candidates.length} candidates for ${friend.name}`);
    return candidates;
  } catch (error) {
    console.error(`Error getting candidates for friend ${friendId}:`, error);
    return [];
  }
};

/**
 * Get matchmaker friends for a user
 * @param {Object} user Current user
 * @returns {Promise<Array>} Array of friends who can be matchmakers
 */
export const getMatchmakerFriends = async (user) => {
  try {
    if (!user) {
      console.log("No user provided");
      return [];
    }

    console.log(
      `Finding matchmaker friends for user: ${user.name} (${user.id})`
    );

    // Handle different formats of the friends array
    let friendIds = [];

    if (Array.isArray(user.friends)) {
      console.log(`User has ${user.friends.length} friends in array format`);
      // Extract IDs from array of objects or strings
      friendIds = user.friends
        .map((friend) => {
          if (typeof friend === "string") return friend;
          if (typeof friend === "object" && friend !== null) return friend.id;
          return null;
        })
        .filter((id) => id !== null);
    } else if (typeof user.friends === "object" && user.friends !== null) {
      // Handle case where friends might be an object with IDs as keys
      console.log("Friends is an object format");
      friendIds = Object.keys(user.friends);
    } else {
      console.log("No valid friends format found");
      return [];
    }

    console.log(
      `Extracted ${friendIds.length} friend IDs: ${friendIds.join(", ")}`
    );

    // Special case: if friendIds contains numeric IDs like "1", "2", etc.
    // these might actually be user1, user2, etc. in the mock data
    const correctedFriendIds = friendIds.map((id) => {
      // If id is just a number, prefix with "user"
      if (/^\d+$/.test(id)) {
        console.log(`Converting numeric ID ${id} to user${id}`);
        return `user${id}`;
      }
      return id;
    });

    console.log(`Corrected friend IDs: ${correctedFriendIds.join(", ")}`);

    // Fetch complete user records for each friend
    const friendPromises = correctedFriendIds.map((id) => fetchUserById(id));
    const friendRecords = await Promise.all(friendPromises);

    // Filter out null values (friends not found)
    const validFriendRecords = friendRecords.filter(
      (friend) => friend !== null
    );

    console.log(`Found ${validFriendRecords.length} valid friend records`);

    // Log all friends with their userType for debugging
    validFriendRecords.forEach((friend) => {
      console.log(
        `Friend ${friend.name} (${friend.id}) has userType: ${friend.userType}`
      );
    });

    // Accept any of these variations for matchmaker type
    const matchmakerTypes = [
      "Dater & Match Maker",
      "both",
      "Dater & Swiper",
      "dater-swiper",
      "Dater",
    ];

    // Filter to only include matchmaker friends
    const matchmakerFriends = validFriendRecords.filter(
      (friend) => friend.userType && matchmakerTypes.includes(friend.userType)
    );

    console.log(`Found ${matchmakerFriends.length} matchmaker friends`);
    if (matchmakerFriends.length > 0) {
      console.log(
        `Matchmaker friends: ${matchmakerFriends.map((f) => f.name).join(", ")}`
      );
    }

    return matchmakerFriends;
  } catch (error) {
    console.error("Error getting matchmaker friends:", error);
    return [];
  }
};

/**
 * Seed Firestore with mock user data for testing
 * Only call this function when you need to populate Firestore with test data
 * NOTE: Temporarily allowing this in production mode
 */
export const seedFirestoreWithMockData = async () => {
  try {
    // Temporarily removing development mode check to allow seeding in production
    // if (!isDevelopmentMode()) {
    //   console.warn('Refusing to seed production Firestore with mock data');
    //   return false;
    // }

    console.log("Seeding Firestore with mock user data...");
    const { users } = mockData;
    let successCount = 0;

    // Add each user to Firestore
    for (const user of users) {
      try {
        const userRef = doc(db, "users", user.id);
        await setDoc(userRef, user);
        successCount++;
      } catch (error) {
        console.error(`Error seeding user ${user.id}:`, error);
      }
    }

    console.log(
      `Successfully seeded ${successCount} of ${users.length} users to Firestore`
    );
    return true;
  } catch (error) {
    console.error("Error seeding mock data:", error);
    return false;
  }
};

/**
 * Approve a candidate for a friend
 * @param {Object} currentUser Current user object
 * @param {string} friendId Friend ID
 * @param {string} candidateId Candidate ID
 * @param {Array} allUsers Array of all users
 * @returns {Promise<boolean>} Whether a match was created
 */
export const approveCandidateForFriend = async (
  currentUser,
  friendId,
  candidateId,
  allUsers
) => {
  try {
    // Get latest data from Firestore
    const friendRef = doc(db, "users", friendId);
    const candidateRef = doc(db, "users", candidateId);

    const [friendDoc, candidateDoc] = await Promise.all([
      getDoc(friendRef),
      getDoc(candidateRef),
    ]);

    if (!friendDoc.exists() || !candidateDoc.exists()) {
      console.error("Friend or candidate document not found in Firestore");
      return false;
    }

    // Get current data from Firestore
    const friend = friendDoc.data();
    const candidate = candidateDoc.data();

    // Initialize matches if they don't exist
    if (!friend.matches) friend.matches = {};
    if (!candidate.matches) candidate.matches = {};

    // Calculate approval rate for friend's matches
    const totalFriends = Array.isArray(friend.friends)
      ? friend.friends.filter((f) =>
          typeof f === "object" ? f.userType !== "Dater" : true
        ).length
      : 0;

    let newApprovalRate = 0;
    if (friend.matches[candidateId]) {
      // If already exists, increment by 1/totalFriends
      newApprovalRate =
        friend.matches[candidateId].approvalRate +
        (totalFriends > 0 ? 1 / totalFriends : 0);
    } else {
      // If first time, initialize to 0
      newApprovalRate = 0;
      newApprovalRate =
        newApprovalRate + (totalFriends > 0 ? 1 / totalFriends : 0);
    }

    const candidateApprovalRate =
      candidate.matches[friendId]?.approvalRate || 0;

    // Create match ID if both approval rates are >= 0.5
    let matchId = null;
    if (newApprovalRate >= 0.5 && candidateApprovalRate >= 0.5) {
      matchId = `${friendId}_${candidateId}_${Date.now()}`;
      if (
        typeof global !== "undefined" &&
        global.Alert &&
        typeof global.Alert.alert === "function"
      ) {
        global.Alert.alert(
          "Match Created!",
          "A match has been created! You can view the details in the match portal."
        );
      } else if (
        typeof Alert !== "undefined" &&
        typeof Alert.alert === "function"
      ) {
        Alert.alert(
          "Match Created!",
          "A match has been created! You can view the details in the match portal."
        );
      } else {
        console.log(
          "A match has been created! You can view the details in the match portal."
        );
      }
    }

    // Update friend's matches with candidate
    friend.matches[candidateId] = {
      approvalRate: newApprovalRate,
      matchId: matchId,
    };

    // Update candidate's matches with friend
    candidate.matches[friendId] = {
      approvalRate: candidate.matches[friendId]?.approvalRate || 0,
      matchId: matchId,
    };

    // Update Firestore
    try {
      await Promise.all([
        updateDoc(friendRef, {
          matches: friend.matches,
        }),
        updateDoc(candidateRef, {
          matches: candidate.matches,
        }),
      ]);

      console.log("Successfully updated matches in Firestore");
      return !!matchId;
    } catch (error) {
      console.error("Error updating Firestore:", error);
      return false;
    }
  } catch (error) {
    console.error("Error approving candidate:", error);
    return false;
  }
};

/**
 * Reject a candidate for a friend
 * @param {Object} currentUser Current user object
 * @param {string} friendId Friend ID
 * @param {string} candidateId Candidate ID
 * @param {Array} allUsers Array of all users
 * @returns {Promise<boolean>} Success status
 */
export const rejectCandidateForFriend = async (
  currentUser,
  friendId,
  candidateId,
  allUsers
) => {
  try {
    // Get latest data from Firestore
    const friendRef = doc(db, "users", friendId);
    const friendDoc = await getDoc(friendRef);

    if (!friendDoc.exists()) {
      console.error("Friend document not found in Firestore");
      return false;
    }

    // Get current data from Firestore
    const friend = friendDoc.data();

    // Initialize matches if they don't exist
    if (!friend.matches) friend.matches = {};

    // Calculate approval rate (rejection doesn't affect approval rate)
    // const totalSwipes = Object.keys(friend.matches).length + 1; // +1 for current swipe
    // const approvedSwipes = Object.values(friend.matches).filter(
    //   (match) => match.approvalRate > 0
    // ).length;
    // const approvalRate = (approvedSwipes / totalSwipes) * 100;

    // Update friend's matches with candidate if not already present
    if (!friend.matches[candidateId]) {
      friend.matches[candidateId] = {
        approvalRate: 0,
        matchId: null,
      };

      // Update Firestore
      try {
        await updateDoc(friendRef, {
          matches: friend.matches,
        });

        console.log("Successfully updated matches in Firestore for rejection");
        return true;
      } catch (error) {
        console.error("Error updating Firestore for rejection:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error rejecting candidate:", error);
    return false;
  }
};

/**
 * Handle a swipe for a candidate
 * @param {Object} currentUser Current user object
 * @param {string} friendId Friend ID
 * @param {string} candidateId Candidate ID
 * @param {boolean} isApproved Whether the swipe is approved
 * @param {Array} allUsers Array of all users
 * @returns {Promise<boolean>} Success status
 */
export const handleSwipe = async (
  currentUser,
  friendId,
  candidateId,
  isApproved,
  allUsers
) => {
  try {
    // Get the friend's user record
    const friend = await fetchUserById(friendId);
    if (!friend) {
      console.error(`Friend ${friendId} not found`);
      return false;
    }

    // Get the candidate's user record
    const candidate = allUsers.find((u) => u.id === candidateId);
    if (!candidate) {
      console.error(`Candidate ${candidateId} not found`);
      return false;
    }

    console.log(
      `Handling swipe for ${friend.name} (${friendId}) on ${candidate.name} (${candidateId})`
    );

    // Initialize or get the matchmaker's swiping pool
    let swipingPools = friend.swipingPools || {};
    if (!swipingPools[currentUser.id]) {
      swipingPools[currentUser.id] = { pool: [], swipedPool: [] };
    }

    // Get current pools
    const pool = swipingPools[currentUser.id].pool || [];
    const swipedPool = swipingPools[currentUser.id].swipedPool || [];

    // Remove the candidate from the pool and add to swiped pool
    const updatedPool = pool.filter((id) => id !== candidateId);
    const updatedSwipedPool = [...swipedPool, candidateId];

    // Update the swiping pools for this matchmaker only
    swipingPools[currentUser.id] = {
      pool: updatedPool,
      swipedPool: updatedSwipedPool,
    };

    // Update Firestore
    const userRef = doc(db, "users", friendId);
    await updateDoc(userRef, {
      swipingPools: swipingPools,
    });

    console.log(
      `Updated swipingPools for ${friend.name} with key ${currentUser.id}`
    );
    console.log(
      `Pool size: ${updatedPool.length}, SwipedPool size: ${updatedSwipedPool.length}`
    );

    // Handle the approval/rejection
    if (isApproved) {
      return await approveCandidateForFriend(
        currentUser,
        friendId,
        candidateId,
        allUsers
      );
    } else {
      return await rejectCandidateForFriend(
        currentUser,
        friendId,
        candidateId,
        allUsers
      );
    }
  } catch (error) {
    console.error("Error handling swipe:", error);
    return false;
  }
};
