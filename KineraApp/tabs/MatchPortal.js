import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { hasAccessToScreen } from "../utils/accessControl";
import LockedScreen from "../components/LockedScreen";
import { fetchUserById } from "../services/userService";

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

export default function MatchPortal() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const userType = user?.userType || "";
  const hasAccess = hasAccessToScreen(userType, "MatchPortal");
  const [loading, setLoading] = useState(true);
  const [matchProfiles, setMatchProfiles] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        if (!user || !user.matches) {
          setMatchProfiles([]);
          setLoading(false);
          return;
        }
        // Get all matches with a matchId
        const matchEntries = Object.entries(user.matches).filter(
          ([, match]) => match.matchId
        );
        // Fetch candidate user data for each match
        const profiles = await Promise.all(
          matchEntries.map(async ([candidateId, match]) => {
            const candidate = await fetchUserById(candidateId);
            if (!candidate) return null;
            return {
              id: candidateId,
              name: candidate.name,
              age: candidate.profileData?.age,
              interests: candidate.profileData?.interests || [],
              dateActivities: candidate.profileData?.dateActivities || [],
              matchId: match.matchId,
            };
          })
        );
        setMatchProfiles(profiles.filter(Boolean));
      } catch (e) {
        setMatchProfiles([]);
      }
      setLoading(false);
    };
    fetchMatches();
  }, [user]);

  const handleViewMatch = (profile) => {
    navigation.navigate("MatchCompare", { candidateId: profile.id });
  };

  const handleLiaisonPress = () => {
    navigation.navigate("SelectLiaison");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Match Portal</Text>
        <View style={styles.liaisonContainer}>
          <TouchableOpacity
            style={styles.liaisonButton}
            onPress={handleLiaisonPress}
          >
            <Ionicons name="people" size={24} color={COLORS.primaryNavy} />
            <Text style={styles.liaisonButtonText}>Select Liaison</Text>
          </TouchableOpacity>
          {user?.profileData?.liaison && (
            <View style={styles.currentLiaisonContainer}>
              <View style={styles.liaisonBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.accentOrange}
                />
                <Text style={styles.currentLiaisonText}>
                  Current Liaison:{" "}
                  <Text style={styles.liaisonName}>
                    {user.profileData.liaison}
                  </Text>
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Manage Your Matches</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryNavy} />
        ) : matchProfiles.length === 0 ? (
          <Text style={{ color: COLORS.primaryNavy, textAlign: "center" }}>
            No matches yet.
          </Text>
        ) : (
          matchProfiles.map((profile, index) => (
            <TouchableOpacity
              key={profile.matchId || profile.id || index}
              style={styles.profileCard}
              onPress={() => handleViewMatch(profile)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.profileImageContainer}>
                    <Text style={styles.initialsText}>{profile.name[0]}</Text>
                  </View>
                  <View style={styles.profileDetails}>
                    <Text style={styles.profileName}>
                      Match: {profile.name[0]} ({profile.age})
                    </Text>
                    <View style={styles.viewProfileButton}>
                      <Text style={styles.viewProfileText}>
                        View Full Profile
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.accentOrange}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {!hasAccess && <LockedScreen userType={userType} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primaryNavy,
  },
  liaisonContainer: {
    alignItems: "flex-end",
  },
  liaisonButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.paleBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
  },
  liaisonButtonText: {
    marginLeft: 4,
    color: COLORS.primaryNavy,
    fontSize: 14,
    fontWeight: "500",
  },
  currentLiaisonContainer: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  liaisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
  },
  currentLiaisonText: {
    fontSize: 13,
    color: COLORS.primaryNavy,
    marginLeft: 4,
  },
  liaisonName: {
    fontWeight: "600",
    color: COLORS.accentOrange,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
    color: COLORS.primaryNavy,
  },
  profileCard: {
    backgroundColor: COLORS.paleBlue,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    marginRight: 16,
    backgroundColor: COLORS.offWhite,
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
  },
  initialsText: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primaryNavy,
  },
  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primaryNavy,
    marginBottom: 8,
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.offWhite,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
  },
  viewProfileText: {
    fontSize: 14,
    color: COLORS.accentOrange,
    fontWeight: "600",
    marginRight: 4,
  },
});
