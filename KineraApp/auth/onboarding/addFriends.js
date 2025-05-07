import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import User from "../../models/User";

// Mock users map
const MOCK_USERS = [
  { id: 1, name: "Daniel Mnat" },
  { id: 2, name: "CJ Indart" },
  { id: 3, name: "Cole Sprout" },
  { id: 4, name: "Maya Avital" },
  { id: 5, name: "Gavin West" },
  { id: 6, name: "Madison Wu" },
  { id: 7, name: "Alex Chen" },
  { id: 8, name: "Sam Patel" },
];

export default function AddFriendsScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const { setUser } = useAuth();

  const handleSearch = (text) => {
    setSearch(text);
    if (text.trim() === "") {
      setSearchResults([]);
      return;
    }
    const results = MOCK_USERS.filter(
      (user) =>
        user.name.toLowerCase().includes(text.trim().toLowerCase()) &&
        !friends.some((f) => f.id === user.id)
    );
    setSearchResults(results);
  };

  const handleSelectUser = (user) => {
    setFriends([...friends, user]);
    setSearch("");
    setSearchResults([]);
  };

  const handleRemoveFriend = (id) => {
    setFriends(friends.filter((f) => f.id !== id));
  };

  const handleFinish = async () => {
    // Placeholder for backend logic
    console.log(
      "Submitting friends to backend:",
      friends.map((f) => f.name)
    );
    try {
      // Get existing user data first
      const existingUserData = await AsyncStorage.getItem("user");
      let userData = existingUserData ? JSON.parse(existingUserData) : {};
      
      // Add/update fields instead of replacing everything
      userData = {
        ...userData,
        isAuthenticated: true,
        friends: friends.map((f) => ({ 
          id: f.id,
          name: f.name,
          avatar: null // No avatars in demo data
        }))
      };
      
      // Structure the data correctly for the User model
      if (!userData.profileData) {
        userData.profileData = {};
      }
      
      // If individual fields were stored during onboarding, move them to profileData
      if (userData.age) {
        userData.profileData.age = userData.age;
        delete userData.age;
      }
      
      if (userData.gender) {
        userData.profileData.gender = userData.gender;
        delete userData.gender;
      }
      
      if (userData.height) {
        userData.profileData.height = userData.height;
        delete userData.height;
      }
      
      if (userData.classYear) {
        userData.profileData.year = userData.classYear;
        delete userData.classYear;
      }
      
      if (userData.interests) {
        userData.profileData.interests = userData.interests;
        delete userData.interests;
      }
      
      if (userData.activities) {
        userData.profileData.dateActivities = userData.activities;
        delete userData.activities;
      }
      
      if (userData.photos) {
        userData.profileData.photos = userData.photos;
        delete userData.photos;
      }
      
      // Save the updated user data
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      
      // Create User object and update AuthContext state to reflect changes immediately
      const userObject = new User(userData);
      console.log("Created user object after onboarding:", userObject);
      setUser(userObject);
      
      // Navigate to Main
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            state: {
              routes: [
                {
                  name: "HomeTab",
                  state: {
                    routes: [
                      {
                        name: "HomeMain",
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error saving auth status:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Add friends to your group!</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by name..."
        value={search}
        onChangeText={handleSearch}
      />
      {searchResults.length > 0 && (
        <View style={styles.dropdown}>
          {searchResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.dropdownItem}
              onPress={() => handleSelectUser(user)}
            >
              <Text style={styles.dropdownText}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.friendsList}>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendTag}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <TouchableOpacity
              style={styles.removeIconContainer}
              onPress={() => handleRemoveFriend(friend.id)}
            >
              <Ionicons name="close-circle" size={18} color="#325475" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Finish</Text>
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
  title: {
    fontSize: 32,
    color: "#3A5A6A",
    fontWeight: "400",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  input: {
    borderWidth: 2,
    borderColor: "#3A5A6A",
    borderRadius: 18,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
    color: "#3A5A6A",
    backgroundColor: "#F8F9FB",
  },
  dropdown: {
    backgroundColor: "#E6EEF3",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#3A5A6A",
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#A9B7C5",
  },
  dropdownText: {
    fontSize: 18,
    color: "#3A5A6A",
  },
  friendsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginBottom: 24,
  },
  friendTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6EEF4",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: "#325475",
  },
  friendName: {
    fontSize: 16,
    color: "#325475",
    marginRight: 8,
  },
  removeIconContainer: {
    justifyContent: "center",
    alignItems: "center",
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
});
