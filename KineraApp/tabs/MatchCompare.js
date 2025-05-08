import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

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

  // Get candidate info from route params or use default values
  const candidateInfo = route.params?.candidateInfo || {
    name: "Madison",
    age: "22",
    gender: "Woman",
    height: "5'7\"",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Fizz", "Pets"],
    dateActivities: ["Voyager", "Jazz night", "Study date", "RA basement"],
  };

  // Use real user data from AuthContext
  const yourInfo = {
    name: user?.name || "You",
    image: user?.profileData?.photos?.[0] || null,
    interests: user?.profileData?.interests || [],
    dateActivities: user?.profileData?.dateActivities || [],
  };

  // Get liaison from user's profile
  const liaison = { name: user?.profileData?.liaison || "Not set" };

  // Calculate shared interests and activities
  const sharedInterests = candidateInfo.interests.filter((interest) =>
    yourInfo.interests.includes(interest)
  );
  const sharedActivities = candidateInfo.dateActivities.filter((act) =>
    yourInfo.dateActivities.includes(act)
  );

  // Static mock availability data
  const days = ["4/23", "4/24", "4/25", "4/26", "4/27"];
  const slots = ["12-2", "1-3", "6-8", "6-9", "11-2"];
  const candidateAvailability = {
    "4/23": ["12-2", "6-8"],
    "4/24": ["1-3"],
    "4/25": ["6-9"],
    "4/26": ["11-2"],
    "4/27": ["12-2", "6-8"],
  };
  const yourAvailability = {
    "4/23": ["6-8"],
    "4/24": ["6-9"],
    "4/25": [],
    "4/26": ["11-2"],
    "4/27": ["6-8"],
  };

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
          <Text style={styles.matchNameHeader}>{candidateInfo.name}</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Row: Back Button and Match Name */}

        {/* Top: Liaison row */}
        <View style={styles.liaisonRow}>
          <Text style={styles.liaisonText}>
            Your date liaison:{" "}
            <Text style={styles.liaisonName}>{liaison.name}</Text>
          </Text>
        </View>

        {/* Side-by-side images */}
        <View style={styles.profileImagesRow}>
          <View style={styles.profileImageBlock}>
            <View style={styles.profileImageFrame}>
              <Ionicons name="person" size={70} color={COLORS.mutedBlue} />
            </View>
            <Text style={styles.profileLabel}>{candidateInfo.name}</Text>
          </View>
          <View style={styles.profileImageBlock}>
            <Image
              source={{ uri: yourInfo.image }}
              style={styles.profileImageReal}
            />
            <Text style={styles.profileLabel}>you</Text>
          </View>
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
              {candidateInfo.interests.map((interest, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pill,
                    sharedInterests.includes(interest) && styles.sharedPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sharedInterests.includes(interest) &&
                        styles.sharedPillText,
                    ]}
                  >
                    {interest}
                  </Text>
                  {sharedInterests.includes(interest) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.offWhite}
                      style={styles.matchIcon}
                    />
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.comparisonTitle}>Activities</Text>
            <View style={styles.pillsContainer}>
              {candidateInfo.dateActivities.map((act, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pill,
                    sharedActivities.includes(act) && styles.sharedPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sharedActivities.includes(act) && styles.sharedPillText,
                    ]}
                  >
                    {act}
                  </Text>
                  {sharedActivities.includes(act) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.offWhite}
                      style={styles.matchIcon}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
          {/* Right: Your interests/activities */}
          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonTitle}>Interests</Text>
            <View style={styles.pillsContainer}>
              {yourInfo.interests.map((interest, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pill,
                    sharedInterests.includes(interest) && styles.sharedPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sharedInterests.includes(interest) &&
                        styles.sharedPillText,
                    ]}
                  >
                    {interest}
                  </Text>
                  {sharedInterests.includes(interest) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.offWhite}
                      style={styles.matchIcon}
                    />
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.comparisonTitle}>Activities</Text>
            <View style={styles.pillsContainer}>
              {yourInfo.dateActivities.map((act, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.pill,
                    sharedActivities.includes(act) && styles.sharedPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sharedActivities.includes(act) && styles.sharedPillText,
                    ]}
                  >
                    {act}
                  </Text>
                  {sharedActivities.includes(act) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.offWhite}
                      style={styles.matchIcon}
                    />
                  )}
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
