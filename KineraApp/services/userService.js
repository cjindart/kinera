import { collection, getDocs, query, where, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, isDevelopmentMode } from '../utils/firebase';
import mockData from '../assets/mockUserData.json';

/**
 * Fetch all users from Firestore
 * @returns {Promise<Array>} Array of user objects
 */
export const fetchAllUsers = async () => {
  try {
    // In development mode, return mock data
    if (isDevelopmentMode()) {
      console.log('Development mode: Using mock user data');
      return mockData.users;
    }

    // In production, fetch from Firestore
    console.log('Fetching all users from Firestore');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Fetched ${users.length} users from Firestore`);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Fallback to mock data in case of error
    console.log('Falling back to mock data due to error');
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
      const user = mockData.users.find(user => user.id === userId);
      return user || null;
    }

    // In production, fetch from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
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
      console.log('No valid user provided for matching');
      return [];
    }

    const userGender = user.profileData.gender;
    const userSexuality = user.profileData.sexuality || user.sexuality;
    
    console.log(`Finding matches for user with gender: ${userGender}, sexuality: ${userSexuality}`);
    
    // Get all users
    const allUsers = await fetchAllUsers();
    
    // Filter users based on gender and sexuality preferences
    const potentialMatches = allUsers.filter(potentialMatch => {
      // Don't match with self
      if (potentialMatch.id === user.id) return false;
      
      const matchGender = potentialMatch.profileData?.gender;
      const matchSexuality = potentialMatch.profileData?.sexuality || potentialMatch.sexuality;
      
      // Basic filtering logic based on gender and sexuality
      // This is a simplified version - you can expand this based on your app's needs
      
      // If user is straight male, match with straight/bi females
      if (userGender === 'male' && userSexuality === 'straight') {
        return matchGender === 'female' && ['straight', 'bisexual'].includes(matchSexuality);
      }
      
      // If user is straight female, match with straight/bi males
      if (userGender === 'female' && userSexuality === 'straight') {
        return matchGender === 'male' && ['straight', 'bisexual'].includes(matchSexuality);
      }
      
      // If user is gay male, match with gay/bi males
      if (userGender === 'male' && userSexuality === 'gay') {
        return matchGender === 'male' && ['gay', 'bisexual'].includes(matchSexuality);
      }
      
      // If user is lesbian, match with lesbian/bi females
      if (userGender === 'female' && userSexuality === 'lesbian') {
        return matchGender === 'female' && ['lesbian', 'bisexual'].includes(matchSexuality);
      }
      
      // If user is bisexual, match with compatible orientations
      if (userSexuality === 'bisexual') {
        if (userGender === 'male') {
          return (matchGender === 'female' && ['straight', 'bisexual'].includes(matchSexuality)) ||
                 (matchGender === 'male' && ['gay', 'bisexual'].includes(matchSexuality));
        }
        if (userGender === 'female') {
          return (matchGender === 'male' && ['straight', 'bisexual'].includes(matchSexuality)) ||
                 (matchGender === 'female' && ['lesbian', 'bisexual'].includes(matchSexuality));
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
    console.error('Error getting potential matches:', error);
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
    
    // Check if the friend has an existing swipingPool in their data
    const swipingPool = friend.swipingPool || {};
    console.log(`Friend has swipingPool with ${Object.keys(swipingPool).length} candidates`);
    
    // If the friend has a swiping pool, use that first
    if (Object.keys(swipingPool).length > 0) {
      console.log(`Using existing swipingPool data for ${friend.name}`);
      
      // Get all users
      const allUsers = await fetchAllUsers();
      
      // Map swipingPool user IDs to actual user objects
      const poolCandidates = Object.keys(swipingPool)
        .map(userId => {
          const user = allUsers.find(u => u.id === userId);
          if (user) {
            // Add the status from swipingPool to the user object
            return {
              ...user,
              _swipeStatus: swipingPool[userId].status
            };
          }
          return null;
        })
        .filter(user => user !== null); // Remove any null entries (users not found)
      
      console.log(`Found ${poolCandidates.length} candidates in swipingPool`);
      return poolCandidates;
    }
    
    // Fallback to gender/sexuality based matching if no swipingPool exists
    console.log(`No swipingPool found, falling back to gender/sexuality matching`);
    const potentialMatches = await getPotentialMatches(friend);
    console.log(`Found ${potentialMatches.length} potential matches based on preferences`);
    
    return potentialMatches;
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
      console.log('No user provided');
      return [];
    }
    
    console.log(`Finding matchmaker friends for user: ${user.name} (${user.id})`);
    
    // Handle different formats of the friends array
    let friendIds = [];
    
    if (Array.isArray(user.friends)) {
      console.log(`User has ${user.friends.length} friends in array format`);
      // Extract IDs from array of objects or strings
      friendIds = user.friends.map(friend => {
        if (typeof friend === 'string') return friend;
        if (typeof friend === 'object' && friend !== null) return friend.id;
        return null;
      }).filter(id => id !== null);
    } else if (typeof user.friends === 'object' && user.friends !== null) {
      // Handle case where friends might be an object with IDs as keys
      console.log('Friends is an object format');
      friendIds = Object.keys(user.friends);
    } else {
      console.log('No valid friends format found');
      return [];
    }
    
    console.log(`Extracted ${friendIds.length} friend IDs: ${friendIds.join(', ')}`);
    
    // Special case: if friendIds contains numeric IDs like "1", "2", etc.
    // these might actually be user1, user2, etc. in the mock data
    const correctedFriendIds = friendIds.map(id => {
      // If id is just a number, prefix with "user"
      if (/^\d+$/.test(id)) {
        console.log(`Converting numeric ID ${id} to user${id}`);
        return `user${id}`;
      }
      return id;
    });
    
    console.log(`Corrected friend IDs: ${correctedFriendIds.join(', ')}`);
    
    // Fetch complete user records for each friend
    const friendPromises = correctedFriendIds.map(id => fetchUserById(id));
    const friendRecords = await Promise.all(friendPromises);
    
    // Filter out null values (friends not found)
    const validFriendRecords = friendRecords.filter(friend => friend !== null);
    
    console.log(`Found ${validFriendRecords.length} valid friend records`);
    
    // Log all friends with their userType for debugging
    validFriendRecords.forEach(friend => {
      console.log(`Friend ${friend.name} (${friend.id}) has userType: ${friend.userType}`);
    });
    
    // Accept any of these variations for matchmaker type
    const matchmakerTypes = [
      'Match Maker', 
      'Dater & Match Maker', 
      'match_maker', 
      'both',
      'Swiper',
      'Dater & Swiper',
      'swiper',
      'dater-swiper'
    ];
    
    // Filter to only include matchmaker friends
    const matchmakerFriends = validFriendRecords.filter(friend => 
      friend.userType && matchmakerTypes.includes(friend.userType)
    );
    
    console.log(`Found ${matchmakerFriends.length} matchmaker friends`);
    if (matchmakerFriends.length > 0) {
      console.log(`Matchmaker friends: ${matchmakerFriends.map(f => f.name).join(', ')}`);
    }
    
    return matchmakerFriends;
  } catch (error) {
    console.error('Error getting matchmaker friends:', error);
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
    
    console.log('Seeding Firestore with mock user data...');
    const { users } = mockData;
    let successCount = 0;
    
    // Add each user to Firestore
    for (const user of users) {
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, user);
        successCount++;
      } catch (error) {
        console.error(`Error seeding user ${user.id}:`, error);
      }
    }
    
    console.log(`Successfully seeded ${successCount} of ${users.length} users to Firestore`);
    return true;
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return false;
  }
}; 