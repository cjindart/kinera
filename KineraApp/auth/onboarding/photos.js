import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Step2UploadPhotos({ navigation, route }) {
  const [photos, setPhotos] = useState([null, null, null, null]);

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      // Optionally, check cameraStatus.status and mediaStatus.status === 'granted'
    })();
  }, []);

  // Helper to pick or take a photo
  const pickImage = async (index) => {
    Alert.alert(
      "Add Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaType.Image,
              allowsEditing: true,
              aspect: [4, 5],
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              updatePhoto(index, result.assets[0].uri);
            }
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaType.Image,
              allowsEditing: true,
              aspect: [4, 5],
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              updatePhoto(index, result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const updatePhoto = (index, uri) => {
    const newPhotos = [...photos];
    newPhotos[index] = uri;
    setPhotos(newPhotos);
  };

  const handleContinue = async () => {
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
            onPress={() => pickImage(i)}
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
    top: 20,
    left: 10,
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
