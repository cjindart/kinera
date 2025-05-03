import React, { useState, useRef } from "react";
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
  Animated,
  Pressable,
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

// EditButton component with press animation
const EditButton = () => {
  const translateY = useRef(new Animated.Value(0)).current;
  
  const handlePressIn = () => {
    Animated.timing(translateY, {
      toValue: 3, // Reduced from 4 to match the new size
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.editButtonContainer}>
      {/* Bottom layer - shadow/base */}
      <View style={styles.editButtonShadow} />
      
      {/* Top layer - animated */}
      <Animated.View 
        style={[
          styles.editButtonTop,
          { transform: [{ translateY }] }
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.editButtonPressable}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default function ProfileScreen() {
  // Mock data for the profile
  const profile = {
    name: "Gavin",
    role: "dater-swiper",
    age: "22",
    gender: "Man",
    height: "6'0\"",
    year: "Sophomore",
    interests: ["Politics", "Sports", "Music", "Pets"],
    dateActivities: ["Voyager", "Jazz Night", "Study Date", "KA Basement"],
    friends: [
      { id: 1, name: "Daniel", avatar: null },
      { id: 2, name: "CJ", avatar: null },
      { id: 3, name: "Cole", avatar: null },
      { id: 4, name: "Maya", avatar: null },
    ]
  };

  // State for tracking selected interests
  const [selectedInterests, setSelectedInterests] = useState(["Music"]);
  
  // Toggle function for interests
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(item => item !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Edit button positioned in top right */}
      <View style={styles.editButtonWrapper}>
        <EditButton />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>{profile.name}</Text>
          <Text style={styles.roleText}>You are a :{profile.role}</Text>
        </View>

        {/* 2. Photo Gallery Section */}
        <View style={styles.photoGallerySection}>
          <View style={styles.leftColumn}>
            <Text style={styles.editLabel}>Edit</Text>
            <View style={styles.mainPhotoContainer}>
              <View style={styles.mainPhoto}>
                <Ionicons name="person" size={80} color={COLORS.mutedBlue} />
              </View>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            {/* <Text style={styles.viewLabel}>View</Text> */}
            <View style={styles.additionalPhotosContainer}>
              <View style={styles.additionalPhoto}>
                <Ionicons name="add" size={32} color={COLORS.primaryNavy} />
              </View>
              <View style={styles.additionalPhoto}>
                <Ionicons name="add" size={32} color={COLORS.primaryNavy} />
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
            <Text style={styles.summaryText}>{profile.age}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.gender}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="resize-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.height}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="school-outline" size={24} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.year}</Text>
          </View>
        </View>

        {/* 4. Interest Tags Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Interests:</Text>
          <View style={styles.tagsContainer}>
            {profile.interests.map((interest, index) => (
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
            {profile.dateActivities.map((activity, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{activity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Divider */}
        <View style={styles.divider} />
        
        {/* 7. Friends Section */}
        <View style={styles.friendsSection}>
          <View style={styles.friendsHeader}>
            <Text style={styles.friendsTitle}>friends:</Text>
            <TouchableOpacity style={styles.addFriendButton}>
              <Text style={styles.addFriendText}>+ new friend</Text>
            </TouchableOpacity>
          </View>
          
          {/* Friends List */}
          <View style={styles.friendsList}>
            {profile.friends.map((friend) => (
              <View key={friend.id} style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Ionicons name="sad-outline" size={24} color={COLORS.primaryNavy} />
                </View>
                <Text style={styles.friendName}>{friend.name}</Text>
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
  
  // Edit Button Styles
  editButtonWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 999, // Ensure button stays on top
  },
  editButtonContainer: {
    width: 88, // Reduced from 110 by 20%
    height: 48, // Reduced from 60 by 20%
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonShadow: {
    position: 'absolute',
    width: 80, // Reduced from 100 by 20%
    height: 40, // Reduced from 50 by 20%
    borderRadius: 20, // Adjusted for smaller size
    backgroundColor: COLORS.buttonShadow,
    bottom: 0,
  },
  editButtonTop: {
    position: 'absolute',
    width: 80, // Reduced from 100 by 20%
    height: 40, // Reduced from 50 by 20%
    borderRadius: 20, // Adjusted for smaller size
    backgroundColor: COLORS.buttonPeach,
    bottom: 3, // Adjusted from 4 for smaller size
  },
  editButtonPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Adjusted for smaller size
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 19, // Reduced from 24 by 20%
    fontWeight: 'bold',
    color: '#000',
  },
  
  // 1. Header Section
  headerSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.primaryNavy,
  },
  roleText: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.mutedBlue,
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
  editLabel: {
    position: "absolute",
    top: 0,
    left: 5,
    fontSize: 12,
    color: COLORS.mutedBlue,
    zIndex: 1,
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
  },
  rightColumn: {
    width: "62%", // Increased to match the reduction in leftColumn
    alignItems: "center",
    paddingLeft: 5, // Add padding to create more space between columns
  },
  viewLabel: {
    fontSize: 14,
    textDecorationLine: "underline",
    color: COLORS.primaryNavy,
    marginBottom: 5,
  },
  additionalPhotosContainer: {
    height: width * 0.35, // Match the height of mainPhoto
    width: "100%",
    justifyContent: "space-between",
  },
  additionalPhoto: {
    height: "47%",
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.skyBlue,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 8,
    color: COLORS.primaryNavy,
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
  
  // 6. Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.mutedBlue,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  
  // 7. Friends Section
  friendsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  friendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  friendsTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: COLORS.primaryNavy,
    fontFamily: Platform.OS === 'ios' ? 'Gill Sans' : 'sans-serif-light',
  },
  addFriendButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  addFriendText: {
    fontSize: 14,
    color: COLORS.primaryNavy,
  },
  friendsList: {
    marginTop: 8,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  friendName: {
    fontSize: 24,
    color: COLORS.primaryNavy,
    fontWeight: "400",
    fontFamily: Platform.OS === 'ios' ? 'Gill Sans' : 'sans-serif',
  },
  
  // Extra bottom padding
  bottomPadding: {
    height: 20,
  }
});