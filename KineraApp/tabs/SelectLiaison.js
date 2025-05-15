import React, { useState, useEffect } from "react";
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
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

const CARD_SIZE = (Dimensions.get("window").width - 64) / 2;

export default function SelectLiaison({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [liaisons, setLiaisons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest friends from Firestore
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        if (!user?.id) {
          setLiaisons([]);
          setLoading(false);
          return;
        }
        const userRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          setLiaisons([]);
          setLoading(false);
          return;
        }
        const userData = userDoc.data();
        const friends = userData.friends || [];
        // Fetch each friend's full data to get their Stanford email
        const liaisonList = await Promise.all(
          friends.map(async (friend) => {
            const friendId = typeof friend === "object" ? friend.id : friend;
            const friendDoc = await getDoc(doc(db, "users", friendId));
            if (!friendDoc.exists()) return null;
            const friendData = friendDoc.data();
            return {
              id: friendId,
              name: friendData.name,
              image: friendData.profileData?.photos?.[0] || null,
              stanfordEmail: friendData.stanfordEmail || "",
            };
          })
        );
        setLiaisons(liaisonList.filter(Boolean));
      } catch (e) {
        setLiaisons([]);
      }
      setLoading(false);
    };
    fetchFriends();
  }, [user]);

  const handleSetLiaison = async () => {
    try {
      const selectedLiaison = liaisons.find((l) => l.id === selectedId);

      if (!selectedLiaison) {
        Alert.alert("Error", "Please select a liaison");
        return;
      }

      // Update the user's profile with the selected liaison
      const profileUpdate = {
        profileData: {
          ...user.profileData,
          liaison: selectedLiaison.name,
          liaisonEmail: selectedLiaison.stanfordEmail,
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
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.liaisonImage} />
        ) : (
          <Ionicons name="person" size={48} color={COLORS.mutedBlue} />
        )}
      </View>
      <Text style={styles.liaisonName}>{item.name}</Text>
      {item.stanfordEmail ? (
        <Text style={styles.liaisonEmail}>{item.stanfordEmail}</Text>
      ) : (
        <Text style={styles.liaisonEmail}>
          {" "}
          no stanford email, this is required for liaison
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={COLORS.primaryNavy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Your Date Liaison</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Grid of liaisons */}
      {loading ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Loading friends...</Text>
        </View>
      ) : liaisons.length > 0 ? (
        <FlatList
          data={liaisons}
          renderItem={renderLiaison}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            Add friends to your profile to select them as liaisons
          </Text>
        </View>
      )}

      {/* Submit button */}
      <View style={styles.submitRow}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !selectedId && styles.submitButtonDisabled,
          ]}
          onPress={handleSetLiaison}
          disabled={!selectedId}
        >
          <Text
            style={[
              styles.submitText,
              !selectedId && styles.submitTextDisabled,
            ]}
          >
            Set Liaison
          </Text>
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.mutedBlue,
    textAlign: "center",
    lineHeight: 24,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.skyBlue,
    opacity: 0.7,
  },
  submitTextDisabled: {
    color: COLORS.primaryNavy,
    opacity: 0.7,
  },
  liaisonImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  liaisonEmail: {
    fontSize: 14,
    color: COLORS.mutedBlue,
    textAlign: "center",
    marginTop: 2,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
});
