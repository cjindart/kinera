import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

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
  selectedBlue: "#C2D7E5",
};

const LIAISONS = [
  { id: 1, name: "dan", image: null },
  { id: 2, name: "cole", image: null },
  { id: 3, name: "maya", image: null },
  { id: 4, name: "cj", image: null },
  // Add more if needed
];

const CARD_SIZE = (Dimensions.get("window").width - 64) / 2;

export default function SelectLiaison({ navigation }) {
  const [selectedId, setSelectedId] = useState(1);
  const { user, updateProfile } = useAuth();

  const handleSetLiaison = async () => {
    try {
      const selectedLiaison = LIAISONS.find((l) => l.id === selectedId);

      if (!selectedLiaison) {
        Alert.alert("Error", "Please select a liaison");
        return;
      }

      // Update the user's profile with the selected liaison
      const profileUpdate = {
        profileData: {
          ...user.profileData,
          liaison: selectedLiaison.name,
        },
      };

      // Save to Firestore and update local state
      const success = await updateProfile(profileUpdate);

      if (success) {
        Alert.alert("Success", "Liaison updated successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update liaison. Please try again.");
      }
    } catch (error) {
      console.error("Error updating liaison:", error);
      Alert.alert("Error", "Failed to update liaison. Please try again.");
    }
  };

  const renderLiaison = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.liaisonCard,
        selectedId === item.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedId(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.liaisonImageFrame}>
        <Ionicons name="person" size={48} color={COLORS.mutedBlue} />
      </View>
      <Text style={styles.liaisonName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Set Your Date Liaison</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Grid of liaisons */}
      <FlatList
        data={LIAISONS}
        renderItem={renderLiaison}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Submit button */}
      <View style={styles.submitRow}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSetLiaison}
        >
          <Text style={styles.submitText}>Set Liaison</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.skyBlue,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "500",
    color: COLORS.primaryNavy,
    textAlign: "center",
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 80,
  },
  liaisonCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
    backgroundColor: COLORS.paleBlue,
    borderRadius: 18,
    margin: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.skyBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedCard: {
    backgroundColor: COLORS.selectedBlue,
    borderColor: COLORS.primaryNavy,
    shadowOpacity: 0.15,
    elevation: 3,
  },
  liaisonImageFrame: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: COLORS.offWhite,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
  },
  liaisonName: {
    fontSize: 22,
    color: COLORS.primaryNavy,
    fontWeight: "400",
    textAlign: "center",
    textTransform: "capitalize",
    marginTop: 2,
    fontFamily: "System", // Replace with a hand-written font if available
  },
  submitRow: {
    position: "absolute",
    right: 20,
    bottom: 30,
  },
  submitButton: {
    backgroundColor: COLORS.buttonPeach,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
    shadowColor: COLORS.buttonShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  submitText: {
    color: COLORS.primaryNavy,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
