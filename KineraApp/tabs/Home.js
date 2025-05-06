import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Color constants based on the spec
const COLORS = {
  primaryNavy: "#325475",
  mutedBlue: "#A9B7C5",
  skyBlue: "#C2D7E5",
  paleBlue: "#E6EEF4",
  offWhite: "#FAEFE4",
  accentOrange: "#ED7E31",
  lightPeach: "#F6D3B7",
  buttonPeach: "#F7D0B5",
  buttonShadow: "#E98E42",
};

// Mock friends data
const friends = [
  { id: 1, name: "Daniel", image: require("../assets/photos/daniel.png") },
  { id: 2, name: "CJ", image: require("../assets/photos/cj.png") }, // Replace with actual image
  { id: 3, name: "Cole", image: require("../assets/photos/cole.png") }, // Replace with actual image
  { id: 4, name: "Maya", image: require("../assets/photos/maya.png") }, // Replace with actual image
];

export default function AvailabilityScreen() {
  const navigation = useNavigation();
  const [currentFriendIndex, setCurrentFriendIndex] = useState(0);

  // Mock candidate data
  const candidateInfo = {
    name: "Madison",
    age: 22,
    location: "Los Angeles",
    height: "5'7",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Fizz", "Pets"],
    dateActivities: ["Voyager", "Jazz night", "Study date", "RA basement"],
  };

  const handleCardPress = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate("CandidateProfile", { candidateInfo });
    }
  };

  const handlePreviousFriend = () => {
    setCurrentFriendIndex((prevIndex) =>
      prevIndex === 0 ? friends.length - 1 : prevIndex - 1
    );
  };

  const handleNextFriend = () => {
    setCurrentFriendIndex((prevIndex) =>
      prevIndex === friends.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.nameContainer}>
            <Text style={styles.headerTitle}>Set Up</Text>
            <Text style={styles.roleText}>You're Swiping for:</Text>
          </View>
        </View>
      </View>

      {/* Friend Selector */}
      <View style={styles.friendSelector}>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handlePreviousFriend}
        >
          <Ionicons name="chevron-back" size={40} color={COLORS.primaryNavy} />
          <Text style={styles.navigationText}>Previous{"\n"}friend</Text>
        </TouchableOpacity>

        <View style={styles.friendInfo}>
          <Image
            source={friends[currentFriendIndex].image}
            style={styles.friendImage}
          />
          <Text style={styles.friendName}>
            {friends[currentFriendIndex].name}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handleNextFriend}
        >
          <Ionicons
            name="chevron-forward"
            size={40}
            color={COLORS.primaryNavy}
          />
          <Text style={styles.navigationText}>Next{"\n"}friend</Text>
        </TouchableOpacity>
      </View>

      {/* Candidate Card */}
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.card}>
          <Text style={styles.cardText}>
            {candidateInfo.name} {candidateInfo.age}
          </Text>
          <Text style={styles.cardText}>{candidateInfo.location}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.approvalRow}>
        <Text style={styles.disapprove}>Approving Friends:{"\n"}Maya</Text>
        <Text style={styles.approve}>Non Approving Friends:{"\n"}CJ, Cole</Text>
      </View>

      {/* Approve/Reject Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.rejectButton}>
          <View style={styles.buttonShadow} />
          <View style={styles.buttonTop}>
            <Ionicons name="close" size={32} color={COLORS.primaryNavy} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton}>
          <View style={styles.buttonShadow} />
          <View style={styles.buttonTop}>
            <Ionicons name="heart" size={32} color={COLORS.primaryNavy} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  nameContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.primaryNavy,
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.mutedBlue,
    marginTop: 0,
  },
  friendSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 20,
    width: "100%",
  },
  navigationButton: {
    alignItems: "center",
    width: 80,
  },
  navigationText: {
    textAlign: "center",
    fontSize: 14,
    color: COLORS.primaryNavy,
    marginTop: 4,
  },
  friendInfo: {
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    marginHorizontal: 20,
  },
  friendImage: {
    aspectRatio: 1,
    width: 130,
    height: 130,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
  },
  friendName: {
    fontSize: 24,
    color: COLORS.primaryNavy,
    fontWeight: "400",
    fontFamily: Platform.OS === "ios" ? "Gill Sans" : "sans-serif",
  },
  cardContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  card: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: COLORS.paleBlue,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardText: {
    fontSize: 18,
    color: COLORS.primaryNavy,
  },
  approvalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  disapprove: {
    color: COLORS.accentOrange,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  approve: {
    color: COLORS.primaryNavy,
    flex: 1,
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  rejectButton: {
    width: 75,
    height: 75,
    position: "relative",
  },
  acceptButton: {
    width: 75,
    height: 75,
    position: "relative",
  },
  buttonShadow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 37.5,
    backgroundColor: COLORS.buttonShadow,
    bottom: 0,
  },
  buttonTop: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 37.5,
    backgroundColor: COLORS.buttonPeach,
    bottom: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 24,
    color: COLORS.primaryNavy,
    fontWeight: "bold",
  },
});
