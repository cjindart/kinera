import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { fetchUserById } from "../services/userService";

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

export default function MatchCompare({ route, navigation }) {
  const { user } = useAuth();
  const candidateId = route.params?.candidateId;
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      if (!candidateId) {
        setCandidateInfo(null);
        setLoading(false);
        return;
      }
      const candidate = await fetchUserById(candidateId);
      setCandidateInfo(candidate);
      setLoading(false);
    };
    fetchCandidate();
  }, [candidateId]);

  // Use real user data from AuthContext
  const yourInfo = {
    name: user?.name || "You",
    image: user?.profileData?.photos?.[0] || null,
    interests: user?.profileData?.interests || [],
    dateActivities: user?.profileData?.dateActivities || [],
    matchId: user?.profileData?.matchId || null,
  };

  // Get liaison from user's or candidate's profile
  const liaisonName =
    user?.profileData?.liaison ||
    candidateInfo?.profileData?.liaison ||
    "Not set";
  const liaisonEmail =
    user?.profileData?.liaisonEmail ||
    candidateInfo?.profileData?.liaisonEmail ||
    "email not set";

  // Get the matchId for this pair
  const pairMatchId =
    (user?.matches && user.matches[candidateId]?.matchId) ||
    (candidateInfo?.matches && candidateInfo.matches[user?.id]?.matchId) ||
    null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primaryNavy} />
      </SafeAreaView>
    );
  }
  if (!candidateInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <Text
          style={{
            color: COLORS.primaryNavy,
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Candidate not found.
        </Text>
      </SafeAreaView>
    );
  }

  // Extract all interests and activities
  const candidateInterests = candidateInfo.profileData?.interests || [];
  const candidateActivities = candidateInfo.profileData?.dateActivities || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primaryNavy} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 2, alignItems: "center" }}>
          <Text style={styles.matchNameHeader}>
            Match: {candidateInfo.name ? candidateInfo.name[0] : "?"}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top: Liaison row */}
        <View style={styles.liaisonRow}>
          <Text style={styles.liaisonText}>
            Your date liaison:{" "}
            <Text style={styles.liaisonName}>{liaisonName}</Text>
            {liaisonEmail ? (
              <Text style={styles.liaisonEmail}> ({liaisonEmail})</Text>
            ) : null}
          </Text>
        </View>

        {/* Side-by-side images */}
        <View style={styles.profileImagesRow}>
          <View style={styles.profileImageBlock}>
            <View style={styles.profileImageFrame}>
              <Ionicons name="person" size={70} color={COLORS.mutedBlue} />
            </View>
            <Text style={styles.profileLabel}>
              {candidateInfo.name ? candidateInfo.name[0] : "?"} (
              {candidateInfo.profileData?.age || "?"})
            </Text>
          </View>
          <View style={styles.profileImageBlock}>
            <Image
              source={{ uri: yourInfo.image }}
              style={styles.profileImageReal}
            />
            <Text style={styles.profileLabel}>you</Text>
          </View>
        </View>
        <View>
          <Text
            style={{
              color: COLORS.primaryNavy,
              textAlign: "center",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            {pairMatchId
              ? `Your Match ID: ${pairMatchId}`
              : "we can't find your match ID, please contact the team for support."}
          </Text>
        </View>
        {/* Availability button */}
        <View style={styles.availabilityButtonContainer}>
          <TouchableOpacity
            style={styles.availabilityButton}
            onPress={() => {
              const googleFormUrl =
                "https://docs.google.com/forms/d/e/1FAIpQLSdeI3BYvrD4TF7KBps8ez1Ysb4ek3QEOjEykgCS1Dy49001Bw/viewform?usp=dialog";
              Linking.openURL(googleFormUrl);
            }}
          >
            <Text style={styles.availabilityButtonText}>Add availability!</Text>
          </TouchableOpacity>
        </View>

        {/* Interests and activities comparison */}
        <View style={styles.comparisonContainer}>
          {/* Left: Candidate interests/activities */}
          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonTitle}>Interests</Text>
            <View style={styles.pillsContainer}>
              {candidateInterests.map((interest, idx) => (
                <View key={idx} style={styles.pill}>
                  <Text style={styles.pillText}>{interest}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.comparisonTitle}>Activities</Text>
            <View style={styles.pillsContainer}>
              {candidateActivities.map((act, idx) => (
                <View key={idx} style={styles.pill}>
                  <Text style={styles.pillText}>{act}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Right: Your interests/activities */}
          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonTitle}>Interests</Text>
            <View style={styles.pillsContainer}>
              {yourInfo.interests.map((interest, idx) => (
                <View key={idx} style={styles.pill}>
                  <Text style={styles.pillText}>{interest}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.comparisonTitle}>Activities</Text>
            <View style={styles.pillsContainer}>
              {yourInfo.dateActivities.map((act, idx) => (
                <View key={idx} style={styles.pill}>
                  <Text style={styles.pillText}>{act}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 70, // Add padding to account for tab bar
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 16,
    marginBottom: 5,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: COLORS.primaryNavy,
  },
  liaisonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  liaisonText: {
    fontSize: 16,
    color: COLORS.primaryNavy,
  },
  liaisonName: {
    fontWeight: "bold",
    color: COLORS.accentOrange,
  },
  liaisonEmail: {
    fontSize: 14,
    color: COLORS.mutedBlue,
    textAlign: "center",
    marginLeft: 4,
  },
  profileImagesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    // gap: 90,
    alignItems: "center",
    marginVertical: 10,
  },
  profileImageBlock: {
    alignItems: "center",
  },
  profileImageFrame: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.skyBlue,
    backgroundColor: COLORS.paleBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  profileImageReal: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.accentOrange,
    marginBottom: 4,
  },
  profileLabel: {
    fontSize: 14,
    color: COLORS.primaryNavy,
    fontStyle: "italic",
  },
  matchSummaryContainer: {
    backgroundColor: COLORS.paleBlue,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.primaryNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchSummaryText: {
    fontSize: 16,
    color: COLORS.primaryNavy,
    fontWeight: "600",
    textAlign: "center",
  },
  comparisonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  comparisonCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primaryNavy,
    marginBottom: 12,
    textAlign: "center",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  pill: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.primaryNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillText: {
    fontSize: 14,
    color: COLORS.primaryNavy,
    fontWeight: "500",
  },
  sharedPill: {
    backgroundColor: COLORS.accentOrange,
    borderColor: COLORS.accentOrange,
    transform: [{ scale: 1.05 }],
  },
  sharedPillText: {
    color: COLORS.offWhite,
    fontWeight: "600",
  },
  matchIcon: {
    marginLeft: 6,
  },
  availabilityButtonContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 20,
    alignItems: "center",
  },
  availabilityButton: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: COLORS.buttonShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
  },
  availabilityButtonText: {
    color: COLORS.offWhite,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  matchNameHeader: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primaryNavy,
    textAlign: "center",
    flex: 1,
  },
});
