import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllUsers } from './friendUtils';

/**
 * Helper functions for handling dating matches and suggestions
 */

/**
 * Generate potential matches for a user
 * @param {Object} currentUser Current user object
 * @returns {Array} Array of potential matches
 */
export async function getPotentialMatches(currentUser) {
  try {
    // Get all users
    const users = await getAllUsers();
    
    // In a real app, we'd fetch detailed data for each user
    // For now, we'll just use the basic user data
    
    // Filter out current user and users already matched/rejected
    const existingMatchIds = (currentUser.matches || []).map(match => match.userId);
    const rejectedMatchIds = currentUser.rejectedMatches || [];
    
    // Filter by gender/sexuality preferences
    // This is a simplified version - in a real app, the logic would be more complex
    let filteredUsers = users.filter(user => {
      // Exclude current user
      if (user.userId === currentUser.userId) return false;
      
      // Exclude existing matches and rejections
      if ([...existingMatchIds, ...rejectedMatchIds].includes(user.userId)) return false;
      
      // For demo purposes, just return all other users
      // In a real app, we would check gender/sexuality compatibility here
      return true;
    });
    
    // Sort by compatibility score (placeholder for now)
    filteredUsers.sort(() => Math.random() - 0.5);
    
    // Return subset of users as potential matches
    return filteredUsers.slice(0, 10);
  } catch (error) {
    console.error('Error generating potential matches:', error);
    return [];
  }
}

/**
 * Add a user-suggested match (matchmaker functionality)
 * @param {string} matchmakerId ID of the matchmaker user
 * @param {string} user1Id ID of the first user to match
 * @param {string} user2Id ID of the second user to match
 * @returns {boolean} Success status
 */
export async function suggestMatch(matchmakerId, user1Id, user2Id) {
  try {
    // Get matchmaker user data to verify they are friends with both users
    const matchmakerData = await AsyncStorage.getItem('user');
    if (!matchmakerData) return false;
    
    const matchmaker = JSON.parse(matchmakerData);
    
    // Check if matchmaker is friends with both users
    const friendIds = (matchmaker.friends || []).map(friend => friend.userId);
    if (!friendIds.includes(user1Id) || !friendIds.includes(user2Id)) {
      return false;
    }
    
    // Get user1 data
    const user1Data = await AsyncStorage.getItem(`user_${user1Id}`);
    if (!user1Data) return false;
    
    const user1 = JSON.parse(user1Data);
    
    // Get user2 data
    const user2Data = await AsyncStorage.getItem(`user_${user2Id}`);
    if (!user2Data) return false;
    
    const user2 = JSON.parse(user2Data);
    
    // Add potential match to user1
    if (!user1.potentialMatches) {
      user1.potentialMatches = [];
    }
    
    // Check if already a potential match
    if (!user1.potentialMatches.some(match => match.userId === user2Id)) {
      user1.potentialMatches.push({
        userId: user2Id,
        name: user2.name,
        suggestedBy: matchmakerId,
        photo: user2.photos && user2.photos.length > 0 ? user2.photos[0] : null
      });
    }
    
    // Add potential match to user2
    if (!user2.potentialMatches) {
      user2.potentialMatches = [];
    }
    
    // Check if already a potential match
    if (!user2.potentialMatches.some(match => match.userId === user1Id)) {
      user2.potentialMatches.push({
        userId: user1Id,
        name: user1.name,
        suggestedBy: matchmakerId,
        photo: user1.photos && user1.photos.length > 0 ? user1.photos[0] : null
      });
    }
    
    // Save updated users
    await AsyncStorage.setItem(`user_${user1Id}`, JSON.stringify(user1));
    await AsyncStorage.setItem(`user_${user2Id}`, JSON.stringify(user2));
    
    // Update matchmaker's suggested matches
    if (!matchmaker.setupMatches) {
      matchmaker.setupMatches = [];
    }
    
    matchmaker.setupMatches.push({
      user1Id,
      user2Id,
      timestamp: new Date().toISOString(),
      status: 'pending' // pending, matched, or rejected
    });
    
    await AsyncStorage.setItem('user', JSON.stringify(matchmaker));
    
    return true;
  } catch (error) {
    console.error('Error suggesting match:', error);
    return false;
  }
}

/**
 * Handle a user's swipe action (like/reject)
 * @param {string} currentUserId Current user's ID
 * @param {string} targetUserId Target user's ID
 * @param {boolean} isLike True if the user liked, false if rejected
 * @returns {Object} Result object with match status
 */
export async function handleSwipe(currentUserId, targetUserId, isLike) {
  try {
    // Get current user data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return { success: false };
    
    const currentUser = JSON.parse(userData);
    
    // Get target user data
    const targetUserData = await AsyncStorage.getItem(`user_${targetUserId}`);
    if (!targetUserData) return { success: false };
    
    const targetUser = JSON.parse(targetUserData);
    
    if (isLike) {
      // Check if target user has already liked current user
      const targetLikes = targetUser.likes || [];
      const isMatch = targetLikes.includes(currentUserId);
      
      // Add target user to current user's likes
      if (!currentUser.likes) {
        currentUser.likes = [];
      }
      currentUser.likes.push(targetUserId);
      
      // If match, add to matches for both users
      if (isMatch) {
        if (!currentUser.matches) {
          currentUser.matches = [];
        }
        if (!targetUser.matches) {
          targetUser.matches = [];
        }
        
        // Add match to current user
        currentUser.matches.push({
          userId: targetUserId,
          name: targetUser.name,
          matchDate: new Date().toISOString(),
          photo: targetUser.photos && targetUser.photos.length > 0 ? targetUser.photos[0] : null
        });
        
        // Add match to target user
        targetUser.matches.push({
          userId: currentUserId,
          name: currentUser.name,
          matchDate: new Date().toISOString(),
          photo: currentUser.photos && currentUser.photos.length > 0 ? currentUser.photos[0] : null
        });
        
        // If this was suggested by a friend, update the suggestion status
        if (targetUser.setupMatches) {
          const matchSuggestion = targetUser.setupMatches.find(
            setup => (setup.user1Id === currentUserId && setup.user2Id === targetUserId) || 
                    (setup.user1Id === targetUserId && setup.user2Id === currentUserId)
          );
          
          if (matchSuggestion) {
            matchSuggestion.status = 'matched';
          }
        }
        
        if (currentUser.setupMatches) {
          const matchSuggestion = currentUser.setupMatches.find(
            setup => (setup.user1Id === currentUserId && setup.user2Id === targetUserId) || 
                    (setup.user1Id === targetUserId && setup.user2Id === currentUserId)
          );
          
          if (matchSuggestion) {
            matchSuggestion.status = 'matched';
          }
        }
        
        // Save updated users
        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
        await AsyncStorage.setItem(`user_${targetUserId}`, JSON.stringify(targetUser));
        
        return { 
          success: true, 
          isMatch: true,
          matchData: {
            userId: targetUserId,
            name: targetUser.name,
            photo: targetUser.photos && targetUser.photos.length > 0 ? targetUser.photos[0] : null
          }
        };
      }
    } else {
      // Add target user to current user's rejections
      if (!currentUser.rejectedMatches) {
        currentUser.rejectedMatches = [];
      }
      if (!currentUser.rejectedMatches.includes(targetUserId)) {
        currentUser.rejectedMatches.push(targetUserId);
      }
      
      // If this was suggested by a friend, update the suggestion status
      if (targetUser.setupMatches) {
        const matchSuggestion = targetUser.setupMatches.find(
          setup => (setup.user1Id === currentUserId && setup.user2Id === targetUserId) || 
                  (setup.user1Id === targetUserId && setup.user2Id === currentUserId)
        );
        
        if (matchSuggestion) {
          matchSuggestion.status = 'rejected';
        }
      }
      
      if (currentUser.setupMatches) {
        const matchSuggestion = currentUser.setupMatches.find(
          setup => (setup.user1Id === currentUserId && setup.user2Id === targetUserId) || 
                  (setup.user1Id === targetUserId && setup.user2Id === currentUserId)
        );
        
        if (matchSuggestion) {
          matchSuggestion.status = 'rejected';
        }
      }
    }
    
    // Save updated current user
    await AsyncStorage.setItem('user', JSON.stringify(currentUser));
    
    return { 
      success: true, 
      isMatch: false 
    };
  } catch (error) {
    console.error('Error handling swipe:', error);
    return { success: false };
  }
}

/**
 * Get all matches for a user
 * @param {string} userId User ID
 * @returns {Array} Array of matches
 */
export async function getUserMatches(userId) {
  try {
    // Get user data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return [];
    
    const user = JSON.parse(userData);
    
    return user.matches || [];
  } catch (error) {
    console.error('Error getting user matches:', error);
    return [];
  }
}

/**
 * Get match suggestions made by a matchmaker
 * @param {string} matchmakerId Matchmaker user ID
 * @returns {Array} Array of match suggestions
 */
export async function getMatchmakerSuggestions(matchmakerId) {
  try {
    // Get matchmaker data
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return [];
    
    const user = JSON.parse(userData);
    
    return user.setupMatches || [];
  } catch (error) {
    console.error('Error getting matchmaker suggestions:', error);
    return [];
  }
} 