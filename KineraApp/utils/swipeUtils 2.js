/**
 * Utility functions for managing swipe data structures
 */

/**
 * Ensures the swipingPools structure exists and has the correct format
 */
export const ensureSwipingPoolsStructure = (friendData, matchmakerId) => {
  if (!friendData.swipingPools) {
    friendData.swipingPools = {};
  }
  
  if (!friendData.swipingPools[matchmakerId]) {
    friendData.swipingPools[matchmakerId] = {
      pool: [],
      swipedPool: []
    };
  }
  
  return friendData.swipingPools;
};

/**
 * Ensures the swipedPool array exists
 */
export const ensureSwipedPoolArray = (friendData) => {
  if (!friendData.swipedPool) {
    friendData.swipedPool = [];
  }
  return friendData.swipedPool;
};

/**
 * Adds a candidate to the swipedPool if not already present
 */
export const addToSwipedPool = (friendData, candidateId) => {
  const swipedPool = ensureSwipedPoolArray(friendData);
  if (!swipedPool.includes(candidateId)) {
    swipedPool.push(candidateId);
  }
  return swipedPool;
};

/**
 * Records a swipe action and updates the swipingPools structure
 */
export const recordSwipeAction = (friendData, matchmakerId, candidateId, action) => {
  const swipingPools = ensureSwipingPoolsStructure(friendData, matchmakerId);
  
  // Remove from pool if present
  swipingPools[matchmakerId].pool = swipingPools[matchmakerId].pool.filter(
    id => id !== candidateId
  );
  
  // Add to swipedPool if not already present
  if (!swipingPools[matchmakerId].swipedPool.includes(candidateId)) {
    swipingPools[matchmakerId].swipedPool.push(candidateId);
  }
  
  return swipingPools;
};

/**
 * Logs the current state of swipe data structures
 */
export const logSwipeStructures = (friendData, friendId, matchmakerId) => {
  console.log(`=== Swipe Structures for Friend ${friendId} ===`);
  console.log('SwipedPool:', friendData.swipedPool || []);
  console.log('SwipingPools:', friendData.swipingPools || {});
  if (friendData.swipingPools?.[matchmakerId]) {
    console.log(`Matchmaker ${matchmakerId} Pool:`, friendData.swipingPools[matchmakerId].pool);
    console.log(`Matchmaker ${matchmakerId} SwipedPool:`, friendData.swipingPools[matchmakerId].swipedPool);
  }
}; 