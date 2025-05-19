import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../assets/theme";
import User from "../models/User";
import {
  fetchAllUsers,
  getMatchmakerFriends,
  getCandidatesForFriend,
  getPotentialMatches,
  seedFirestoreWithMockData,
  fetchUserById,
  approveCandidateForFriend,
  rejectCandidateForFriend,
} from "../services/userService";
import { isDevelopmentMode } from "../utils/firebase";
import mockData from "../assets/mockUserData.json";
import { useAuth } from "../context/AuthContext";
import { hasAccessToScreen } from "../utils/accessControl";
import LockedScreen from "../components/LockedScreen";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { 
  ensureSwipingPoolsStructure, 
  ensureSwipedPoolArray,
  addToSwipedPool,
  recordSwipeAction,
  logSwipeStructures 
} from "../utils/swipeUtils";
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get("window");

export default function AvailabilityScreen() {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [matchmakerFriends, setMatchmakerFriends] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [swipedCandidates, setSwipedCandidates] = useState({});
  const [friendSelectorLocked, setFriendSelectorLocked] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState({});
  const prevFriendsRef = useRef([]);
  const { user } = useAuth();
  const userType = user?.userType || "";
  const hasAccess = hasAccessToScreen(userType, "Home");

  // Helper to get image source with fallback
  const getImageSource = (friend) => {
    if (!friend) return require("../assets/photos/daniel.png");
    
    // Use preloaded image if available
    if (preloadedImages[friend.id]) {
      return { uri: preloadedImages[friend.id] };
    }
    
    // Fallback to direct rendering
    return friend.profileData?.photos?.[0]
      ? { uri: friend.profileData.photos[0] }
      : require("../assets/photos/daniel.png");
  };

  // Get the previous, current, and next friends in the list
  const getPrevFriend = () => {
    if (!matchmakerFriends.length) return null;
    const prevIndex = currentFriendIndex === 0 ? matchmakerFriends.length - 1 : currentFriendIndex - 1;
    return prevIndex !== currentFriendIndex ? matchmakerFriends[prevIndex] : null;
  };

  const getNextFriend = () => {
    if (!matchmakerFriends.length) return null;
    const nextIndex = (currentFriendIndex + 1) % matchmakerFriends.length;
    return nextIndex !== currentFriendIndex ? matchmakerFriends[nextIndex] : null;
  };

  // Preload images effect
  useEffect(() => {
    if (matchmakerFriends.length > 0) {
      const imagesToPreload = {};
      matchmakerFriends.forEach(friend => {
        if (friend && friend.id) {
          const imageUri = friend.profileData?.photos?.[0] || null;
          if (imageUri) {
            imagesToPreload[friend.id] = imageUri;
          }
        }
      });
      setPreloadedImages(imagesToPreload);
    }
  }, [matchmakerFriends]);

  // Navigation focus effect
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (navigation.getState) {
        const routes = navigation.getState().routes;
        const currentRoute = routes[routes.length - 1];
        if (currentRoute.params?.friendsChanged) {
          updateMatchmakerFriends(user);
          navigation.setParams({ friendsChanged: false });
        }
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  // Update matchmaker friends when user changes
  useEffect(() => {
    updateMatchmakerFriends(user);
  }, [user?.friends]);

  // Load candidates when current friend changes
  useEffect(() => {
    if (
      currentUser &&
      matchmakerFriends.length > 0 &&
      currentFriendIndex < matchmakerFriends.length
    ) {
      const currentFriend = matchmakerFriends[currentFriendIndex];
      loadCandidatesForFriend(currentUser, currentFriend);
      setCurrentCandidateIndex(0);
    }
  }, [currentFriendIndex, matchmakerFriends]);

  // Load initial user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setCurrentUser(parsedUser);
          await updateMatchmakerFriends(parsedUser);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigation]);

  // Function to update matchmaker friends list
  const updateMatchmakerFriends = async (user) => {
    if (!user) {
      setMatchmakerFriends([]);
      return;
    }

    try {
      // Get friends that can be matchmakers from Firestore
      const friends = await getMatchmakerFriends(user);
      console.log(`Found ${friends.length} matchmaker friends`);
      setMatchmakerFriends(friends);

      // Only reset currentFriendIndex if the friends list has changed
      const prevFriends = prevFriendsRef.current;
      const prevIds = prevFriends.map((f) => f.id || f);
      const newIds = friends.map((f) => f.id || f);
      const listsAreEqual =
        prevIds.length === newIds.length &&
        prevIds.every((id, i) => id === newIds[i]);
      if (!listsAreEqual) {
        setCurrentFriendIndex(0);
      }
      prevFriendsRef.current = friends;

      // Load candidates for the first friend if needed
      if (friends.length > 0) {
        loadCandidatesForFriend(user, friends[0]);
      }
    } catch (error) {
      console.error("Error updating matchmaker friends:", error);
      setMatchmakerFriends([]);
    }
  };

  // Load candidates for a specific friend
  const loadCandidatesForFriend = async (user, friend) => {
    if (!user || !friend) {
      setCandidates([]);
      return;
    }

    try {
      // Get candidates for this friend based on their gender/sexuality
      if (typeof friend === "string") {
        // If only ID is provided, fetch the full friend record
        const friendId = friend;
        const candidates = await getCandidatesForFriend(user, friendId);
        setCandidates(candidates);
      } else {
        // If we already have the friend object
        const candidates = await getCandidatesForFriend(user, friend.id);
        setCandidates(candidates);
      }
    } catch (error) {
      console.error("Error loading candidates:", error);
      setCandidates([]);
    }
  };

  console.log("matchmakerFriends", matchmakerFriends.length);
  console.log("candidates", candidates.length);

  // Get current friend
  const currentFriend = matchmakerFriends[currentFriendIndex];

  // Get current candidate
  const currentCandidate = candidates[currentCandidateIndex];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#325475" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Please login to view matches</Text>
        <TouchableOpacity
          style={styles.seedButton}
          onPress={async () => {
            try {
              setLoading(true);
              const success = await seedFirestoreWithMockData();
              if (success) {
                Alert.alert(
                  "Success",
                  "Mock data has been seeded to Firestore"
                );
                // Reload user data after seeding
                const userData = await AsyncStorage.getItem("userData");
                if (userData) {
                  const parsedUser = JSON.parse(userData);
                  setCurrentUser(parsedUser);
                  await updateMatchmakerFriends(parsedUser);
                }
              } else {
                Alert.alert("Error", "Failed to seed mock data");
              }
            } catch (error) {
              console.error("Error seeding data:", error);
              Alert.alert("Error", "An error occurred while seeding data");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.seedButtonText}>Seed Test Data</Text>
        </TouchableOpacity>

        {/* Direct Mock Data Load Button */}
        <TouchableOpacity
          style={[
            styles.seedButton,
            { marginTop: 10, backgroundColor: "#4B5C6B" },
          ]}
          onPress={() =>
            loadMockUser(
              "user7",
              setLoading,
              setCurrentUser,
              setMatchmakerFriends,
              setCurrentFriendIndex,
              setCandidates,
              setCurrentCandidateIndex
            )
          }
        >
          <Text style={styles.seedButtonText}>Load Mock User7</Text>
        </TouchableOpacity>

        {/* Add a button to load user1 as well */}
        <TouchableOpacity
          style={[
            styles.seedButton,
            { marginTop: 10, backgroundColor: "#325475" },
          ]}
          onPress={() =>
            loadMockUser(
              "user1",
              setLoading,
              setCurrentUser,
              setMatchmakerFriends,
              setCurrentFriendIndex,
              setCandidates,
              setCurrentCandidateIndex
            )
          }
        >
          <Text style={styles.seedButtonText}>Load Mock User1</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentFriend) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>
          No friends available to match, go back to your profile and add friends
          to swipe
        </Text>
      </View>
    );
  }

  const handleCardPress = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate("CandidateProfile", {
        candidateInfo: currentCandidate,
      });
    }
  };

  const handlePreviousFriend = () => {
    if (matchmakerFriends.length > 0) {
      setCurrentFriendIndex((prev) =>
        prev === 0 ? matchmakerFriends.length - 1 : prev - 1
      );
      // Note: candidates will be loaded in the useEffect when currentFriendIndex changes
    }
  };

  const handleNextFriend = () => {
    if (matchmakerFriends.length > 0) {
      console.log("=== Next Friend Debug ===");
      console.log("Current friend index:", currentFriendIndex);
      console.log("Total friends:", matchmakerFriends.length);
      console.log(
        "Current friend:",
        matchmakerFriends[currentFriendIndex]?.name
      );

      setCurrentFriendIndex((prev) => {
        const nextIndex = prev === matchmakerFriends.length - 1 ? 0 : prev + 1;
        console.log("Setting new friend index to:", nextIndex);
        console.log("Next friend will be:", matchmakerFriends[nextIndex]?.name);
        return nextIndex;
      });
    }
  };

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

      // First, update the swiping pools
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

        // Update Firestore immediately
        await updateDoc(friendRef, {
          swipingPools: swipingPools,
        });
        console.log("Updated swipingPools in Firestore");
      } catch (error) {
        console.error("Error updating swipingPools:", error);
      }

      // Then handle the approval/rejection
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
      }

      // Mark current candidate as swiped in local state
      setSwipedCandidates((prev) => ({
        ...prev,
        [candidateId]: direction,
      }));

      // Remove the swiped candidate from the local candidates array
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));

      // If we have more candidates, move to the next one
      if (candidates.length > 1) {
        setCurrentCandidateIndex(0);
      } else {
        // If no more candidates, reload them
        await loadCandidatesForFriend(currentUser, currentFriend);
      }
    } catch (error) {
      console.error("Error handling swipe:", error);
      Alert.alert(
        "Error",
        "Failed to process swipe. Check console for details."
      );
    } finally {
      setSwipeLoading(false);
    }
  };

  const handlePreviousCandidate = async () => {
    await handleSwipe("left"); // Handle rejection
  };

  const handleNextCandidate = async () => {
    await handleSwipe("right"); // Handle approval
  };

  // Create a centralized function to load the mock data directly
  const loadMockUser = async (
    userIdToLoad,
    setLoading,
    setCurrentUser,
    setMatchmakerFriends,
    setCurrentFriendIndex,
    setCandidates,
    setCurrentCandidateIndex
  ) => {
    try {
      setLoading(true);

      console.log(`Directly loading ${userIdToLoad} from mock data`);

      // Get user from mock data
      const user = mockData.users.find((u) => u.id === userIdToLoad);
      if (!user) {
        console.error(`User ${userIdToLoad} not found in mock data`);
        Alert.alert("Error", `User ${userIdToLoad} not found in mock data`);
        setLoading(false);
        return;
      }

      console.log(`Found user: ${user.name} (${user.id})`);

      // Set as current user
      setCurrentUser(user);

      // Handle based on which user we're loading
      if (userIdToLoad === "user7") {
        // User7 has friends user6, user8, user9, user10
        // Let's use user6 as a friend with swipingPool
        const friends = ["user6", "user8", "user9", "user10"]
          .map((id) => mockData.users.find((u) => u.id === id))
          .filter((u) => u !== null);

        console.log(`Found ${friends.length} friends for ${user.name}`);
        setMatchmakerFriends(friends);
        setCurrentFriendIndex(0);

        // Get user6's swipingPool (which contains user1-user5)
        if (friends.length > 0) {
          const friend = friends[0]; // user6
          console.log(`Using ${friend.name} as matchmaker friend`);

          const poolUserIds = Object.keys(friend.swipingPool || {});
          console.log(`${friend.name}'s pool has user IDs:`, poolUserIds);

          const poolCandidates = poolUserIds
            .map((id) => mockData.users.find((u) => u.id === id))
            .filter((u) => u !== null);

          console.log(
            `Found ${poolCandidates.length} candidates in swipingPool`
          );
          setCandidates(poolCandidates);
          setCurrentCandidateIndex(0);
        }
      } else {
        // For other users, use their friends directly
        const friendIds = user.friends || [];
        console.log(`${user.name} has ${friendIds.length} friends:`, friendIds);

        const friends = friendIds
          .map((id) => {
            // Handle either string ID or object with ID
            const friendId = typeof id === "string" ? id : id.id;
            return mockData.users.find((u) => u.id === friendId);
          })
          .filter((u) => u !== null);

        console.log(`Found ${friends.length} friend objects`);
        setMatchmakerFriends(friends);
        setCurrentFriendIndex(0);

        // If a friend has a swipingPool, use that
        if (friends.length > 0) {
          const firstFriend = friends[0];
          const poolUserIds = Object.keys(firstFriend.swipingPool || {});

          if (poolUserIds.length > 0) {
            console.log(
              `Using ${firstFriend.name}'s swipingPool with ${poolUserIds.length} candidates`
            );

            const poolCandidates = poolUserIds
              .map((id) => mockData.users.find((u) => u.id === id))
              .filter((u) => u !== null);

            setCandidates(poolCandidates);
            setCurrentCandidateIndex(0);
          } else {
            console.log(
              `${firstFriend.name} has no swipingPool, using gender/sexuality matching`
            );
            // Just use all available users of appropriate gender
            const allUsers = mockData.users.filter(
              (u) => u.id !== user.id && u.id !== firstFriend.id
            );
            setCandidates(allUsers);
            setCurrentCandidateIndex(0);
          }
        }
      }

      Alert.alert("Success", `Loaded ${user.name} from mock data`);
    } catch (error) {
      console.error("Error loading mock data directly:", error);
      Alert.alert("Error", "Failed to load mock data directly");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>You are vouching for</Text>
      </View>
      <View style={styles.header}>
        {/* Friend name display - separate from the carousel */}
        {currentFriend && (
          <Text style={styles.currentFriendName}>
            {currentFriend.name}
          </Text>
        )}
      </View>

      {/* Friend Selector with Fixed Layout */}
      <View style={styles.newFriendSelector}>
        {/* Left (previous) friend */}
        <TouchableOpacity 
          style={styles.sideFriendContainer} 
          onPress={handlePreviousFriend}
          disabled={friendSelectorLocked}
          activeOpacity={0.7}
        >
          {getPrevFriend() && (
            <>
              <Image
                source={getImageSource(getPrevFriend())}
                style={styles.sideFriendImage}
                blurRadius={5}
              />
              <View style={[styles.sideOverlay, styles.leftOverlay]} />
            </>
          )}
        </TouchableOpacity>

        {/* Current friend (center) */}
        <View style={styles.currentFriendContainer}>
          {currentFriend && (
            <Image
              source={getImageSource(currentFriend)}
              style={styles.currentFriendImage}
            />
          )}
        </View>

        {/* Right (next) friend */}
        <TouchableOpacity 
          style={styles.sideFriendContainer} 
          onPress={handleNextFriend}
          disabled={friendSelectorLocked}
          activeOpacity={0.7}
        >
          {getNextFriend() && (
            <>
              <Image
                source={getImageSource(getNextFriend())}
                style={styles.sideFriendImage}
                blurRadius={5}
              />
              <View style={[styles.sideOverlay, styles.rightOverlay]} />
            </>
          )}
        </TouchableOpacity>

        {/* Lock/Unlock Button */}
        <TouchableOpacity
          style={styles.lockButton}
          onPress={() => setFriendSelectorLocked(!friendSelectorLocked)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={friendSelectorLocked ? "lock-closed" : "lock-open"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Hidden preloaded images for all potential friends */}
      <View style={{position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden'}}>
        {matchmakerFriends.map((friend, index) => 
          friend ? (
            <Image 
              key={`preload-friend-${friend.id}`}
              source={getImageSource(friend)}
              style={{width: 1, height: 1}}
            />
          ) : null
        )}
      </View>

      {/* Candidate Card */}
      <View style={styles.candidateCardContainer}>
        {currentCandidate ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCardPress}
            disabled={swipeLoading}
          >
            <Image
              source={getImageSource(currentCandidate)}
              style={styles.candidateImage}
            />
            <BlurView intensity={0} tint="default" style={styles.candidateOverlay}>
              <Text style={styles.candidateName}>{currentCandidate.name}</Text>
              <Text style={styles.candidateDetails}>
                {currentCandidate.profileData?.age} - {currentCandidate.profileData?.year}
              </Text>
            </BlurView>
          </TouchableOpacity>
        ) : (
          <View style={styles.noCandidateContainer}>
            <Text style={styles.noCandidateText}>
              No more candidates left to swipe, check back later
            </Text>
          </View>
        )}
      </View>

      {/* Approve/Reject Buttons at Bottom */}
      <View style={styles.bottomButtonRow}>
        <TouchableOpacity
          style={styles.dislikeButton}
          onPress={handlePreviousCandidate}
          disabled={swipeLoading || !currentCandidate}
        >
          <Ionicons name="close" size={40} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={handleNextCandidate}
          disabled={swipeLoading || !currentCandidate}
        >
          <Ionicons name="heart" size={40} color="#fff" />
        </TouchableOpacity>
      </View>

      {!hasAccess && <LockedScreen userType={userType} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: height * 0.05,
    paddingHorizontal: width * 0.05,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    // marginBottom: height * 0.005,
  },
  title: {
    fontSize: width * 0.1,
    fontWeight: "bold",
    color: "#4B5C6B",
    paddingTop: height * 0.02,
  },
  temp: {
    height: height * 0.13,
    width: width * 0.22,
    backgroundColor: "black",
  },
  friendSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friendText: {
    textAlign: "center",
    fontSize: width * 0.035,
    color: "#325475",
  },
  friendInfo: {
    width: width * 0.35,
    height: height * 0.22,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    alignItems: "center",
    marginTop: height * 0.01,
  },
  card: {
    width: width * 0.7,
    height: width * 0.6,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: height * 0.01,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    width: width * 0.7,
    height: width * 0.6,
    borderRadius: 10,
    resizeMode: "cover",
  },
  cardText: {
    fontSize: width * 0.045,
    marginTop: height * 0.01,
    fontWeight: "bold",
    color: "#325475",
  },
  approvalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: width * 0.025,
  },
  disapprove: {
    color: "#F7C4A5",
    fontSize: width * 0.035,
    fontWeight: "600",
    flex: 1,
  },
  approve: {
    color: "#4B5C6B",
    flex: 1,
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: height * 0.025,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#F7C4A5",
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
    justifyContent: "center",
    alignItems: "center",
  },
  reverseButton: {
    backgroundColor: "#A9B9CC",
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#A9B9CC",
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: width * 0.06,
    color: "white",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#325475",
    textAlign: "center",
  },
  friendName: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: "#325475",
    marginTop: 5,
  },
  friendSubtext: {
    fontSize: width * 0.035,
    color: "#325475",
    marginTop: 2,
  },
  seedButton: {
    marginTop: 20,
    backgroundColor: "#ED7E31",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  seedButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  debugButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  debugButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  debugButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  explanationText: {
    fontSize: width * 0.04,
    color: "#325475",
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    lineHeight: width * 0.05,
  },
  orDivider: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#325475",
    textAlign: "center",
    marginVertical: 15,
  },
  secondaryButtonsContainer: {
    marginTop: 15,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
  },
  newFriendSelector: {
    flexDirection: 'row',
    height: height * 0.22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.03,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  sideFriendContainer: {
    width: width * 0.22,
    height: height * 0.15,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  sideFriendImage: {
    width: width * 0.22,
    height: width * 0.22,
    borderRadius: width * 0.11,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  sideOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: '100%',
    borderRadius: width * 0.11,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  leftOverlay: {
    left: 0,
    right: 0,
  },
  rightOverlay: {
    left: 0,
    right: 0,
  },
  currentFriendContainer: {
    width: width * 0.35,
    height: height * 0.2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    marginHorizontal: width * 0.03,
  },
  currentFriendImage: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    resizeMode: "cover",
    // borderWidth: 0.5,
    borderColor: "#4B5C6B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  lockButton: {
    position: "absolute",
    bottom: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ED7E31",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    borderColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 3,
  },
  currentFriendName: {
    fontSize: width * 0.07,
    fontWeight: "bold",
    color: "#4B5C6B",
    marginTop: 5,
    marginBottom: 0,
  },
  headerTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  candidateCardContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  candidateImage: {
    width: width,
    height: width * 0.8,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  candidateOverlay: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
    minWidth: 120,
    // backgroundColor: "#F7C4A5",
  },
  candidateName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    textShadowColor: '#ED7E31',
    textShadowOffset: { width: -2, height: 0},
    textShadowRadius: 2,
    paddingLeft: 3
  },
  candidateDetails: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: '#ED7E31',
    textShadowOffset: {width: -2, height: 0},
    textShadowRadius: 2,
    paddingLeft: 3
  },
  noCandidateContainer: {
    width: width,
    height: width * 0.8,
    borderRadius: 20,
    backgroundColor: 'rgba(227, 171, 140, 0.5)',
    justifyContent: "center",
    // alignItems: 'center',

  },
  noCandidateText: {
    color: '#fff',
    textShadowOffset: {width: -2, height: 0},
    textShadowRadius: 2,
    textShadowColor: '#ED7E31',
    fontSize: 20,
    fontWeight: "900",
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    // position: 'absolute',
    // bottom: 30,
    // left: 0,
    // right: 0,
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 10,
    // paddingHorizontal: 40,
  },
  dislikeButton: {
    backgroundColor: '#F7C4A5',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 3,
  },
  likeButton: {
    backgroundColor: '#A9B9CC',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 3,
  },
});
