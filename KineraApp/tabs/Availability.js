import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from '@react-navigation/native';
import theme from "../assets/theme";

export default function AvailabilityScreen() {
  // Use the navigation hook instead of prop
  const navigation = useNavigation();
  
  // Debug navigation object
  console.log('Navigation in AvailabilityScreen:', navigation);
  
  // Mock candidate data - in a real app this would come from an API or database
  const candidateInfo = {
    name: "Madison",
    age: 22,
    location: "Los Angeles",
    height: "5'7",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Fizz", "Pets"],
    dateActivities: ["Voyager", "Jazz night", "Study date", "RA basement"]
  };
  
  const handleCardPress = () => {
    console.log('Card pressed, attempting navigation');
    // Navigate directly to the screen within the same stack navigator
    if (navigation && navigation.navigate) {
      navigation.navigate('CandidateProfile', { candidateInfo });
    } else {
      console.error('Navigation is not available:', navigation);
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
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={40} />
          <Text style={styles.friendText}>Previous{"\n"}friend</Text>
        </TouchableOpacity>

        <View style={styles.friendInfo}>
          <Image
            source={require("../assets/photos/daniel.png")} // Replace with real image or static asset
            style={styles.temp}
          />
          {/* <View style={styles.temp}></View> */}
          <Text>Daniel</Text>
        </View>

        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={40} />
          <Text style={styles.friendText}>Next{"\n"}friend</Text>
        </TouchableOpacity>
      </View>

      {/* Candidate Card - Now Tappable */}
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.card}>
          <Text style={styles.cardText}>{candidateInfo.name} {candidateInfo.age}</Text>
          <Text style={styles.cardText}>{candidateInfo.location}</Text>
        </View>
        <View style={styles.approvalRow}>
          <Text style={styles.disapprove}>Friends who don't approve: Maya</Text>
          <Text style={styles.approve}>Friends who approved: CJ, Cole</Text>
        </View>
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
    backgroundColor: theme.colors.background,
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4B5C6B",
    paddingTop: 20,
  },
  temp: {
    height: 180,
    width: 140,
    backgroundColor: "black",
  },
  friendSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friendText: {
    textAlign: "center",
    fontSize: 14,
  },
  friendInfo: {
    width: 140,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  friendImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 5,
  },
  cardContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  questionMark: {
    fontSize: 24,
    marginBottom: 10,
  },
  card: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    // Add shadow and styling to make it look more tappable
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardText: {
    fontSize: 18,
  },
  approvalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  disapprove: {
    color: "#F7C4A5",
    fontSize: 14,
    fontWeight: 600,
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
    marginBottom: 20,
  },
  rejectButton: {
    backgroundColor: "#F7C4A5",
    width: 75,
    height: 75,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#A9B9CC",
    width: 75,
    height: 75,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "white",
  },
});
