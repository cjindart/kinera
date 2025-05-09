import React, { useState, useEffect } from "react";
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
import { 
  fetchAllUsers, 
  getMatchmakerFriends, 
  getCandidatesForFriend,
  getPotentialMatches,
  seedFirestoreWithMockData,
  fetchUserById
} from "../services/userService";
import { isDevelopmentMode } from "../utils/firebase";
import mockData from "../assets/mockUserData.json";

const { width, height } = Dimensions.get("window");

export default function AvailabilityScreen() {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchmakerFriends, setMatchmakerFriends] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [swipedCandidates, setSwipedCandidates] = useState({});

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
      
      // Reset current indices
      setCurrentFriendIndex(0);
      setCurrentCandidateIndex(0);
      
      // Load candidates for the first friend
      if (friends.length > 0) {
        loadCandidatesForFriend(user, friends[0]);
      }
    } catch (error) {
      console.error('Error updating matchmaker friends:', error);
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
      if (typeof friend === 'string') {
        // If only ID is provided, fetch the full friend record
        const friendId = friend;
        const candidates = await getCandidatesForFriend(user, friendId);
        setCandidates(candidates);
      } else {
        // If we already have the friend object
        const candidates = await getCandidatesForFriend(user, friend.id);
        setCandidates(candidates);
      }
      
      // Reset candidate index when loading new candidates
      setCurrentCandidateIndex(0);
    } catch (error) {
      console.error('Error loading candidates:', error);
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
          if (parsedUser && parsedUser.friends && parsedUser.friends.length > 0) {
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
              "Isabella Wang": "user10"
            };
            
            // Extract friend names
            const friendNames = parsedUser.friends.map(f => f.name);
            console.log("Friend names:", friendNames);
            
            // Find matching mock users
            const matchedFriends = [];
            for (const friend of parsedUser.friends) {
              const mockUserId = friendNameMap[friend.name];
              if (mockUserId) {
                const mockUser = mockData.users.find(u => u.id === mockUserId);
                if (mockUser) {
                  console.log(`Matched friend ${friend.name} to mock user ${mockUserId}`);
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
              console.log(`Pool has ${poolUserIds.length} user IDs:`, poolUserIds);
              
              // Get the candidate user objects
              const poolCandidates = poolUserIds
                .map(id => mockData.users.find(u => u.id === id))
                .filter(u => u !== null);
              
              console.log(`Found ${poolCandidates.length} pool candidates`);
              setCandidates(poolCandidates);
              setCurrentCandidateIndex(0);
              
              console.log("Successfully matched friends by name and loaded candidates automatically");
            } else {
              // If we couldn't match any friends, fall back to the original method
              console.log("No matched friends found, falling back to regular matchmaker friends");
              await updateMatchmakerFriends(parsedUser);
            }
          } else {
            // Fall back to the original method if no friends
            console.log("No friends found, falling back to regular matchmaker friends");
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

    // This listener will trigger whenever you return to the Home screen
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  // When current friend changes, load candidates for that friend
  useEffect(() => {
    if (currentUser && matchmakerFriends.length > 0 && currentFriendIndex < matchmakerFriends.length) {
      const currentFriend = matchmakerFriends[currentFriendIndex];
      loadCandidatesForFriend(currentUser, currentFriend);
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
                Alert.alert("Success", "Mock data has been seeded to Firestore");
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
          style={[styles.seedButton, { marginTop: 10, backgroundColor: '#4B5C6B' }]}
          onPress={() => loadMockUser("user7", setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex)}
        >
          <Text style={styles.seedButtonText}>Load Mock User7</Text>
        </TouchableOpacity>
        
        {/* Add a button to load user1 as well */}
        <TouchableOpacity
          style={[styles.seedButton, { marginTop: 10, backgroundColor: '#325475' }]}
          onPress={() => loadMockUser("user1", setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex)}
        >
          <Text style={styles.seedButtonText}>Load Mock User1</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!currentFriend) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>No friends available to match</Text>
        
        {/* Make "Match Friends By Name" the most prominent button */}
        <Text style={styles.explanationText}>
          The "Match Friends By Name" feature connects friends in your profile with mock data in our system.
        </Text>
        
        <TouchableOpacity
          style={[styles.seedButton, { backgroundColor: '#325475', marginBottom: 20, paddingVertical: 15 }]}
          onPress={async () => {
            try {
              setLoading(true);
              
              // Check if user has friends
              if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
                Alert.alert("Error", "You don't have any friends to match with. Add friends in your profile first.");
                setLoading(false);
                return;
              }
              
              // Log the user's friends
              console.log(`User has ${currentUser.friends.length} friends:`);
              currentUser.friends.forEach((friend, index) => {
                console.log(`Friend ${index}: ${friend.name} (ID: ${friend.id})`);
              });
              
              // Match friends by name with the mock data
              const friendNameMap = {
                "Emily Chen": "user7",
                "Ryan Patel": "user5",
                "Sarah Johnson": "user6",
                "Sophia Martinez": "user8", 
                "Olivia Kim": "user9",
                "Isabella Wang": "user10"
              };
              
              // Extract friend names
              const friendNames = currentUser.friends.map(f => f.name);
              console.log("Friend names:", friendNames);
              
              // Find matching mock users
              const matchedFriends = [];
              for (const friend of currentUser.friends) {
                const mockUserId = friendNameMap[friend.name];
                if (mockUserId) {
                  const mockUser = mockData.users.find(u => u.id === mockUserId);
                  if (mockUser) {
                    console.log(`Matched friend ${friend.name} to mock user ${mockUserId}`);
                    matchedFriends.push(mockUser);
                  }
                }
              }
              
              console.log(`Found ${matchedFriends.length} matching mock users`);
              
              if (matchedFriends.length === 0) {
                Alert.alert("Error", "Couldn't match your friends to the mock data. Try adding Emily Chen, Ryan Patel, Sarah Johnson, Sophia Martinez, Olivia Kim, or Isabella Wang as friends.");
                setLoading(false);
                return;
              }
              
              // Set the matched friends as matchmaker friends
              setMatchmakerFriends(matchedFriends);
              setCurrentFriendIndex(0);
              
              // Get the first friend's swiping pool
              const firstFriend = matchedFriends[0];
              console.log(`Loading swiping pool for ${firstFriend.name}`);
              
              // Extract pool user IDs from swipingPool
              const poolUserIds = Object.keys(firstFriend.swipingPool || {});
              console.log(`Pool has ${poolUserIds.length} user IDs:`, poolUserIds);
              
              // Get the candidate user objects
              const poolCandidates = poolUserIds
                .map(id => mockData.users.find(u => u.id === id))
                .filter(u => u !== null);
              
              console.log(`Found ${poolCandidates.length} pool candidates`);
              setCandidates(poolCandidates);
              setCurrentCandidateIndex(0);
              
              Alert.alert("Success", `Matched your friends by name and loaded ${poolCandidates.length} candidates`);
            } catch (error) {
              console.error("Error matching friends by name:", error);
              Alert.alert("Error", "Failed to match friends by name");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={[styles.seedButtonText, {fontSize: 18}]}>Match Friends By Name</Text>
        </TouchableOpacity>
        
        <Text style={styles.orDivider}>or</Text>
        
        <Text style={styles.explanationText}>
          Add "Emily Chen", "Ryan Patel", or other names from our sample data as friends in your profile.
        </Text>
        
        {/* Move the other buttons below with less prominence */}
        <View style={styles.secondaryButtonsContainer}>
          <TouchableOpacity
            style={[styles.seedButton, { marginTop: 10, backgroundColor: '#A9B7C5' }]}
            onPress={async () => {
              try {
                setLoading(true);
                const success = await seedFirestoreWithMockData();
                if (success) {
                  Alert.alert("Success", "Mock data has been seeded to Firestore");
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
            style={[styles.seedButton, { marginTop: 10, backgroundColor: '#4B5C6B' }]}
            onPress={() => loadMockUser("user7", setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex)}
          >
            <Text style={styles.seedButtonText}>Load Mock User7</Text>
          </TouchableOpacity>
          
          {/* Add a button to load user1 as well */}
          <TouchableOpacity
            style={[styles.seedButton, { marginTop: 10, backgroundColor: '#4B5C6B' }]}
            onPress={() => loadMockUser("user1", setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex)}
          >
            <Text style={styles.seedButtonText}>Load Mock User1</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (!currentCandidate) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>No candidates available</Text>
        
        {/* Special button to match friends by name instead of ID */}
        <TouchableOpacity
          style={[styles.seedButton, { backgroundColor: '#FF8C00' }]}
          onPress={async () => {
            try {
              setLoading(true);
              
              // Check if user has friends
              if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
                Alert.alert("Error", "You don't have any friends to match with");
                setLoading(false);
                return;
              }
              
              // Log the user's friends
              console.log(`User has ${currentUser.friends.length} friends:`);
              currentUser.friends.forEach((friend, index) => {
                console.log(`Friend ${index}: ${friend.name} (ID: ${friend.id})`);
              });
              
              // Match friends by name with the mock data
              const friendNameMap = {
                "Emily Chen": "user7",
                "Ryan Patel": "user5",
                "Sarah Johnson": "user6",
                "Sophia Martinez": "user8", 
                "Olivia Kim": "user9",
                "Isabella Wang": "user10"
              };
              
              // Extract friend names
              const friendNames = currentUser.friends.map(f => f.name);
              console.log("Friend names:", friendNames);
              
              // Find matching mock users
              const matchedFriends = [];
              for (const friend of currentUser.friends) {
                const mockUserId = friendNameMap[friend.name];
                if (mockUserId) {
                  const mockUser = mockData.users.find(u => u.id === mockUserId);
                  if (mockUser) {
                    console.log(`Matched friend ${friend.name} to mock user ${mockUserId}`);
                    matchedFriends.push(mockUser);
                  }
                }
              }
              
              console.log(`Found ${matchedFriends.length} matching mock users`);
              
              if (matchedFriends.length === 0) {
                Alert.alert("Error", "Couldn't match your friends to the mock data");
                setLoading(false);
                return;
              }
              
              // Set the matched friends as matchmaker friends
              setMatchmakerFriends(matchedFriends);
              setCurrentFriendIndex(0);
              
              // Get the first friend's swiping pool
              const firstFriend = matchedFriends[0];
              console.log(`Loading swiping pool for ${firstFriend.name}`);
              
              // Extract pool user IDs from swipingPool
              const poolUserIds = Object.keys(firstFriend.swipingPool || {});
              console.log(`Pool has ${poolUserIds.length} user IDs:`, poolUserIds);
              
              // Get the candidate user objects
              const poolCandidates = poolUserIds
                .map(id => mockData.users.find(u => u.id === id))
                .filter(u => u !== null);
              
              console.log(`Found ${poolCandidates.length} pool candidates`);
              setCandidates(poolCandidates);
              setCurrentCandidateIndex(0);
              
              Alert.alert("Success", `Matched your friends by name and loaded ${poolCandidates.length} candidates`);
            } catch (error) {
              console.error("Error matching friends by name:", error);
              Alert.alert("Error", "Failed to match friends by name");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.seedButtonText}>Match Friends By Name</Text>
        </TouchableOpacity>
        
        {/* Other buttons... */}
        <TouchableOpacity
          style={[styles.seedButton, { marginTop: 10 }]}
          onPress={async () => {
            try {
              setLoading(true);
              const success = await seedFirestoreWithMockData();
              if (success) {
                Alert.alert("Success", "Mock data has been seeded to Firestore");
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
        
        {/* Direct Mock Data Load buttons */}
        <TouchableOpacity
          style={[styles.seedButton, { marginTop: 10, backgroundColor: '#4B5C6B' }]}
          onPress={() => loadMockUser("user7", setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex)}
        >
          <Text style={styles.seedButtonText}>Load Mock User7</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.seedButton, { marginTop: 10, backgroundColor: '#325475' }]}
          onPress={() => loadMockUser("user1", setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex)}
        >
          <Text style={styles.seedButtonText}>Load Mock User1</Text>
        </TouchableOpacity>
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
      setCurrentFriendIndex((prev) =>
        prev === matchmakerFriends.length - 1 ? 0 : prev + 1
      );
      // Note: candidates will be loaded in the useEffect when currentFriendIndex changes
    }
  };

  const handleSwipe = (direction) => {
    if (candidates.length > 0) {
      // Mark current candidate as swiped
      const candidateId = currentCandidate.id;
      setSwipedCandidates((prev) => ({
        ...prev,
        [candidateId]: direction,
      }));

      // Move to next candidate if available
      if (currentCandidateIndex < candidates.length - 1) {
        setCurrentCandidateIndex(currentCandidateIndex + 1);
      } else {
        // We've reached the end of candidates, cycle back to the first one
        // Or could show a message that all candidates have been viewed
        setCurrentCandidateIndex(0);
      }
    }
  };

  const handlePreviousCandidate = async () => {
    handleSwipe('left'); // Handle rejection
  };

  const handleNextCandidate = async () => {
    handleSwipe('right'); // Handle approval
  };

  const handleReverseSwipe = () => {
    if (candidates.length > 0 && currentCandidateIndex > 0) {
      // Go back to the previous candidate
      setCurrentCandidateIndex(currentCandidateIndex - 1);
    } else if (candidates.length > 0) {
      // Go to the last candidate if at the first one
      setCurrentCandidateIndex(candidates.length - 1);
    }
  };

  // Create a centralized function to load the mock data directly
  const loadMockUser = async (userIdToLoad, setLoading, setCurrentUser, setMatchmakerFriends, setCurrentFriendIndex, setCandidates, setCurrentCandidateIndex) => {
    try {
      setLoading(true);
      
      console.log(`Directly loading ${userIdToLoad} from mock data`);
      
      // Get user from mock data
      const user = mockData.users.find(u => u.id === userIdToLoad);
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
          .map(id => mockData.users.find(u => u.id === id))
          .filter(u => u !== null);
        
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
            .map(id => mockData.users.find(u => u.id === id))
            .filter(u => u !== null);
          
          console.log(`Found ${poolCandidates.length} candidates in swipingPool`);
          setCandidates(poolCandidates);
          setCurrentCandidateIndex(0);
        }
      } else {
        // For other users, use their friends directly
        const friendIds = user.friends || [];
        console.log(`${user.name} has ${friendIds.length} friends:`, friendIds);
        
        const friends = friendIds
          .map(id => {
            // Handle either string ID or object with ID
            const friendId = typeof id === 'string' ? id : id.id;
            return mockData.users.find(u => u.id === friendId);
          })
          .filter(u => u !== null);
        
        console.log(`Found ${friends.length} friend objects`);
        setMatchmakerFriends(friends);
        setCurrentFriendIndex(0);
        
        // If a friend has a swipingPool, use that
        if (friends.length > 0) {
          const firstFriend = friends[0];
          const poolUserIds = Object.keys(firstFriend.swipingPool || {});
          
          if (poolUserIds.length > 0) {
            console.log(`Using ${firstFriend.name}'s swipingPool with ${poolUserIds.length} candidates`);
            
            const poolCandidates = poolUserIds
              .map(id => mockData.users.find(u => u.id === id))
              .filter(u => u !== null);
            
            setCandidates(poolCandidates);
            setCurrentCandidateIndex(0);
          } else {
            console.log(`${firstFriend.name} has no swipingPool, using gender/sexuality matching`);
            // Just use all available users of appropriate gender
            const allUsers = mockData.users.filter(u => u.id !== user.id && u.id !== firstFriend.id);
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
        {/* Debug button */}
        <TouchableOpacity
          style={styles.debugButton}
          onPress={async () => {
            try {
              // Show current user details
              Alert.alert(
                "Current User", 
                `User: ${currentUser?.name} (${currentUser?.id})\n` +
                `Friends: ${currentUser?.friends?.length || 0}\n` +
                `userType: ${currentUser?.userType}`
              );
              
              // Try to load friends directly using the current user
              if (currentUser) {
                const userFromFirestore = await fetchUserById(currentUser.id);
                console.log("User from Firestore:", userFromFirestore);
                
                if (userFromFirestore) {
                  // Update the user in memory to sync with Firestore
                  setCurrentUser(userFromFirestore);
                  
                  // Reload friends with the updated user data
                  await updateMatchmakerFriends(userFromFirestore);
                }
              }
            } catch (error) {
              console.error("Debug error:", error);
            }
          }}
        >
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
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
      >
        <View style={styles.card}>
          <Image
            source={
              currentCandidate.profileData?.photos?.[0]
                ? { uri: currentCandidate.profileData.photos[0] }
                : require("../assets/photos/image.png")
            }
            style={styles.cardImage}
          />
        </View>
        <Text style={styles.cardText}>
          {currentCandidate.name} {"\n"}
          {currentCandidate.profileData?.age} •{" "}
          {currentCandidate.profileData?.year}
          {"\n"}
          {currentCandidate.profileData?.city}
        </Text>
      </TouchableOpacity>

      {/* Approve/Reject/Reverse Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={handlePreviousCandidate}
        >
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reverseButton}
          onPress={handleReverseSwipe}
        >
          <Text style={styles.buttonText}>↺</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleNextCandidate}
        >
          <Text style={styles.buttonText}>✓</Text>
        </TouchableOpacity>
      </View>
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
    width: width * 0.6,
    height: width * 0.7,
    borderRadius: 10,
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
  debugButton: {
    marginTop: 10,
    backgroundColor: "#ED7E31",
    paddingHorizontal: 20,
    paddingVertical: 10,
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
