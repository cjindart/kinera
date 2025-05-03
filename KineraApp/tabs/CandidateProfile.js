import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

// Get device dimensions to use for more precise sizing
const { width, height } = Dimensions.get('window');

export default function CandidateProfile({ route, navigation }) {
  // Get candidate info from route params or use default values
  const candidateInfo = route.params?.candidateInfo || {
    name: "Madison",
    age: "22",
    gender: "Woman",
    height: "5'7\"",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Fizz", "Pets"],
    dateActivities: ["Voyager", "Jazz night", "Study date", "RA basement"]
  };

  // State for tracking selected interests
  const [selectedInterests, setSelectedInterests] = useState(["Music"]);
  
  // Toggle function for interests (for highlighting/selecting)
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(item => item !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primaryNavy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* 1. Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.nameContainer}>
              <Text style={styles.headerTitle}>{candidateInfo.name}</Text>
            </View>
          </View>
        </View>

        {/* 2. Photo Gallery Section */}
        <View style={styles.photoGallerySection}>
          <View style={styles.leftColumn}>
            <View style={styles.mainPhotoContainer}>
              <View style={styles.mainPhoto}>
                {/* Placeholder for main profile picture */}
                <Ionicons name="person" size={80} color={COLORS.mutedBlue} />
              </View>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            <View style={styles.additionalPhotosContainer}>
              {/* Only show photos that exist */}
              <View style={styles.additionalPhoto}>
                <Ionicons name="image" size={32} color={COLORS.mutedBlue} />
              </View>
              
              <View style={styles.additionalPhoto}>
                <Ionicons name="image" size={32} color={COLORS.mutedBlue} />
              </View>
            </View>
          </View>
        </View>

        {/* 3. Profile Summary Bar */}
        <View style={styles.summaryBarSection}>
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{candidateInfo.age}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{candidateInfo.gender}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="resize-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{candidateInfo.height}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="school-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{candidateInfo.year}</Text>
          </View>
        </View>

        {/* 4. Interest Tags Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Interests:</Text>
          <View style={styles.tagsContainer}>
            {candidateInfo.interests.map((interest, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tagPill,
                  selectedInterests.includes(interest) && styles.selectedTagPill,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedInterests.includes(interest) && styles.selectedTagText,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Favorite Date Activities Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Favorite date activities:</Text>
          <View style={styles.tagsContainer}>
            {candidateInfo.dateActivities.map((activity, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{activity}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Add bottom padding to account for tab bar */}
        <View style={styles.bottomPadding} />
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
  
  // 1. Header Section
  headerSection: {
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the name
    width: "100%",
  },
  nameContainer: {
    flexDirection: "column",
    alignItems: "center", // Center text
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.primaryNavy,
    marginBottom: 2,
  },
  
  // 2. Photo Gallery Section
  photoGallerySection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 15,
  },
  leftColumn: {
    width: "38%", // Reduced slightly to prevent overlap
    position: "relative",
  },
  mainPhotoContainer: {
    flex: 1,
    marginRight: 12, // Increased margin to prevent overlap
  },
  mainPhoto: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.paleBlue,
    height: width * 0.35, // Fixed size based on screen width
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  additionalPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10, // Slightly less than container's borderRadius
  },
  rightColumn: {
    width: "62%", // Increased to match the reduction in leftColumn
    alignItems: "center",
    paddingLeft: 5, // Add padding to create more space between columns
  },
  additionalPhotosContainer: {
    height: width * 0.35, // Match the height of mainPhoto
    width: "100%",
    justifyContent: "space-between",
  },
  additionalPhoto: {
    height: "47%",
    width: "100%", // Ensure full width
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.skyBlue,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
    backgroundColor: COLORS.paleBlue,
  },
  
  // 3. Profile Summary Bar
  summaryBarSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 15,
  },
  summaryBlock: {
    flex: 1,
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.paleBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primaryNavy,
  },
  
  // 4 & 5. Section Containers (Interests & Date Activities)
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.primaryNavy,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagPill: {
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTagPill: {
    backgroundColor: COLORS.accentOrange,
    borderColor: COLORS.accentOrange,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.primaryNavy,
  },
  selectedTagText: {
    color: COLORS.offWhite,
  },
  
  // Extra bottom padding
  bottomPadding: {
    height: 20,
  }
}); 