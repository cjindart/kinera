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
  ActionSheetIOS,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

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

  // State for profile photos
  const [mainPhoto, setMainPhoto] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([null, null]);

  // State for tracking selected interests and date activities
  const [selectedInterests, setSelectedInterests] = useState(["Music"]);
  const [interests, setInterests] = useState(profile.interests);
  const [dateActivities, setDateActivities] = useState(profile.dateActivities);
  const [newInterestText, setNewInterestText] = useState("");
  const [newActivityText, setNewActivityText] = useState("");
  
  // Request permissions when component mounts
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          Alert.alert(
            'Permissions Required', 
            'Please allow camera and photo library access to upload profile photos.'
          );
        }
      }
    })();
  }, []);

  // Function to pick an image from the library
  const pickImage = async (photoType, index = 0) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      if (photoType === 'main') {
        setMainPhoto(result.assets[0].uri);
      } else if (photoType === 'additional') {
        const newPhotos = [...additionalPhotos];
        newPhotos[index] = result.assets[0].uri;
        setAdditionalPhotos(newPhotos);
      }
    }
  };

  // Function to take a photo with the camera
  const takePhoto = async (photoType, index = 0) => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      if (photoType === 'main') {
        setMainPhoto(result.assets[0].uri);
      } else if (photoType === 'additional') {
        const newPhotos = [...additionalPhotos];
        newPhotos[index] = result.assets[0].uri;
        setAdditionalPhotos(newPhotos);
      }
    }
  };

  // Function to show image picker options
  const showImagePickerOptions = (photoType, index = 0) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto(photoType, index);
          } else if (buttonIndex === 2) {
            pickImage(photoType, index);
          }
        }
      );
    } else {
      // For Android, we'll use a simple Alert with buttons
      Alert.alert(
        'Choose Photo',
        'Select a photo from your library or take a new one',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => takePhoto(photoType, index) },
          { text: 'Choose from Library', onPress: () => pickImage(photoType, index) },
        ]
      );
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

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
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
                    onPress={() => showImagePickerOptions('main')}
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
                    onPress={() => showImagePickerOptions('additional', 0)}
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
                    onPress={() => showImagePickerOptions('additional', 1)}
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
              <Ionicons name="calendar-outline" size={20} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.age}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={20} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.gender}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="resize-outline" size={20} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.height}</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="school-outline" size={20} color={COLORS.primaryNavy} />
            </View>
            <Text style={styles.summaryText}>{profile.year}</Text>
          </View>
        </View>

        {/* 4. Interest Tags Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Interests:</Text>
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
                  <View style={styles.removeIconContainer}>
                    <Ionicons name="close-circle" size={18} color={COLORS.primaryNavy} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            {/* Add new interest button (only in edit mode) */}
            {isEditing && (
              <View style={styles.addNewTagContainer}>
                <TextInput
                  style={styles.newTagInput}
                  placeholder="New interest..."
                  value={newInterestText}
                  onChangeText={setNewInterestText}
                  onSubmitEditing={addNewInterest}
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={addNewInterest}
                >
                  <Ionicons name="add-circle" size={28} color={COLORS.accentOrange} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 5. Favorite Date Activities Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Favorite date activities:</Text>
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
            
            {/* Add new activity button (only in edit mode) */}
            {isEditing && (
              <View style={styles.addNewTagContainer}>
                <TextInput
                  style={styles.newTagInput}
                  placeholder="New activity..."
                  value={newActivityText}
                  onChangeText={setNewActivityText}
                  onSubmitEditing={addNewActivity}
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={addNewActivity}
                >
                  <Ionicons name="add-circle" size={28} color={COLORS.accentOrange} />
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: COLORS.paleBlue,
  },
  editPhotoText: {
    color: COLORS.primaryNavy,
    marginTop: 5,
    fontSize: 14,
  },
  smallEditText: {
    color: COLORS.primaryNavy,
    fontSize: 12,
    marginTop: 2,
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
    paddingHorizontal: 8, // Reduced from 16
    marginVertical: 15,
    justifyContent: "space-between", // Ensure even spacing
  },
  summaryBlock: {
    paddingHorizontal: 4, // Add horizontal padding instead of flex
    alignItems: "center",
    width: "23%", // Set a fixed width percentage instead of flex: 1
  },
  iconCircle: {
    width: 36, // Slightly reduced from 40
    height: 36, // Slightly reduced from 40
    borderRadius: 18,
    backgroundColor: COLORS.paleBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14, // Reduced from 16
    fontWeight: "500",
    color: COLORS.primaryNavy,
    textAlign: "center", // Ensure text is centered
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  editableTagPill: {
    paddingRight: 6, // Less right padding to accommodate the X icon
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
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  newTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.skyBlue,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.primaryNavy,
    backgroundColor: COLORS.paleBlue,
  },
  addTagButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  
  // Photo styles
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
});