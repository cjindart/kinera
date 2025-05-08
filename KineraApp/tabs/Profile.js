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
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import mockData from "../assets/mockUserData.json";
import FirebaseTest from "../components/FirebaseTest";

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
  const { user, updateProfile, logout, setUser } = useAuth();

  // State for photos
  const [mainPhoto, setMainPhoto] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const MAX_PHOTOS = 5; // Maximum number of photos (including main photo)

  // State for profile data
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [year, setYear] = useState("");
  const [city, setCity] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interests, setInterests] = useState([]);
  const [dateActivities, setDateActivities] = useState([]);
  const [newInterestText, setNewInterestText] = useState("");
  const [newActivityText, setNewActivityText] = useState("");
  const [userType, setUserType] = useState("");
  const [isAddFriendsModalVisible, setIsAddFriendsModalVisible] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      console.log(
        "Loading user profile data:",
        JSON.stringify(
          {
            name: user.name,
            userType: user.userType,
            profileDataExists: !!user.profileData,
            profileData: user.profileData
              ? {
                  age: user.profileData.age,
                  gender: user.profileData.gender,
                  height: user.profileData.height,
                  year: user.profileData.year,
                  interestsCount: user.profileData.interests?.length || 0,
                  activitiesCount: user.profileData.dateActivities?.length || 0,
                  photosCount: user.profileData.photos?.length || 0,
                }
              : null,
            friendsCount: user.friends?.length || 0,
            friends: user.friends || [],
            standAloneFields: {
              age: user.age,
              gender: user.gender,
              height: user.height,
            },
          },
          null,
          2
        )
      );

      // Basic info
      setName(user.name || "");
      setUserType(user.userType || "");

      // Profile data from profileData object
      if (user.profileData) {
        // Convert age to string for TextInput
        setAge(user.profileData.age?.toString() || "");
        setGender(user.profileData.gender || "");
        setHeight(user.profileData.height || "");
        setYear(user.profileData.year || user.profileData.classYear || "");

        setCity(user.profileData.city || "");

        // Interests and activities
        const userInterests = user.profileData.interests || [];
        setInterests(userInterests);

        const userActivities =
          user.profileData.dateActivities || user.profileData.activities || [];
        setDateActivities(userActivities);

        // Load photos
        if (user.profileData.photos && user.profileData.photos.length > 0) {
          setMainPhoto(user.profileData.photos[0]);
          setAdditionalPhotos(user.profileData.photos.slice(1));
        }

        // Set default selected interest
        if (userInterests.length > 0) {
          setSelectedInterests([userInterests[0]]);
        }
      }

      // Direct properties (in case they're not in profileData)
      if (!user.profileData?.age && user.age) {
        setAge(user.age.toString());
      }

      if (!user.profileData?.gender && user.gender) {
        setGender(user.gender);
      }

      if (!user.profileData?.height && user.height) {
        setHeight(user.height);
      }

      if (
        !user.profileData?.year &&
        !user.profileData?.classYear &&
        user.classYear
      ) {
        setYear(user.classYear);
      }

      if (!user.profileData?.interests && user.interests) {
        setInterests(user.interests);
        if (user.interests.length > 0) {
          setSelectedInterests([user.interests[0]]);
        }
      }

      if (
        !user.profileData?.dateActivities &&
        !user.profileData?.activities &&
        user.activities
      ) {
        setDateActivities(user.activities);
      }

      if (!user.profileData?.photos && user.photos && user.photos.length > 0) {
        setMainPhoto(user.photos[0]);
        setAdditionalPhotos(user.photos.slice(1));
      }
    }
  }, [user]);

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

  // Toggle edit mode and save changes if exiting edit mode
  const toggleEditMode = async () => {
    if (isEditing) {
      // Save changes
      try {
        console.log("Saving profile changes");

        // Get all photo URLs
        const allPhotos = mainPhoto
          ? [mainPhoto, ...additionalPhotos.filter(Boolean)]
          : [];

        // Create updated user data
        const updatedUserData = {
          ...user,
          profileData: {
            ...user.profileData,
            age: age ? parseInt(age, 10) : null,
            gender,
            height,
            year,
            city,
            interests,
            dateActivities,
            photos: allPhotos,
          },
          userType: userType || user.userType, // Preserve existing userType if not changed
        };

        // Save to AsyncStorage
        try {
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(updatedUserData)
          );
          console.log("User data saved to AsyncStorage");
        } catch (storageError) {
          console.error("Error saving to AsyncStorage:", storageError);
        }

        // Update Firebase if needed
        if (user.id) {
          try {
            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, {
              profileData: updatedUserData.profileData,
              userType: updatedUserData.userType,
            });
            console.log("User data updated in Firebase");
          } catch (firebaseError) {
            console.error("Error updating Firebase:", firebaseError);
          }
        }

        // Update the user context

        await updateProfile(updatedUserData);

        console.log("Profile data saved successfully");
      } catch (error) {
        console.error("Error saving profile data:", error);
        Alert.alert(
          "Error",
          "Failed to save profile changes. Please try again."
        );
      }
    }

    // Toggle edit mode
    setIsEditing(!isEditing);

    // Clear input fields when exiting edit mode
    if (isEditing) {
      setNewInterestText("");
      setNewActivityText("");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const success = await logout();

      if (success) {
        // Navigate back to auth flow
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        });
      } else {
        Alert.alert("Error", "Failed to log out. Please try again.");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Toggle function for interests
  const toggleInterest = (interest) => {
    if (isEditing) {
      // In edit mode, remove the interest
      setInterests(interests.filter((item) => item !== interest));
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

  // Function to upload image to Firebase Storage
  const uploadImageToFirebase = async (uri) => {
    try {
      // Fetch the image data
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a reference to Firebase Storage
      const storage = getStorage();
      const filename = `profiles/${user.id}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload the image
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
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
        const imageUri = result.assets[0].uri;
        // For demo purposes, we'll just use the local URI
        // In production, we would upload to Firebase Storage
        /*
        try {
          const firebaseUrl = await uploadImageToFirebase(imageUri);
          
          if (index === 0) {
            setMainPhoto(firebaseUrl);
          } else {
            const newPhotos = [...additionalPhotos];
            // If adding a new photo at the end
            if (index - 1 === additionalPhotos.length) {
              newPhotos.push(firebaseUrl);
            } else {
              // Replacing an existing photo
              newPhotos[index - 1] = firebaseUrl;
            }
            setAdditionalPhotos(newPhotos);
          }
        } catch (error) {
          console.error("Error uploading to Firebase:", error);
          Alert.alert("Error", "Failed to upload image. Please try again.");
        }
        */

        // Use local URI for now
        if (index === 0) {
          setMainPhoto(imageUri);
        } else {
          const newPhotos = [...additionalPhotos];
          // If adding a new photo at the end
          if (index - 1 === additionalPhotos.length) {
            newPhotos.push(imageUri);
          } else {
            // Replacing an existing photo
            newPhotos[index - 1] = imageUri;
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
        const imageUri = result.assets[0].uri;

        // For demo purposes, we'll just use the local URI
        // In production, we would upload to Firebase Storage
        /*
        try {
          const firebaseUrl = await uploadImageToFirebase(imageUri);
          
          if (index === 0) {
            setMainPhoto(firebaseUrl);
          } else {
            const newPhotos = [...additionalPhotos];
            // If adding a new photo at the end
            if (index - 1 === additionalPhotos.length) {
              newPhotos.push(firebaseUrl);
            } else {
              // Replacing an existing photo
              newPhotos[index - 1] = firebaseUrl;
            }
            setAdditionalPhotos(newPhotos);
          }
        } catch (error) {
          console.error("Error uploading to Firebase:", error);
          Alert.alert("Error", "Failed to upload image. Please try again.");
        }
        */

        // Use local URI for now
        if (index === 0) {
          setMainPhoto(imageUri);
        } else {
          const newPhotos = [...additionalPhotos];
          // If adding a new photo at the end
          if (index - 1 === additionalPhotos.length) {
            newPhotos.push(imageUri);
          } else {
            // Replacing an existing photo
            newPhotos[index - 1] = imageUri;
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

  // Function to handle friend search
  const handleFriendSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Filter mock users based on search query and exclude existing friends
    const results = mockData.users.filter(
      (user) =>
        user.name.toLowerCase().includes(text.trim().toLowerCase()) &&
        !user.friends?.includes(user.id)
    );
    setSearchResults(results);
  };

  // Function to add a friend
  const handleAddFriend = async (friendId) => {
    try {
      const friend = mockData.users.find((user) => user.id === friendId);
      if (!friend) return;

      const updatedFriends = [...(user.friends || []), friendId];

      // Update user data
      const updatedUserData = {
        ...user,
        friends: updatedFriends,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

      // Update the user context directly
      setUser(updatedUserData);

      // Clear search
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding friend:", error);
      Alert.alert("Error", "Failed to add friend. Please try again.");
    }
  };

  // Function to remove a friend
  const handleRemoveFriend = async (friendId) => {
    try {
      const updatedFriends = user.friends.filter((id) => id !== friendId);

      // Update user data
      const updatedUserData = {
        ...user,
        friends: updatedFriends,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));

      // Update the user context directly
      setUser(updatedUserData);
    } catch (error) {
      console.error("Error removing friend:", error);
      Alert.alert("Error", "Failed to remove friend. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.nameContainer}>
              <Text style={styles.headerTitle}>{name}</Text>
              <Text style={styles.roleText}>You are a: {userType}</Text>
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
            {isEditing &&
              mainPhoto &&
              additionalPhotos.length < MAX_PHOTOS - 1 && (
                <View key="add-photo-container" style={styles.photoCard}>
                  <TouchableOpacity
                    style={styles.photoFrame}
                    onPress={() =>
                      showImagePickerOptions(additionalPhotos.length + 1)
                    }
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
            {isEditing &&
              mainPhoto &&
              additionalPhotos.length < MAX_PHOTOS - 1 && (
                <View
                  key="add-photo-indicator"
                  style={[
                    styles.indicatorDot,
                    currentPhotoIndex === additionalPhotos.length + 1 &&
                      styles.activeDot,
                  ]}
                />
              )}
          </View>
        </View>

        {/* 3. Profile Summary Bar */}
        <View style={styles.summaryBarSection}>
          <TouchableOpacity
            style={styles.summaryBlock}
            onPress={() => {
              if (isEditing) {
                Alert.prompt(
                  "Edit Age",
                  "Enter your age:",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Save",
                      onPress: (newAge) => {
                        if (newAge && !isNaN(newAge)) {
                          setAge(newAge);
                        } else {
                          Alert.alert(
                            "Invalid Input",
                            "Please enter a valid age"
                          );
                        }
                      },
                    },
                  ],
                  "plain-text",
                  age
                );
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{age || "-"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryBlock}
            onPress={() => {
              if (isEditing) {
                Alert.alert("Edit Gender", "Select your gender:", [
                  {
                    text: "Male",
                    onPress: () => setGender("Male"),
                  },
                  {
                    text: "Female",
                    onPress: () => setGender("Female"),
                  },
                  {
                    text: "Input another gender",
                    onPress: () =>
                      Alert.prompt(
                        "Input Gender",
                        "Enter your gender:",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Save",
                            onPress: (newGender) => {
                              setGender(newGender);
                            },
                          },
                        ],
                        "plain-text"
                      ),
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ]);
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="person-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{gender || "-"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryBlock}
            onPress={() => {
              if (isEditing) {
                Alert.prompt(
                  "Edit Height",
                  "Enter your height (e.g., 5'7):",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Save",
                      onPress: (newHeight) => {
                        if (newHeight) {
                          setHeight(newHeight);
                        }
                      },
                    },
                  ],
                  "plain-text",
                  height
                );
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="resize-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{height || "-"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryBlock}
            onPress={() => {
              if (isEditing) {
                Alert.alert("Edit Year", "Select your year:", [
                  {
                    text: "Freshman",
                    onPress: () => setYear("Freshman"),
                  },
                  {
                    text: "Sophomore",
                    onPress: () => setYear("Sophomore"),
                  },
                  {
                    text: "Junior",
                    onPress: () => setYear("Junior"),
                  },
                  {
                    text: "Senior",
                    onPress: () => setYear("Senior"),
                  },
                  {
                    text: "Grad-Student",
                    onPress: () => setYear("Grad-Student"),
                  },
                  {
                    text: "Post-Grad",
                    onPress: () => setYear("Post-Grad"),
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ]);
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="school-outline"
                size={24}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.summaryText}>{year || "-"}</Text>
          </TouchableOpacity>
        </View>

        {/* City display */}
        {city && (
          <View style={styles.cityContainer}>
            <View style={styles.cityIconContainer}>
              <Ionicons
                name="location-outline"
                size={22}
                color={COLORS.primaryNavy}
              />
            </View>
            <Text style={styles.cityText}>{city}</Text>
          </View>
        )}

        {/* Add Dater-Swiper Edit Button */}
        {isEditing && (
          <TouchableOpacity
            style={styles.daterSwiperButton}
            onPress={() => {
              Alert.alert(
                "Edit Dater or eSwiper Status",
                "Choose your user experience!",
                [
                  {
                    text: "Dater only",
                    onPress: () => setUserType("Dater"),
                  },
                  {
                    text: "Match Maker only",
                    onPress: () => setUserType("Match Maker"),
                  },
                  {
                    text: "Dater & Match Maker",
                    onPress: () => setUserType("Dater & Match Maker"),
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ]
              );
            }}
          >
            <Text style={styles.daterSwiperButtonText}>
              Edit Dater-Swiper Status
            </Text>
          </TouchableOpacity>
        )}

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
                ]}
                onPress={() => isEditing && toggleInterest(interest)}
              >
                <Text style={styles.tagText}>{interest}</Text>
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
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => setIsAddFriendsModalVisible(true)}
            >
              <Text style={styles.addFriendText}>+ new friend</Text>
            </TouchableOpacity>
          </View>

          {/* Friends List */}
          <View style={styles.friendsList}>
            {user?.friends?.map((friendId) => {
              const friend = mockData.users.find(
                (user) => user.id === friendId
              );
              if (!friend) return null;

              return (
                <View key={friendId} style={styles.friendItem}>
                  <View style={styles.friendAvatar}>
                    {friend.photos?.[0] ? (
                      <Image
                        source={{ uri: friend.photos[0] }}
                        style={styles.friendAvatarImage}
                      />
                    ) : (
                      <Ionicons
                        name="person"
                        size={24}
                        color={COLORS.primaryNavy}
                      />
                    )}
                  </View>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeFriendButton}
                      onPress={() => handleRemoveFriend(friendId)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={COLORS.primaryNavy}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {(!user?.friends || user.friends.length === 0) && (
              <Text style={styles.noFriendsText}>
                You haven't added any friends yet
              </Text>
            )}
          </View>
        </View>

        {/* Add Friends Modal */}
        <Modal
          visible={isAddFriendsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAddFriendsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Friends</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsAddFriendsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.primaryNavy} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                value={searchQuery}
                onChangeText={handleFriendSearch}
              />

              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleAddFriend(item.id)}
                  >
                    <View style={styles.searchResultAvatar}>
                      {item.photos?.[0] ? (
                        <Image
                          source={{ uri: item.photos[0] }}
                          style={styles.searchResultAvatarImage}
                        />
                      ) : (
                        <Ionicons
                          name="person"
                          size={24}
                          color={COLORS.primaryNavy}
                        />
                      )}
                    </View>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Ionicons
                      name="add-circle"
                      size={24}
                      color={COLORS.primaryNavy}
                    />
                  </TouchableOpacity>
                )}
                style={styles.searchResultsList}
              />
            </View>
          </View>
        </Modal>

        {/* 6. Divider */}
        <View style={styles.divider} />
        <TouchableOpacity
          onPress={handleLogout}
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

        {/* Add Firebase Test Component */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Firebase Services Test</Text>
          <FirebaseTest />
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
    padding: 8,
    borderRadius: 8,
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
  tagText: {
    fontSize: 14,
    color: COLORS.primaryNavy,
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
  friendAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  removeFriendButton: {
    padding: 5,
  },
  noFriendsText: {
    padding: 20,
    textAlign: "center",
    color: COLORS.mutedBlue,
    fontStyle: "italic",
  },

  // Extra bottom padding
  bottomPadding: {
    height: 20,
  },

  // Add Firebase Test Component
  testSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#325475",
    marginBottom: 10,
  },

  // City display styles
  cityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  cityIconContainer: {
    marginRight: 8,
  },
  cityText: {
    fontSize: 16,
    color: COLORS.primaryNavy,
    fontWeight: "500",
  },

  daterSwiperButton: {
    backgroundColor: COLORS.buttonPeach,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  daterSwiperButtonText: {
    color: COLORS.primaryNavy,
    fontSize: 16,
    fontWeight: "600",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primaryNavy,
  },
  closeButton: {
    padding: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.primaryNavy,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  searchResultsList: {
    maxHeight: "80%",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mutedBlue,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.paleBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchResultAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchResultName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.primaryNavy,
  },
});
