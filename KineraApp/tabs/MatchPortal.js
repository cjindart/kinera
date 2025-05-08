import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import theme from "../assets/theme";

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

  // Madison's profile data - this would normally come from an API or database
  const madisonProfile = {
    name: "Madison",
    age: "22",
    gender: "Woman",
    height: "5'7\"",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Fizz", "Pets"],
    dateActivities: ["Voyager", "Jazz night", "Study date", "KA basement"],
  };

  // Alex's profile data
  const alexProfile = {
    name: "Alex",
    age: "21",
    gender: "Man",
    height: "6'0\"",
    year: "Junior",
    interests: ["Tech", "Outdoors", "Cooking", "Travel", "Movies"],
    dateActivities: ["Hiking", "Cooking class", "Movie night", "Coffee chat"],
  };

  const handleViewMatch = (profile) => {
    navigation.navigate("MatchCompare", { candidateInfo: profile });
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

        {/* Madison's Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => handleViewMatch(madisonProfile)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.profileImageContainer}>
              <Ionicons
                name="person-circle"
                size={60}
                color={COLORS.mutedBlue}
              />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{madisonProfile.name}</Text>
              <Text style={styles.profileSubtitle}>
                {madisonProfile.age} • {madisonProfile.year}
              </Text>
            </View>
          </View>

          <View style={styles.interestsContainer}>
            <Text style={styles.interestsLabel}>Interests:</Text>
            <View style={styles.interestTags}>
              {madisonProfile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
              {madisonProfile.interests.length > 3 && (
                <Text style={styles.moreText}>
                  +{madisonProfile.interests.length - 3} more
                </Text>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.viewProfileText}>View Full Profile</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.accentOrange}
            />
          </View>
        </TouchableOpacity>

        {/* Alex's Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => handleViewMatch(alexProfile)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.profileImageContainer}>
              <Ionicons
                name="person-circle"
                size={60}
                color={COLORS.mutedBlue}
              />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{alexProfile.name}</Text>
              <Text style={styles.profileSubtitle}>
                {alexProfile.age} • {alexProfile.year}
              </Text>
            </View>
          </View>

          <View style={styles.interestsContainer}>
            <Text style={styles.interestsLabel}>Interests:</Text>
            <View style={styles.interestTags}>
              {alexProfile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
              {alexProfile.interests.length > 3 && (
                <Text style={styles.moreText}>
                  +{alexProfile.interests.length - 3} more
                </Text>
              )}
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.viewProfileText}>View Full Profile</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.accentOrange}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primaryNavy,
  },
  profileSubtitle: {
    fontSize: 14,
    color: COLORS.primaryNavy,
    opacity: 0.8,
  },
  interestsContainer: {
    marginVertical: 8,
  },
  interestsLabel: {
    fontSize: 14,
    color: COLORS.primaryNavy,
    marginBottom: 6,
  },
  interestTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  interestTag: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
  },
  interestText: {
    fontSize: 12,
    color: COLORS.primaryNavy,
  },
  moreText: {
    fontSize: 12,
    color: COLORS.accentOrange,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  viewProfileText: {
    fontSize: 14,
    color: COLORS.accentOrange,
    fontWeight: "500",
    marginRight: 4,
  },
  helperText: {
    textAlign: "center",
    marginTop: 20,
    color: COLORS.mutedBlue,
    fontStyle: "italic",
  },
});
