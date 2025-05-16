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
  const { user } = useAuth();
  const userType = user?.userType || "";
  const hasAccess = hasAccessToScreen(userType, "Home");
  const prevFriendsRef = useRef([]);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (navigation.getState) {
        // Get the current route
        const routes = navigation.getState().routes;
        const currentRoute = routes[routes.length - 1];
        if (currentRoute.params?.friendsChanged) {
          updateMatchmakerFriends(user);
          // Reset the flag so it doesn't reload every time
          navigation.setParams({ friendsChanged: false });
        }
      }
    });
    return unsubscribe;
  }, [navigation, user]);
  useEffect(() => {
    updateMatchmakerFriends(user);
  }, [user?.friends]);
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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);

        // Load user data from AsyncStorage
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setCurrentUser(parsedUser);

          // Automatically call the "Match Friends By Name" functionality
          if (
            parsedUser &&
            parsedUser.friends &&
            parsedUser.friends.length > 0
          ) {
            console.log(`User has ${parsedUser.friends.length} friends:`);
            parsedUser.friends.forEach((friend, index) => {
              console.log(`Friend ${index}: ${friend.name} (ID: ${friend.id})`);
            });

            // Match friends by name with the mock data
            const friendNameMap = {
              "Emily Chen": "user7",
              "Ryan Patel": "user5",
              "Sarah Johnson": "user6",
              "Sophia Martinez": "user8",
              "Olivia Kim": "user9",
              "Isabella Wang": "user10",
            };

            // Extract friend names
            const friendNames = parsedUser.friends.map((f) => f.name);
            console.log("Friend names:", friendNames);

            // Find matching mock users
            const matchedFriends = [];
            for (const friend of parsedUser.friends) {
              const mockUserId = friendNameMap[friend.name];
              if (mockUserId) {
                const mockUser = mockData.users.find(
                  (u) => u.id === mockUserId
                );
                if (mockUser) {
                  console.log(
                    `Matched friend ${friend.name} to mock user ${mockUserId}`
                  );
                  matchedFriends.push(mockUser);
                }
              }
            }

            console.log(`Found ${matchedFriends.length} matching mock users`);

            if (matchedFriends.length > 0) {
              // Set the matched friends as matchmaker friends
              setMatchmakerFriends(matchedFriends);
              setCurrentFriendIndex(0);

              // Get the first friend's swiping pool
              const firstFriend = matchedFriends[0];
              console.log(`Loading swiping pool for ${firstFriend.name}`);

              // Extract pool user IDs from swipingPool
              const poolUserIds = Object.keys(firstFriend.swipingPool || {});
              console.log(
                `Pool has ${poolUserIds.length} user IDs:`,
                poolUserIds
              );

              // Get the candidate user objects
              const poolCandidates = poolUserIds
                .map((id) => mockData.users.find((u) => u.id === id))
                .filter((u) => u !== null);

              console.log(`Found ${poolCandidates.length} pool candidates`);
              setCandidates(poolCandidates);
              setCurrentCandidateIndex(0);

              console.log(
                "Successfully matched friends by name and loaded candidates automatically"
              );
            } else {
              // If we couldn't match any friends, fall back to the original method
              console.log(
                "No matched friends found, falling back to regular matchmaker friends"
              );
              await updateMatchmakerFriends(parsedUser);
            }
          } else {
            // Fall back to the original method if no friends
            console.log(
              "No friends found, falling back to regular matchmaker friends"
            );
            await updateMatchmakerFriends(parsedUser);
          }
        } else {
          console.log("No user data found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Try to continue with the fallback method
        try {
          if (currentUser) {
            await updateMatchmakerFriends(currentUser);
          }
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigation]);

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener("focus", () => {
  //     if (user) {
  //       updateMatchmakerFriends(user);
  //     }
  //   });
  //   return unsubscribe;
  // }, [navigation, user]);

  // When current friend changes, load candidates for that friend
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
        const updatedCandidate = allUsers.find(
          (user) => user.id === candidateId
        );

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

        // Update swipedPool
        const currentSwipedPool = friendData.swipedPool || [];
        let newSwipedPool = currentSwipedPool;
        if (!currentSwipedPool.includes(candidateId)) {
          newSwipedPool = [...currentSwipedPool, candidateId];
        }

        // Update swipingPools for this matchmaker
        let swipingPools = friendData.swipingPools || {};
        let pool = swipingPools[currentUser.id] || [];
        pool = pool.filter((id) => id !== candidateId);
        swipingPools[currentUser.id] = pool;

        await updateDoc(friendRef, {
          swipedPool: newSwipedPool,
          swipingPools: swipingPools,
        });
      } catch (error) {
        console.error("Error updating swipedPool and swipingPools:", error);
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

  // const handleReverseSwipe = () => {
  //   if (candidates.length > 0 && currentCandidateIndex > 0) {
  //     // Go back to the previous candidate
  //     setCurrentCandidateIndex(currentCandidateIndex - 1);
  //   } else if (candidates.length > 0) {
  //     // Go to the last candidate if at the first one
  //     setCurrentCandidateIndex(candidates.length - 1);
  //   }
  // };

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
      <View style={styles.header}>
        <Text style={styles.title}>Set Up</Text>
        <Text>You're Swiping for:</Text>
        {/* Debug buttons */}
        <View style={styles.debugButtonsContainer}>
          <TouchableOpacity
            style={[styles.debugButton, { backgroundColor: "#325475" }]}
            onPress={() => {
              if (currentFriend && currentCandidate) {
                Alert.alert(
                  "Current Match State",
                  `Friend: ${currentFriend.name}\n` +
                    `Friend Matches: ${JSON.stringify(
                      currentFriend.matches || {},
                      null,
                      2
                    )}\n\n` +
                    `Candidate: ${currentCandidate.name}\n` +
                    `Candidate Matches: ${JSON.stringify(
                      currentCandidate.matches || {},
                      null,
                      2
                    )}`
                );
              }
            }}
          >
            <Text style={styles.debugButtonText}>Debug Match</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Friend Selector */}
      <View style={styles.friendSelector}>
        <TouchableOpacity onPress={handlePreviousFriend}>
          <Ionicons name="chevron-back" size={40} color="#325475" />
          <Text style={styles.friendText}>Previous{"\n"}friend</Text>
        </TouchableOpacity>

        <View style={styles.friendInfo}>
          <Image
            source={
              currentFriend.profileData?.photos?.[0]
                ? { uri: currentFriend.profileData.photos[0] }
                : require("../assets/photos/daniel.png")
            }
            style={styles.temp}
          />
          <Text style={styles.friendName}>{currentFriend.name}</Text>
          <Text style={styles.friendSubtext}>
            {currentFriend.profileData?.year} •{" "}
            {currentFriend.profileData?.gender}
          </Text>
        </View>

        <TouchableOpacity onPress={handleNextFriend}>
          <Ionicons name="chevron-forward" size={40} color="#325475" />
          <Text style={styles.friendText}>Next{"\n"}friend</Text>
        </TouchableOpacity>
      </View>

      {/* Candidate Card */}
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={handleCardPress}
        activeOpacity={0.7}
        disabled={swipeLoading || !currentCandidate}
      >
        <View style={styles.card}>
          {swipeLoading ? (
            <ActivityIndicator
              size="large"
              color="#325475"
              style={{ flex: 1 }}
            />
          ) : currentCandidate ? (
            <Image
              source={
                currentCandidate.profileData?.photos?.[0]
                  ? { uri: currentCandidate.profileData.photos[0] }
                  : require("../assets/photos/image.png")
              }
              style={styles.cardImage}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#325475",
                  fontSize: 18,
                  textAlign: "center",
                  marginHorizontal: 20,
                }}
              >
                No more candidates left to swipe, check back later
              </Text>
            </View>
          )}
        </View>
        {!swipeLoading && currentCandidate && (
          <Text style={styles.cardText}>
            {currentCandidate.name} {"\n"}
            {currentCandidate.profileData?.age} •{" "}
            {currentCandidate.profileData?.year}
            {"\n"}
            {currentCandidate.profileData?.city}
          </Text>
        )}
      </TouchableOpacity>

      {/* Approve/Reject/Reverse Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={handlePreviousCandidate}
          disabled={swipeLoading || !currentCandidate}
        >
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.reverseButton}
          onPress={handle
          Swipe}
          disabled={swipeLoading || !currentCandidate}
        >
          <Text style={styles.buttonText}>↺</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleNextCandidate}
          disabled={swipeLoading || !currentCandidate}
        >
          <Text style={styles.buttonText}>✓</Text>
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
});
