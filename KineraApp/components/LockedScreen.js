import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../assets/theme";

const LockedScreen = ({ userType }) => {
  const getMessage = () => {
    if (userType === "Dater") {
      return "As a Dater, you can't access this page";
    } else if (userType === "Match Maker") {
      return "As a Match Maker, you can't access this page";
    }
    return "You don't have access to this page";
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{getMessage()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#325475",
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    fontSize: 18,
    color: "#325475",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default LockedScreen;
