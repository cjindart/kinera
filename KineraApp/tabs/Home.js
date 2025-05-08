import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "../assets/theme";
import mockData from "../assets/mockUserData.json";

const { width, height } = Dimensions.get("window");

export default function AvailabilityScreen() {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchmakerFriends, setMatchmakerFriends] = useState([]);
  const [swipedCandidates, setSwipedCandidates] = useState({});

  // Function to update matchmaker friends list
  const updateMatchmakerFriends = (user) => {
    if (user?.friends) {
      const filteredFriends = mockData.users.filter(
        (mockUser) =>
          user.friends.includes(mockUser.id) && mockUser.userType !== "Dater" // Only include non-daters
      );
      setMatchmakerFriends(filteredFriends);
    } else {
      setMatchmakerFriends([]);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setCurrentUser(parsedUser);
          updateMatchmakerFriends(parsedUser);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
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

  //console.log("currentUser", currentUser);
  console.log("matchmakerFriends", matchmakerFriends);
  // Get current friend from the filtered list
  const currentFriend = matchmakerFriends[currentFriendIndex];

  // Get candidates from current friend's swiping pool
  const candidates = currentFriend?.swipingPool
    ? Object.keys(currentFriend.swipingPool).map((userId) =>
        mockData.users.find((user) => user.id === userId)
      )
    : [];

  // Get current candidate
  const currentCandidate = candidates[currentCandidateIndex];
  // console.log("Current candidate index:", currentCandidateIndex);
  // console.log("Total candidates:", candidates.length);
  // console.log("Current candidate:", currentCandidate);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#325475" />
      </View>
    );
  }

  if (!currentUser || !currentFriend || !currentCandidate) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>No candidates available</Text>
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
      setCurrentCandidateIndex(0); // Reset candidate index when changing friends
    }
  };

  const handleNextFriend = () => {
    if (matchmakerFriends.length > 0) {
      setCurrentFriendIndex((prev) =>
        prev === matchmakerFriends.length - 1 ? 0 : prev + 1
      );
      setCurrentCandidateIndex(0); // Reset candidate index when changing friends
    }
  };

  const handleSwipe = (direction) => {
    if (candidates.length > 0) {
      // Mark current candidate as swiped
      const candidateId = currentCandidate.id;
      setSwipedCandidates((prev) => ({
        ...prev,
        [candidateId]: true,
      }));

      // Move to next candidate
      setCurrentCandidateIndex((currentCandidateIndex + 1) % candidates.length);
    }
  };

  const handlePreviousCandidate = async () => {
    // await handleMatchLogic(false); // Handle rejection logic
    handleSwipe("left"); // Handle swiping logic
  };

  const handleNextCandidate = async () => {
    // await handleMatchLogic(true); // Handle approval logic
    handleSwipe("right"); // Handle swiping logic
  };

  const handleReverseSwipe = () => {
    if (candidates.length > 0) {
      // Find previous swiped candidate
      let prevIndex = currentCandidateIndex;
      do {
        prevIndex = prevIndex === 0 ? candidates.length - 1 : prevIndex - 1;
      } while (
        !swipedCandidates[candidates[prevIndex].id] &&
        prevIndex !== currentCandidateIndex
      );

      // If we found a swiped candidate, go back to it
      if (swipedCandidates[candidates[prevIndex].id]) {
        setCurrentCandidateIndex(prevIndex);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Set Up</Text>
        <Text>You're Swiping for:</Text>
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
});
