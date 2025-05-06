import React, { useState, useRef, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use try-catch for imports that might not be available
let ImagePicker;
try {
  ImagePicker = require("expo-image-picker");
} catch (error) {
  console.warn("expo-image-picker is not available:", error.message);
  // Create a mock ImagePicker to prevent crashes
  ImagePicker = {
    MediaTypeOptions: { Images: "images" },
    requestCameraPermissionsAsync: async () => ({ granted: false }),
    requestMediaLibraryPermissionsAsync: async () => ({ granted: false }),
    launchImageLibraryAsync: async () => ({ canceled: true }),
    launchCameraAsync: async () => ({ canceled: true }),
  };
}

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
const { width, height } = Dimensions.get("window");

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
        style={[styles.editButtonTop, { transform: [{ translateY }] }]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.editButtonPressable}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? "Done" : "Edit"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default function ProfileScreen() {
  // State to track whether profile is in edit mode
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();

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
    ],
  };

  // State for photos - update to support more photos
  const [mainPhoto, setMainPhoto] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const MAX_PHOTOS = 5; // Maximum number of photos (including main photo)

  // State for tracking selected interests and edited data
  const [selectedInterests, setSelectedInterests] = useState(["Music"]);
  const [interests, setInterests] = useState(profile.interests);
  const [dateActivities, setDateActivities] = useState(profile.dateActivities);
  const [newInterestText, setNewInterestText] = useState("");
  const [newActivityText, setNewActivityText] = useState("");

  // Request camera and media library permissions on component mount
  useEffect(() => {
    (async () => {
      // Skip permission requests if ImagePicker is not available
      if (
        !ImagePicker.requestCameraPermissionsAsync ||
        !ImagePicker.requestMediaLibraryPermissionsAsync
      ) {
        console.warn(
          "Skipping camera permissions - ImagePicker not fully available"
        );
        return;
      }

      try {
        const cameraPermission =
          await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!cameraPermission.granted) {
          console.warn("Camera permission not granted");
        }

        if (!mediaLibraryPermission.granted) {
          console.warn("Media library permission not granted");
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
      }
    })();
  }, []);

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);

    // Clear input fields when exiting edit mode
    if (isEditing) {
      setNewInterestText("");
      setNewActivityText("");
    }
  };

  const handleLogout = async () => {
    try {
      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem("user");

      // Navigate back to auth flow
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Toggle function for interests
  const toggleInterest = (interest) => {
    if (isEditing) {
      // In edit mode, remove the interest
      setInterests(interests.filter((item) => item !== interest));
    } else {
      // In view mode, select/deselect the interest
      if (selectedInterests.includes(interest)) {
        setSelectedInterests(
          selectedInterests.filter((item) => item !== interest)
        );
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
    setDateActivities(dateActivities.filter((item) => item !== activity));
  };

  // Updated function to pick an image
  const pickImage = async (index = 0) => {
    try {
      // Check if ImagePicker is properly available
      if (!ImagePicker.launchImageLibraryAsync) {
        Alert.alert(
          "Feature Unavailable",
          "Image picking is not available in this build."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (index === 0) {
          setMainPhoto(result.assets[0].uri);
        } else {
          const newPhotos = [...additionalPhotos];
          // If adding a new photo at the end
          if (index - 1 === additionalPhotos.length) {
            newPhotos.push(result.assets[0].uri);
          } else {
            // Replacing an existing photo
            newPhotos[index - 1] = result.assets[0].uri;
          }
          setAdditionalPhotos(newPhotos);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image. Please try again.");
    }
  };

  // Updated function to take a photo
  const takePhoto = async (index = 0) => {
    try {
      // Check if ImagePicker is properly available
      if (!ImagePicker.launchCameraAsync) {
        Alert.alert(
          "Feature Unavailable",
          "Camera is not available in this build."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (index === 0) {
          setMainPhoto(result.assets[0].uri);
        } else {
          const newPhotos = [...additionalPhotos];
          // If adding a new photo at the end
          if (index - 1 === additionalPhotos.length) {
            newPhotos.push(result.assets[0].uri);
          } else {
            // Replacing an existing photo
            newPhotos[index - 1] = result.assets[0].uri;
          }
          setAdditionalPhotos(newPhotos);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take a photo. Please try again.");
    }
  };

  // Updated function to show image picker options
  const showImagePickerOptions = (index = 0) => {
    if (Platform.OS === "ios") {
      Alert.alert(
        "Choose Photo",
        "Select a photo from your library or take a new one",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: () => takePhoto(index) },
          { text: "Choose from Library", onPress: () => pickImage(index) },
        ]
      );
    } else {
      // For Android, show an ActionSheet or similar component
      Alert.alert(
        "Choose Photo",
        "Select a photo from your library or take a new one",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: () => takePhoto(index) },
          { text: "Choose from Library", onPress: () => pickImage(index) },
        ]
      );
    }
  };

  // Function to handle scroll end for photo indicators
  const handleScrollEnd = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;

    // Calculate which page is visible
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentPhotoIndex(pageNum);
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

        {/* 2. Photo Gallery Section - Horizontal Scrolling */}
        <View style={styles.photoSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoScrollContainer}
            pagingEnabled
            decelerationRate="fast"
            onMomentumScrollEnd={handleScrollEnd}
          >
            {/* Main profile photo */}
            <View style={styles.photoCard}>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.photoFrame}
                  onPress={() => showImagePickerOptions(0)}
                >
                  {mainPhoto ? (
                    <Image
                      source={{ uri: mainPhoto }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <View style={styles.editPhotoPlaceholder}>
                      <Ionicons
                        name="camera"
                        size={50}
                        color={COLORS.primaryNavy}
                      />
                      <Text style={styles.editPhotoText}>
                        Add Profile Photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.photoFrame}>
                  {mainPhoto ? (
                    <Image
                      source={{ uri: mainPhoto }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={100}
                      color={COLORS.mutedBlue}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Additional photos */}
            {additionalPhotos.map((photo, index) => (
              <View key={`additional-photo-${index}`} style={styles.photoCard}>
                {
                  isEditing ? (
                    <TouchableOpacity
                      style={styles.photoFrame}
                      onPress={() => showImagePickerOptions(index + 1)}
                    >
                      {photo ? (
                        <Image
                          source={{ uri: photo }}
                          style={styles.photoImage}
                        />
                      ) : (
                        <View style={styles.editPhotoPlaceholder}>
                          <Ionicons
                            name="add-circle"
                            size={50}
                            color={COLORS.primaryNavy}
                          />
                          <Text style={styles.editPhotoText}>
                            Add Photo {index + 1}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : photo ? (
                    <View style={styles.photoFrame}>
                      <Image
                        source={{ uri: photo }}
                        style={styles.photoImage}
                      />
                    </View>
                  ) : null // Don't show empty photo slots in view mode
                }
              </View>
            ))}

            {/* "Add Photo" container - only shown in edit mode and if there's room for more photos */}
            {isEditing && mainPhoto && additionalPhotos.length < MAX_PHOTOS - 1 && (
              <View key="add-photo-container" style={styles.photoCard}>
                <TouchableOpacity
                  style={styles.photoFrame}
                  onPress={() => showImagePickerOptions(additionalPhotos.length + 1)}
                >
                  <View style={styles.editPhotoPlaceholder}>
                    <Ionicons
                      name="add-circle"
                      size={50}
                      color={COLORS.primaryNavy}
                    />
                    <Text style={styles.editPhotoText}>
                      Add Photo {additionalPhotos.length + 1}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Photo indicator dots */}
          <View style={styles.photoIndicators}>
            {/* Only show main photo indicator if it exists */}
            {(mainPhoto || isEditing) && (
              <View
                key="main-photo-indicator"
                style={[
                  styles.indicatorDot,
                  currentPhotoIndex === 0 && styles.activeDot,
                ]}
              />
            )}
            
            {/* Indicators for additional photos */}
            {additionalPhotos.map((_, index) => (
              <View
                key={`photo-indicator-${index}`}
                style={[
                  styles.indicatorDot,
                  currentPhotoIndex === index + 1 && styles.activeDot,
                ]}
              />
            ))}
            
            {/* Add photo indicator in edit mode */}
            {isEditing && mainPhoto && additionalPhotos.length < MAX_PHOTOS - 1 && (
              <View
                key="add-photo-indicator"
                style={[
                  styles.indicatorDot,
                  currentPhotoIndex === additionalPhotos.length + 1 && styles.activeDot,
                ]}
              />
            )}
          </View>
        </View>

        {/* 3. Profile Summary Bar */}
        <View style={styles.summaryBarSection}>
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{profile.age}</Text>
          </View>

          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="person-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{profile.gender}</Text>
          </View>

          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="resize-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{profile.height}</Text>
          </View>

          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="school-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
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
                  !isEditing &&
                    selectedInterests.includes(interest) &&
                    styles.selectedTagPill,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.tagText,
                    !isEditing &&
                      selectedInterests.includes(interest) &&
                      styles.selectedTagText,
                  ]}
                >
                  {interest}
                </Text>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.removeIconContainer}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLORS.primaryNavy}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Favorite Date Activities Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              Favorite Stanford date activities:
            </Text>
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
              <View
                key={index}
                style={[
                  styles.tagPill,
                  isEditing ? styles.editableTagPill : null,
                ]}
              >
                <Text style={styles.tagText}>{activity}</Text>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.removeIconContainer}
                    onPress={() => removeActivity(activity)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={COLORS.primaryNavy}
                    />
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
                  <Ionicons
                    name="sad-outline"
                    size={24}
                    color={COLORS.primaryNavy}
                  />
                </View>
                <Text style={styles.friendName}>{friend.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Divider */}
        <View style={styles.divider} />
        <TouchableOpacity
          title="Logout"
          onPress={() => {
            handleLogout();
          }}
          style={{
            margin: "5%",
            fontFamily: "Gill Sans",
            fontWeight: "bold",
            fontSize: 16,
            color: COLORS.primaryNavy,
            backgroundColor: COLORS.buttonPeach,
            width: "20%",
            borderRadius: 18,
            padding: 10,
            textAlign: "center",
          }}
        >
          <Text>Logout</Text>
        </TouchableOpacity>

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
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonShadow: {
    position: "absolute",
    width: 70, // Adjusted for inline placement
    height: 35, // Adjusted for inline placement
    borderRadius: 18, // Adjusted for smaller size
    backgroundColor: COLORS.buttonShadow,
    bottom: 0,
  },
  editButtonTop: {
    position: "absolute",
    width: 70, // Adjusted for inline placement
    height: 35, // Adjusted for inline placement
    borderRadius: 18, // Adjusted for smaller size
    backgroundColor: COLORS.buttonPeach,
    bottom: 3, // Adjusted from 4 for smaller size
  },
  editButtonPressable: {
    width: "100%",
    height: "100%",
    borderRadius: 18, // Adjusted for smaller size
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 17, // Adjusted for inline placement
    fontWeight: "bold",
    color: "#000",
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
  photoSection: {
    marginVertical: 15,
  },
  photoScrollContainer: {
    // No horizontal padding to allow full width
  },
  photoCard: {
    width: width, // Full screen width
  },
  photoFrame: {
    width: "92%", // Slightly less than full width to provide some margin
    height: width * 0.6, // Larger images
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primaryNavy,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.paleBlue,
    overflow: "hidden",
    marginHorizontal: "4%", // Center the frame
  },
  photoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editPhotoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(196, 215, 229, 0.7)", // Semi-transparent skyBlue
  },
  editPhotoText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primaryNavy,
    marginTop: 12,
  },
  photoIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.skyBlue,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.accentOrange,
    width: 10,
    height: 10,
    borderRadius: 5,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
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
    flexDirection: "row",
    alignItems: "center",
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
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
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
    fontFamily: Platform.OS === "ios" ? "Gill Sans" : "sans-serif-light",
  },
  addFriendButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "white",
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
    backgroundColor: "white",
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
    fontFamily: Platform.OS === "ios" ? "Gill Sans" : "sans-serif",
  },

  // Extra bottom padding
  bottomPadding: {
    height: 20,
  },
});
