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
  TextInput,
  Alert,
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
const EditButton = ({ isEditing, onToggleEdit }) => {
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
    
    // Toggle edit mode when button is released
    onToggleEdit();
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
          <Text style={styles.editButtonText}>{isEditing ? "Done" : "Edit"}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default function ProfileScreen() {
  // State to track whether profile is in edit mode
  const [isEditing, setIsEditing] = useState(false);
  
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

  // State for photos
  const [mainPhoto, setMainPhoto] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([null, null]);

  // State for tracking selected interests and edited data
  const [selectedInterests, setSelectedInterests] = useState(["Music"]);
  const [interests, setInterests] = useState(profile.interests);
  const [dateActivities, setDateActivities] = useState(profile.dateActivities);
  const [newInterestText, setNewInterestText] = useState("");
  const [newActivityText, setNewActivityText] = useState("");
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    
    // Clear input fields when exiting edit mode
    if (isEditing) {
      setNewInterestText("");
      setNewActivityText("");
    }
  };
  
  // Toggle function for interests
  const toggleInterest = (interest) => {
    if (isEditing) {
      // In edit mode, remove the interest
      setInterests(interests.filter(item => item !== interest));
    } else {
      // In view mode, select/deselect the interest
      if (selectedInterests.includes(interest)) {
        setSelectedInterests(selectedInterests.filter(item => item !== interest));
      } else {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  };
  
  // Function to add a new interest
  const addNewInterest = () => {
    if (newInterestText.trim() === "") return;
    
    if (!interests.includes(newInterestText.trim())) {
      setInterests([...interests, newInterestText.trim()]);
      setNewInterestText("");
    } else {
      Alert.alert("Duplicate", "This interest already exists!");
    }
  };
  
  // Function to add a new date activity
  const addNewActivity = () => {
    if (newActivityText.trim() === "") return;
    
    if (!dateActivities.includes(newActivityText.trim())) {
      setDateActivities([...dateActivities, newActivityText.trim()]);
      setNewActivityText("");
    } else {
      Alert.alert("Duplicate", "This activity already exists!");
    }
  };
  
  // Function to remove a date activity
  const removeActivity = (activity) => {
    setDateActivities(dateActivities.filter(item => item !== activity));
  };
  
  // Function to handle photo selection (mock)
  const handlePhotoSelection = (type, index = 0) => {
    if (type === 'main') {
      // This would be replaced with actual image picking code
      Alert.alert("Replace Photo", "Photo selection would open here");
      setMainPhoto('https://via.placeholder.com/300');
    } else if (type === 'additional') {
      const newPhotos = [...additionalPhotos];
      newPhotos[index] = 'https://via.placeholder.com/300';
      setAdditionalPhotos(newPhotos);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.nameContainer}>
              <Text style={styles.headerTitle}>{profile.name}</Text>
              <Text style={styles.roleText}>You are a: {profile.role}</Text>
            </View>
            <EditButton isEditing={isEditing} onToggleEdit={toggleEditMode} />
          </View>
        </View>

        {/* 2. Photo Gallery Section */}
        <View style={styles.photoGallerySection}>
          <View style={styles.leftColumn}>
            {isEditing && <Text style={styles.editLabel}>Edit</Text>}
            <View style={styles.mainPhotoContainer}>
              <View style={styles.mainPhoto}>
                {isEditing ? (
                  <TouchableOpacity 
                    style={styles.editPhotoButton} 
                    onPress={() => handlePhotoSelection('main')}
                  >
                    {mainPhoto ? (
                      <Image source={{ uri: mainPhoto }} style={styles.photoImage} />
                    ) : (
                      <>
                        <Ionicons name="camera" size={40} color={COLORS.primaryNavy} />
                        <Text style={styles.editPhotoText}>Replace</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  mainPhoto ? (
                    <Image source={{ uri: mainPhoto }} style={styles.photoImage} />
                  ) : (
                    <Ionicons name="person" size={80} color={COLORS.mutedBlue} />
                  )
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            <View style={styles.additionalPhotosContainer}>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    style={styles.additionalPhoto} 
                    onPress={() => handlePhotoSelection('additional', 0)}
                  >
                    {additionalPhotos[0] ? (
                      <Image source={{ uri: additionalPhotos[0] }} style={styles.additionalPhotoImage} />
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={32} color={COLORS.primaryNavy} />
                        <Text style={styles.smallEditText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.additionalPhoto}
                    onPress={() => handlePhotoSelection('additional', 1)}
                  >
                    {additionalPhotos[1] ? (
                      <Image source={{ uri: additionalPhotos[1] }} style={styles.additionalPhotoImage} />
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={32} color={COLORS.primaryNavy} />
                        <Text style={styles.smallEditText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.additionalPhoto}>
                    {additionalPhotos[0] ? (
                      <Image source={{ uri: additionalPhotos[0] }} style={styles.additionalPhotoImage} />
                    ) : (
                      <Ionicons name="add" size={32} color={COLORS.primaryNavy} />
                    )}
                  </View>
                  <View style={styles.additionalPhoto}>
                    {additionalPhotos[1] ? (
                      <Image source={{ uri: additionalPhotos[1] }} style={styles.additionalPhotoImage} />
                    ) : (
                      <Ionicons name="add" size={32} color={COLORS.primaryNavy} />
                    )}
                  </View>
                </>
              )}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Interests:</Text>
            {isEditing && (
              <TouchableOpacity 
                style={styles.addCircleButton}
                onPress={() => {
                  if (newInterestText.trim() !== "") {
                    addNewInterest();
                  } else {
                    Alert.alert("Please enter an interest in the field below");
                  }
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.offWhite} />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditing && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a new interest..."
                value={newInterestText}
                onChangeText={setNewInterestText}
                onSubmitEditing={addNewInterest}
              />
            </View>
          )}
          
          <View style={styles.tagsContainer}>
            {interests.map((interest, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tagPill,
                  isEditing ? styles.editableTagPill : null,
                  !isEditing && selectedInterests.includes(interest) && styles.selectedTagPill,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.tagText,
                    !isEditing && selectedInterests.includes(interest) && styles.selectedTagText,
                  ]}
                >
                  {interest}
                </Text>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.removeIconContainer}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.primaryNavy} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Favorite Date Activities Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Favorite date activities:</Text>
            {isEditing && (
              <TouchableOpacity 
                style={styles.addCircleButton}
                onPress={() => {
                  if (newActivityText.trim() !== "") {
                    addNewActivity();
                  } else {
                    Alert.alert("Please enter an activity in the field below");
                  }
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.offWhite} />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditing && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a new date activity..."
                value={newActivityText}
                onChangeText={setNewActivityText}
                onSubmitEditing={addNewActivity}
              />
            </View>
          )}
          
          <View style={styles.tagsContainer}>
            {dateActivities.map((activity, index) => (
              <View key={index} style={[styles.tagPill, isEditing ? styles.editableTagPill : null]}>
                <Text style={styles.tagText}>{activity}</Text>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.removeIconContainer}
                    onPress={() => removeActivity(activity)}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.primaryNavy} />
                  </TouchableOpacity>
                )}
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
  editButtonContainer: {
    width: 80, // Adjusted for inline placement
    height: 40, // Adjusted for inline placement
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonShadow: {
    position: 'absolute',
    width: 70, // Adjusted for inline placement
    height: 35, // Adjusted for inline placement
    borderRadius: 18, // Adjusted for smaller size
    backgroundColor: COLORS.buttonShadow,
    bottom: 0,
  },
  editButtonTop: {
    position: 'absolute',
    width: 70, // Adjusted for inline placement
    height: 35, // Adjusted for inline placement
    borderRadius: 18, // Adjusted for smaller size
    backgroundColor: COLORS.buttonPeach,
    bottom: 3, // Adjusted from 4 for smaller size
  },
  editButtonPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 18, // Adjusted for smaller size
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 17, // Adjusted for inline placement
    fontWeight: 'bold',
    color: '#000',
  },
  
  // 1. Header Section
  headerSection: {
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  nameContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.primaryNavy,
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.mutedBlue,
    marginTop: 0,
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
    overflow: 'hidden',
  },
  editPhotoButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 215, 229, 0.7)', // Semi-transparent skyBlue
  },
  editPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryNavy,
    marginTop: 8,
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
  smallEditText: {
    fontSize: 12,
    color: COLORS.primaryNavy,
    marginTop: 4,
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
    overflow: 'hidden',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.primaryNavy,
  },
  addCircleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.mutedBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: COLORS.paleBlue,
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
  editableTagPill: {
    paddingRight: 25, // Make room for the remove icon
    backgroundColor: COLORS.paleBlue,
    borderColor: COLORS.mutedBlue,
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
  removeIconContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
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