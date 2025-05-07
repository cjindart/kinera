import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper functions for managing friend connections and requests
 */

/**
 * Fetch all registered users from "database"
 * @returns {Array} Array of registered users
 */
export async function getAllUsers() {
  try {
    const usersData = await AsyncStorage.getItem('registeredUsers');
    return usersData ? JSON.parse(usersData) : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Send a friend request from current user to target user
 * @param {string} currentUserId Current user's ID
 * @param {string} targetUserId Target user's ID
 * @returns {boolean} Success status
 */
export async function sendFriendRequest(currentUserId, targetUserId) {
  try {
    // Get current user data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return false;
    
    const currentUser = JSON.parse(userData);
    
    // Check if request already sent
    if (currentUser.sentFriendRequests && 
        currentUser.sentFriendRequests.includes(targetUserId)) {
      return false;
    }
    
    // Add to sent requests for current user
    if (!currentUser.sentFriendRequests) {
      currentUser.sentFriendRequests = [];
    }
    currentUser.sentFriendRequests.push(targetUserId);
    
    // Save updated current user
    await AsyncStorage.setItem('user', JSON.stringify(currentUser));
    
    // Get all users
    const users = await getAllUsers();
    const targetUserIndex = users.findIndex(user => user.userId === targetUserId);
    
    if (targetUserIndex === -1) return false;
    
    // Get target user's full data
    const targetUserData = await AsyncStorage.getItem(`user_${targetUserId}`);
    const targetUser = targetUserData ? JSON.parse(targetUserData) : { userId: targetUserId };
    
    // Add to pending requests for target user
    if (!targetUser.pendingFriendRequests) {
      targetUser.pendingFriendRequests = [];
    }
    targetUser.pendingFriendRequests.push(currentUserId);
    
    // Save updated target user
    await AsyncStorage.setItem(`user_${targetUserId}`, JSON.stringify(targetUser));
    
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
}

/**
 * Accept a friend request
 * @param {string} currentUserId Current user's ID
 * @param {string} requesterUserId Requester user's ID
 * @returns {boolean} Success status
 */
export async function acceptFriendRequest(currentUserId, requesterUserId) {
  try {
    // Get current user data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return false;
    
    const currentUser = JSON.parse(userData);
    
    // Check if request exists
    if (!currentUser.pendingFriendRequests || 
        !currentUser.pendingFriendRequests.includes(requesterUserId)) {
      return false;
    }
    
    // Get requester user data
    const requesterUserData = await AsyncStorage.getItem(`user_${requesterUserId}`);
    if (!requesterUserData) return false;
    
    const requesterUser = JSON.parse(requesterUserData);
    
    // Remove from pending requests
    currentUser.pendingFriendRequests = currentUser.pendingFriendRequests.filter(
      id => id !== requesterUserId
    );
    
    // Remove from sent requests
    if (requesterUser.sentFriendRequests) {
      requesterUser.sentFriendRequests = requesterUser.sentFriendRequests.filter(
        id => id !== currentUserId
      );
    }
    
    // Add to friends list for both users
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    if (!requesterUser.friends) {
      requesterUser.friends = [];
    }
    
    // Add friend data with basic info
    currentUser.friends.push({
      userId: requesterUserId,
      name: requesterUser.name,
      photo: requesterUser.photos && requesterUser.photos.length > 0 
        ? requesterUser.photos[0] 
        : null
    });
    
    requesterUser.friends.push({
      userId: currentUserId,
      name: currentUser.name,
      photo: currentUser.photos && currentUser.photos.length > 0 
        ? currentUser.photos[0] 
        : null
    });
    
    // Save updated users
    await AsyncStorage.setItem('user', JSON.stringify(currentUser));
    await AsyncStorage.setItem(`user_${requesterUserId}`, JSON.stringify(requesterUser));
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
}

/**
 * Reject a friend request
 * @param {string} currentUserId Current user's ID
 * @param {string} requesterUserId Requester user's ID
 * @returns {boolean} Success status
 */
export async function rejectFriendRequest(currentUserId, requesterUserId) {
  try {
    // Get current user data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return false;
    
    const currentUser = JSON.parse(userData);
    
    // Check if request exists
    if (!currentUser.pendingFriendRequests || 
        !currentUser.pendingFriendRequests.includes(requesterUserId)) {
      return false;
    }
    
    // Get requester user data
    const requesterUserData = await AsyncStorage.getItem(`user_${requesterUserId}`);
    if (!requesterUserData) return false;
    
    const requesterUser = JSON.parse(requesterUserData);
    
    // Remove from pending requests
    currentUser.pendingFriendRequests = currentUser.pendingFriendRequests.filter(
      id => id !== requesterUserId
    );
    
    // Remove from sent requests
    if (requesterUser.sentFriendRequests) {
      requesterUser.sentFriendRequests = requesterUser.sentFriendRequests.filter(
        id => id !== currentUserId
      );
    }
    
    // Save updated users
    await AsyncStorage.setItem('user', JSON.stringify(currentUser));
    await AsyncStorage.setItem(`user_${requesterUserId}`, JSON.stringify(requesterUser));
    
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
}

/**
 * Remove a friend
 * @param {string} currentUserId Current user's ID
 * @param {string} friendUserId Friend user's ID
 * @returns {boolean} Success status
 */
export async function removeFriend(currentUserId, friendUserId) {
  try {
    // Get current user data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return false;
    
    const currentUser = JSON.parse(userData);
    
    // Check if they are friends
    if (!currentUser.friends || 
        !currentUser.friends.some(friend => friend.userId === friendUserId)) {
      return false;
    }
    
    // Get friend user data
    const friendUserData = await AsyncStorage.getItem(`user_${friendUserId}`);
    if (!friendUserData) return false;
    
    const friendUser = JSON.parse(friendUserData);
    
    // Remove from friends list for both users
    currentUser.friends = currentUser.friends.filter(
      friend => friend.userId !== friendUserId
    );
    
    if (friendUser.friends) {
      friendUser.friends = friendUser.friends.filter(
        friend => friend.userId !== currentUserId
      );
    }
    
    // Save updated users
    await AsyncStorage.setItem('user', JSON.stringify(currentUser));
    await AsyncStorage.setItem(`user_${friendUserId}`, JSON.stringify(friendUser));
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
}

/**
 * Get friend suggestions based on user activities and interests
 * @param {Object} currentUser Current user object
 * @returns {Array} Array of suggested users
 */
export async function getFriendSuggestions(currentUser) {
  try {
    // Get all users
    const users = await getAllUsers();
    
    // Filter out current user and existing friends/requests
    const existingFriendIds = (currentUser.friends || []).map(friend => friend.userId);
    const pendingRequestIds = currentUser.pendingFriendRequests || [];
    const sentRequestIds = currentUser.sentFriendRequests || [];
    
    // All IDs to exclude
    const excludeIds = [
      currentUser.userId,
      ...existingFriendIds,
      ...pendingRequestIds,
      ...sentRequestIds
    ];
    
    // Filter eligible users
    let eligibleUsers = users.filter(user => !excludeIds.includes(user.userId));
    
    // For now, just return the eligible users
    // In a real app, we would sort by compatibility, mutual friends, etc.
    return eligibleUsers.map(user => ({
      userId: user.userId,
      name: user.name,
      // In real app, we would fetch more profile data here
    })).slice(0, 10); // Limit to 10 suggestions
    
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    return [];
  }
} 