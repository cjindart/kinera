import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  // Mock data for 'you' and liaison
  const yourInfo = {
    name: "You",
    image: "../assets/photos/daniel.png", // placeholder
    interests: ["Music", "Sports", "Tech", "Movies"],
    dateActivities: ["Jazz night", "Movie night", "Cooking class", "Fizz"],
  };
  const liaison = { name: "Dan" };

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
            <Text style={styles.profileLabel}>your date</Text>
          </View>
          <View style={styles.profileImageBlock}>
            <Image
              source={{ uri: yourInfo.image }}
              style={styles.profileImageReal}
            />
            <Text style={styles.profileLabel}>you</Text>
          </View>
        </View>

        {/* Interests and activities comparison (no shared column) */}
        <View style={styles.comparisonRow}>
          {/* Left: Candidate interests/activities */}
          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonTitle}>Interests</Text>
            {candidateInfo.interests.map((interest, idx) => (
              <View
                key={idx}
                style={
                  sharedInterests.includes(interest)
                    ? styles.sharedPill
                    : styles.pill
                }
              >
                <Text
                  style={
                    sharedInterests.includes(interest)
                      ? styles.sharedPillText
                      : styles.pillText
                  }
                >
                  {interest}
                </Text>
              </View>
            ))}
            <Text style={styles.comparisonTitle}>Activities</Text>
            {candidateInfo.dateActivities.map((act, idx) => (
              <View
                key={idx}
                style={
                  sharedActivities.includes(act)
                    ? styles.sharedPill
                    : styles.pill
                }
              >
                <Text
                  style={
                    sharedActivities.includes(act)
                      ? styles.sharedPillText
                      : styles.pillText
                  }
                >
                  {act}
                </Text>
              </View>
            ))}
          </View>
          {/* Right: Your interests/activities */}
          <View style={styles.comparisonCol}>
            <Text style={styles.comparisonTitle}>Interests</Text>
            {yourInfo.interests.map((interest, idx) => (
              <View
                key={idx}
                style={
                  sharedInterests.includes(interest)
                    ? styles.sharedPill
                    : styles.pill
                }
              >
                <Text
                  style={
                    sharedInterests.includes(interest)
                      ? styles.sharedPillText
                      : styles.pillText
                  }
                >
                  {interest}
                </Text>
              </View>
            ))}
            <Text style={styles.comparisonTitle}>Activities</Text>
            {yourInfo.dateActivities.map((act, idx) => (
              <View
                key={idx}
                style={
                  sharedActivities.includes(act)
                    ? styles.sharedPill
                    : styles.pill
                }
              >
                <Text
                  style={
                    sharedActivities.includes(act)
                      ? styles.sharedPillText
                      : styles.pillText
                  }
                >
                  {act}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Availability calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeaderRow}>
            <Text style={styles.calendarHeaderCell}> </Text>
            {days.map((day, idx) => (
              <Text key={idx} style={styles.calendarHeaderCell}>
                {day}
              </Text>
            ))}
          </View>
          {slots.map((slot, rowIdx) => (
            <View key={rowIdx} style={styles.calendarRow}>
              <Text style={styles.calendarTimeCell}>{slot}</Text>
              {days.map((day, colIdx) => {
                const candidateHas = candidateAvailability[day]?.includes(slot);
                const youHave = yourAvailability[day]?.includes(slot);
                return (
                  <View key={colIdx} style={styles.calendarCell}>
                    {candidateHas && <View style={styles.candidateDot} />}
                    {youHave && <View style={styles.youDot} />}
                  </View>
                );
              })}
            </View>
          ))}
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
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  comparisonCol: {
    flex: 1,
    alignItems: "center",
  },
  comparisonTitle: {
    fontWeight: "bold",
    color: COLORS.primaryNavy,
    marginVertical: 4,
    fontSize: 13,
  },
  pill: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  pillText: {
    fontSize: 12,
    color: COLORS.primaryNavy,
  },
  sharedPill: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  sharedPillText: {
    fontSize: 12,
    color: COLORS.offWhite,
    fontWeight: "bold",
  },
  calendarSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  calendarHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.primaryNavy,
    fontSize: 13,
  },
  calendarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  calendarTimeCell: {
    flex: 1,
    textAlign: "center",
    color: COLORS.primaryNavy,
    fontSize: 12,
    fontWeight: "500",
  },
  calendarCell: {
    flex: 1,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
    backgroundColor: COLORS.paleBlue,
    marginHorizontal: 1,
    borderRadius: 6,
    flexDirection: "row",
  },
  candidateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentOrange,
    marginHorizontal: 1,
  },
  youDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryNavy,
    marginHorizontal: 1,
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
