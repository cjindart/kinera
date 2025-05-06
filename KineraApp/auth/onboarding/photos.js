import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Step2UploadPhotos({ navigation, route }) {
  const [photos, setPhotos] = useState([null, null, null, null]);

  useEffect(() => {
    (async () => {
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

  const pickImage = async (index) => {
    try {
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
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updatePhoto(index, result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image. Please try again.");
    }
  };

  const takePhoto = async (index) => {
    try {
      if (!ImagePicker.launchCameraAsync) {
        Alert.alert(
          "Feature Unavailable",
          "Camera is not available in this build."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updatePhoto(index, result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take a photo. Please try again.");
    }
  };

  const showImagePickerOptions = (index) => {
    Alert.alert(
      "Choose Photo",
      "Select a photo from your library or take a new one",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => takePhoto(index) },
        { text: "Choose from Library", onPress: () => pickImage(index) },
      ]
    );
  };

  const updatePhoto = (index, uri) => {
    const newPhotos = [...photos];
    newPhotos[index] = uri;
    setPhotos(newPhotos);
  };

  const handleContinue = async () => {
    // Placeholder for backend logic
    console.log("Submitting photos to backend:", photos);
    try {
      await AsyncStorage.mergeItem("user", JSON.stringify({ photos }));
      //send to backend
      console.log({ photos });
    } catch (error) {
      console.error("Error saving photos to AsyncStorage:", error);
    }

    // Here you would upload the photos to Firebase
    // For now, just pass them to the next step
    //On the final onboarding step, you can upload the images to Firebase Storage
    // and save their URLs to Firestore.
    // You'll need to convert the local URI to a blob and use the Firebase Storage SDK.
    navigation.navigate("Step3", {
      ...route.params, // pass previous onboarding data
      photos,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Upload photos!</Text>
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            style={styles.photoBox}
            onPress={() => showImagePickerOptions(i)}
          >
            {photos[i] ? (
              <Image source={{ uri: photos[i] }} style={styles.photo} />
            ) : (
              <Text style={styles.plus}>+</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  backArrow: {
    position: "absolute",
    top: "5%",
    left: "5%",
    zIndex: 1,
  },
  arrowText: {
    fontSize: 32,
    color: "#3A5A6A",
  },
  title: {
    fontSize: 32,
    color: "#3A5A6A",
    fontWeight: "400",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 32,
    //fontFamily: "Noteworthy-Bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 32,
  },
  photoBox: {
    width: 140,
    height: 180,
    borderWidth: 2,
    borderColor: "#3A5A6A",
    borderRadius: 8,
    margin: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FB",
  },
  plus: {
    fontSize: 48,
    color: "#3A5A6A",
    //fontFamily: "Noteworthy-Bold",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  button: {
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#3A5A6A",
  },
  buttonText: {
    color: "#3A5A6A",
    fontSize: 24,
    // fontFamily: "Noteworthy-Bold",
  },
});
