const handleSwipe = async (direction) => {
  if (!candidates.length || swipeLoading) return;
  setSwipeLoading(true);
  try {
    // Get current friend and candidate
    const currentFriend = matchmakerFriends[currentFriendIndex];
    const candidateId = currentCandidate.id;

    console.log("=== Swipe Debug ===");
    console.log("Direction:", direction);
    console.log("Current Friend:", currentFriend.id);
    console.log("Current Candidate:", candidateId);

    // Get all users for the backend operations
    const allUsers = await fetchAllUsers();
    console.log("Fetched all users:", allUsers.length);

    if (direction === "right") {
      // Handle approval
      console.log("Attempting to approve candidate...");
      const matchCreated = await approveCandidateForFriend(
        currentUser,
        currentFriend.id,
        candidateId,
        allUsers
      );
      console.log("Approval result:", matchCreated);

      // Update local state with new match data
      const updatedFriend = allUsers.find(
        (user) => user.id === currentFriend.id
      );
      const updatedCandidate = allUsers.find((user) => user.id === candidateId);

      if (updatedFriend && updatedCandidate) {
        console.log("Updating local state with new match data");
        // Update the friend in matchmakerFriends array
        const updatedMatchmakerFriends = [...matchmakerFriends];
        updatedMatchmakerFriends[currentFriendIndex] = updatedFriend;
        setMatchmakerFriends(updatedMatchmakerFriends);

        // Update the candidate in candidates array
        const updatedCandidates = [...candidates];
        const candidateIndex = updatedCandidates.findIndex(
          (c) => c.id === candidateId
        );
        if (candidateIndex !== -1) {
          updatedCandidates[candidateIndex] = updatedCandidate;
          setCandidates(updatedCandidates);
        }
      }
    } else {
      // Handle rejection
      console.log("Attempting to reject candidate...");
      const rejected = await rejectCandidateForFriend(
        currentUser,
        currentFriend.id,
        candidateId,
        allUsers
      );
      console.log("Rejection result:", rejected);

      // Update local state with new match data after rejection
      const updatedFriend = allUsers.find(
        (user) => user.id === currentFriend.id
      );
      if (updatedFriend) {
        console.log("Updating local state after rejection");
        const updatedMatchmakerFriends = [...matchmakerFriends];
        updatedMatchmakerFriends[currentFriendIndex] = updatedFriend;
        setMatchmakerFriends(updatedMatchmakerFriends);
      }
    }

    // After a swipe (approve or reject)
    try {
      const friendRef = doc(db, "users", currentFriend.id);
      const friendDoc = await getDoc(friendRef);
      const friendData = friendDoc.data();

      // Update swipingPools for this matchmaker only
      let swipingPools = friendData.swipingPools || {};
      if (!swipingPools[currentUser.id]) {
        swipingPools[currentUser.id] = { pool: [], swipedPool: [] };
      }

      // Add to this matchmaker's swipedPool
      if (!swipingPools[currentUser.id].swipedPool.includes(candidateId)) {
        swipingPools[currentUser.id].swipedPool.push(candidateId);
      }

      // Remove from this matchmaker's pool
      swipingPools[currentUser.id].pool = swipingPools[
        currentUser.id
      ].pool.filter((id) => id !== candidateId);

      await updateDoc(friendRef, {
        swipingPools: swipingPools,
      });
    } catch (error) {
      console.error("Error updating swipingPools:", error);
    }

    // Mark current candidate as swiped in local state
    setSwipedCandidates((prev) => ({
      ...prev,
      [candidateId]: direction,
    }));

    // After Firestore updates:
    await loadCandidatesForFriend(currentUser, currentFriend);
    setCurrentCandidateIndex(0);
  } catch (error) {
    console.error("Error handling swipe:", error);
    Alert.alert("Error", "Failed to process swipe. Check console for details.");
  } finally {
    setSwipeLoading(false);
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
    const candidateIds = filteredPotentialMatches.map((u) => u.id);

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
        `Updated swipingPools for friend ${friend.name} with key ${matchmakerUser.id}`
      );
    } catch (error) {
      console.error("Error updating swipingPools in Firestore:", error);
    }

    // Return the filtered matches as candidate objects
    const candidates = filteredMatches.map((match) => ({
      ...match,
      _swipeStatus: "pending",
    }));

    console.log(
      `Returning ${candidates.length} candidates for matchmaker ${matchmakerUser.id}`
    );
    return candidates;
  } catch (error) {
    console.error(`Error getting candidates for friend ${friendId}:`, error);
    return [];
  }
};
