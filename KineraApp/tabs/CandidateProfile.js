import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import theme from "../assets/theme";

export default function CandidateProfile({ route, navigation }) {
  // In a real app, you would get these details from route.params or API
  const candidateInfo = route.params?.candidateInfo || {
    name: "Madison",
    age: 22,
    height: "5'7",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Fizz", "Pets"],
    dateActivities: ["Voyager", "Jazz night", "Study date", "RA basement"]
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Profile Header with Name */}
      <Text style={styles.name}>{candidateInfo.name}</Text>

      {/* Profile Pictures Section */}
      <View style={styles.picturesContainer}>
        <View style={styles.mainPictureContainer}>
          {/* This would be an Image component in a real app */}
          <View style={styles.mainPicture}>
            {/* Placeholder for profile image */}
            <Text style={styles.placeholderText}>Main Picture</Text>
          </View>
        </View>
        
        <View style={styles.secondaryPicturesContainer}>
          <View style={styles.secondaryPicture}>
            {/* Placeholder for additional images */}
            <Text style={styles.placeholderText}>Picture</Text>
          </View>
          <View style={styles.secondaryPicture}>
            {/* Placeholder for additional images */}
            <Text style={styles.placeholderText}>Picture</Text>
          </View>
        </View>
      </View>

      {/* Profile Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person" size={20} />
            <Text style={styles.infoText}>{candidateInfo.age}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="woman" size={20} />
            <Text style={styles.infoText}>Woman</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="resize" size={20} />
            <Text style={styles.infoText}>{candidateInfo.height}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="school" size={20} />
            <Text style={styles.infoText}>{candidateInfo.year}</Text>
          </View>
        </View>
      </View>

      {/* Interests Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Interests:</Text>
        <View style={styles.tagsContainer}>
          {candidateInfo.interests.map((interest, index) => (
            <View key={index} style={styles.tagButton}>
              <Text style={styles.tagText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Favorite Date Activities Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Favorite date activities:</Text>
        <View style={styles.tagsContainer}>
          {candidateInfo.dateActivities.map((activity, index) => (
            <View key={index} style={styles.tagButton}>
              <Text style={styles.tagText}>{activity}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Navigation - similar to the app's tab bar */}
      {/* <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="heart-outline" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="copy-outline" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="person-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
  },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  picturesContainer: {
    flexDirection: "row",
    marginBottom: 20,
    height: 220,
  },
  mainPictureContainer: {
    flex: 1,
    marginRight: 10,
  },
  mainPicture: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryPicturesContainer: {
    width: "35%",
    justifyContent: "space-between",
  },
  secondaryPicture: {
    height: "48%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
  },
  infoSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  infoText: {
    marginLeft: 5,
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tagText: {
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f5f5f5",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    padding: 10,
  },
}); 