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
  const [currentCandidateIndex, setcurrentCandidateIndex] = useState(0);
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Get all users who are either "gettingSetUp" or "both"
  const availableUsers = mockData.users.filter(
    (user) => user.setupStatus === "gettingSetUp" || user.setupStatus === "both"
  );

  // Get current user and friend
  const currentCandidate = availableUsers[currentCandidateIndex];
  const currentFriend = currentCandidate?.friends?.[currentFriendIndex]
    ? mockData.users.find(
        (user) => user.id === currentCandidate.friends[currentFriendIndex]
      )
    : null;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#325475" />
      </View>
    );
  }

  if (!currentCandidate || !currentFriend) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>No candidates available</Text>
      </View>
    );
  }

  const handleCardPress = () => {
    console.log("Card pressed, attempting navigation");
    if (navigation && navigation.navigate) {
      navigation.navigate("CandidateProfile", {
        candidateInfo: currentCandidate,
      });
    } else {
      console.error("Navigation is not available:", navigation);
    }
  };

  const handlePreviousFriend = () => {
    if (currentCandidate?.friends) {
      setCurrentFriendIndex((prev) =>
        prev === 0 ? currentCandidate.friends.length - 1 : prev - 1
      );
    }
  };

  const handleNextFriend = () => {
    if (currentCandidate?.friends) {
      setCurrentFriendIndex((prev) =>
        prev === currentCandidate.friends.length - 1 ? 0 : prev + 1
      );
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
            source={require("../assets/photos/daniel.png")}
            style={styles.temp}
          />
          <Text color="#325475">{currentFriend.name}</Text>
        </View>

        <TouchableOpacity onPress={handleNextFriend}>
          <Ionicons name="chevron-forward" size={40} color="#325475" />
          <Text style={styles.friendText}>Next{"\n"}friend</Text>
        </TouchableOpacity>
      </View>

      {/* Candidate Card - Now Tappable */}
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContainer}>
          <Image
            source={require("../assets/photos/image.png")}
            style={styles.cardImage}
          />
        </View>
        <Text style={styles.cardText}>
          {currentCandidate.name} {"\n"} {currentCandidate.age}
          {"\n"}
          {currentCandidate.location}
        </Text>
      </TouchableOpacity>

      {/* Approve/Reject Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.rejectButton}>
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton}>
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
  },
  rejectButton: {
    backgroundColor: "#F7C4A5",
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.09,
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
});
