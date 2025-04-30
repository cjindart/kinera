import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import theme from "../assets/theme";

export default function AvailabilityScreen() {
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
          {/* <Image
            source={{ uri: "https://link-to-daniel-image.jpg" }} // Replace with real image or static asset
            style={styles.friendImage}
          /> */}
          <View style={styles.temp}></View>
          <Text>Daniel</Text>
        </View>

        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={40} />
          <Text style={styles.friendText}>Next{"\n"}friend</Text>
        </TouchableOpacity>
      </View>

      {/* Candidate Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardText}>Madison 20</Text>
          <Text style={styles.cardText}>Los Angeles</Text>
        </View>
        <View style={styles.approvalRow}>
          <Text style={styles.disapprove}>Friends who don't approve: Maya</Text>
          <Text style={styles.approve}>Friends who approved: CJ, Cole</Text>
        </View>
      </View>

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
