/**
 * Utilities for safely manipulating swipe-related data structures
 */

/**
 * Ensures a user's swipingPools object is properly initialized
 * @param {Object} userData - User data object from Firestore
 * @param {string} matchmakerId - ID of the matchmaker user
 * @returns {Object} - Properly initialized swipingPools object
 */
export const ensureSwipingPoolsStructure = (userData, matchmakerId) => {
  // Initialize swipingPools if it doesn't exist or isn't an object
  if (!userData.swipingPools || typeof userData.swipingPools !== 'object') {
    userData.swipingPools = {};
  }
  
  // Initialize matchmaker's pool if it doesn't exist
  if (!userData.swipingPools[matchmakerId] || typeof userData.swipingPools[matchmakerId] !== 'object') {
    userData.swipingPools[matchmakerId] = {
      pool: [],
      swipedPool: [],
      approvals: {},
      rejections: {}
    };
  }
  
  // Ensure all required properties exist
  const matchmakerPool = userData.swipingPools[matchmakerId];
  
  if (!Array.isArray(matchmakerPool.pool)) {
    matchmakerPool.pool = [];
  }
  
  if (!Array.isArray(matchmakerPool.swipedPool)) {
    matchmakerPool.swipedPool = [];
  }
  
  if (typeof matchmakerPool.approvals !== 'object' || matchmakerPool.approvals === null) {
    matchmakerPool.approvals = {};
  }
  
  if (typeof matchmakerPool.rejections !== 'object' || matchmakerPool.rejections === null) {
    matchmakerPool.rejections = {};
  }
  
  return userData.swipingPools;
};

/**
 * Ensures a user's swipedPool array is properly initialized
 * @param {Object} userData - User data object from Firestore
 * @returns {Array} - Properly initialized swipedPool array
 */
export const ensureSwipedPoolArray = (userData) => {
  if (!Array.isArray(userData.swipedPool)) {
    userData.swipedPool = [];
  }
  return userData.swipedPool;
};

/**
 * Adds a candidate to a user's swipedPool
 * @param {Object} userData - User data object from Firestore
 * @param {string} candidateId - ID of the candidate to add
 * @returns {Array} - Updated swipedPool
 */
export const addToSwipedPool = (userData, candidateId) => {
  const swipedPool = ensureSwipedPoolArray(userData);
  
  if (!swipedPool.includes(candidateId)) {
    swipedPool.push(candidateId);
  }
  
  return swipedPool;
};

/**
 * Records a swipe action in the swipingPools structure
 * @param {Object} userData - User data object from Firestore
 * @param {string} matchmakerId - ID of the matchmaker user
 * @param {string} candidateId - ID of the candidate
 * @param {string} action - Either "approved" or "rejected"
 * @returns {Object} - Updated swipingPools object
 */
export const recordSwipeAction = (userData, matchmakerId, candidateId, action) => {
  const swipingPools = ensureSwipingPoolsStructure(userData, matchmakerId);
  const matchmakerPool = swipingPools[matchmakerId];
  
  // Record the swipe in the appropriate collection
  if (action === "approved") {
    matchmakerPool.approvals[candidateId] = {
      timestamp: new Date().toISOString(),
      result: "approved"
    };
  } else {
    matchmakerPool.rejections[candidateId] = {
      timestamp: new Date().toISOString(),
      result: "rejected"
    };
  }
  
  // Add to swipedPool if not already there
  if (!matchmakerPool.swipedPool.includes(candidateId)) {
    matchmakerPool.swipedPool.push(candidateId);
  }
  
  // Remove from active pool
  matchmakerPool.pool = matchmakerPool.pool.filter(id => id !== candidateId);
  
  return swipingPools;
};

/**
 * Ensures the matches object is properly initialized
 * @param {Object} userData - User data object from Firestore
 * @returns {Object} - Properly initialized matches object
 */
export const ensureMatchesStructure = (userData) => {
  if (!userData.matches || typeof userData.matches !== 'object') {
    userData.matches = {};
  }
  return userData.matches;
};

/**
 * Creates a consistent match object structure
 * @param {number} approvalRate - Approval rate for this match
 * @param {boolean} matchBack - Whether this is a mutual match
 * @param {string|null} matchId - Match ID if a match was created, null otherwise
 * @returns {Object} - Structured match object
 */
export const createMatchObject = (approvalRate, matchBack = false, matchId = null) => {
  return {
    approvalRate,
    matchBack,
    matchId,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Logs the state of swipe-related data structures for debugging
 * @param {Object} userData - User data object from Firestore
 * @param {string} userId - ID of the user
 * @param {string} matchmakerId - ID of the matchmaker user (optional)
 */
export const logSwipeStructures = (userData, userId, matchmakerId = null) => {
  console.log(`=== Swipe Data Structures for ${userId} ===`);
  
  // Log swipedPool
  const swipedPoolSize = Array.isArray(userData.swipedPool) ? userData.swipedPool.length : 'invalid structure';
  console.log(`- swipedPool: ${swipedPoolSize} items`);
  
  // Log matches
  const matchesCount = typeof userData.matches === 'object' ? Object.keys(userData.matches).length : 'invalid structure';
  console.log(`- matches: ${matchesCount} items`);
  
  // Log swipingPools if matchmakerId provided
  if (matchmakerId && userData.swipingPools && typeof userData.swipingPools === 'object') {
    const matchmakerPool = userData.swipingPools[matchmakerId];
    if (matchmakerPool && typeof matchmakerPool === 'object') {
      console.log(`- swipingPools for matchmaker ${matchmakerId}:`);
      console.log(`  - pool: ${Array.isArray(matchmakerPool.pool) ? matchmakerPool.pool.length : 'invalid'} candidates`);
      console.log(`  - swipedPool: ${Array.isArray(matchmakerPool.swipedPool) ? matchmakerPool.swipedPool.length : 'invalid'} candidates`);
      console.log(`  - approvals: ${typeof matchmakerPool.approvals === 'object' ? Object.keys(matchmakerPool.approvals).length : 'invalid'} candidates`);
      console.log(`  - rejections: ${typeof matchmakerPool.rejections === 'object' ? Object.keys(matchmakerPool.rejections).length : 'invalid'} candidates`);
    } else {
      console.log(`- No valid swipingPools data for matchmaker ${matchmakerId}`);
    }
  }
  
  console.log('===========================');
}; 