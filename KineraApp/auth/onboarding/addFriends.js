import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import mockData from "../../assets/mockUserData.json";

export default function AddFriendsScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const { updateProfile, user } = useAuth();

  const handleSearch = (text) => {
    setSearch(text);
    if (text.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Filter mock users based on search query and exclude existing friends
    const results = mockData.users.filter(
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
    console.log(
      "Submitting friends to backend:",
      friends.map((f) => f.name)
    );

    try {
      // Get existing user data first
      const existingUserData = await AsyncStorage.getItem("userData");
      let userData = existingUserData ? JSON.parse(existingUserData) : {};

      // Add/update fields
      userData = {
        ...userData,
        friends: friends.map((friend) => friend.id),
        matches: friends.reduce((acc, friend) => {
          acc[friend.id] = { approvalRate: 0, matchBack: 0 };
          return acc;
        }, {}),
      };

      // Save the updated user data
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Update the user context
      setUser(userData);

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
      console.error("Error completing onboarding:", error);
      Alert.alert(
        "Error",
        "There was a problem saving your information. Please try again."
      );
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
      <View style={styles.inputDropdownContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by name..."
          value={search}
          onChangeText={handleSearch}
        />
        {searchResults.length > 0 && (
          <ScrollView style={styles.dropdown}>
            {searchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.dropdownItem}
                onPress={() => handleSelectUser(user)}
              >
                <View style={styles.searchResultContent}>
                  <View style={styles.searchResultAvatar}>
                    {user.photos?.[0] ? (
                      <Image
                        source={{ uri: user.photos[0] }}
                        style={styles.searchResultAvatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={24} color="#325475" />
                    )}
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.dropdownText}>{user.name}</Text>
                    <Text style={styles.dropdownSubtext}>
                      {user.profileData?.year} • {user.profileData?.gender}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.friendsList}>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendTag}>
            <View style={styles.friendContent}>
              <View style={styles.friendAvatar}>
                {friend.photos?.[0] ? (
                  <Image
                    source={{ uri: friend.photos[0] }}
                    style={styles.friendAvatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={24} color="#325475" />
                )}
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendSubtext}>
                  {friend.profileData?.year} • {friend.profileData?.gender}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeIconContainer}
                onPress={() => handleRemoveFriend(friend.id)}
              >
                <Ionicons name="close-circle" size={18} color="#325475" />
              </TouchableOpacity>
            </View>
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
  inputDropdownContainer: {
    position: "relative",
    zIndex: 10,
  },
  dropdown: {
    position: "absolute",
    top: 60, // height of input + margin
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A5A6A",
    maxHeight: 180,
    zIndex: 100,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#A9B7C5",
  },
  searchResultContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6EEF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchResultAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchResultInfo: {
    flex: 1,
  },
  dropdownText: {
    fontSize: 18,
    color: "#3A5A6A",
    fontWeight: "500",
  },
  dropdownSubtext: {
    fontSize: 14,
    color: "#A9B7C5",
    marginTop: 2,
  },
  friendsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
    marginHorizontal: 15,
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
  friendContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E6EEF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  friendAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    color: "#325475",
    fontWeight: "500",
  },
  friendSubtext: {
    fontSize: 12,
    color: "#A9B7C5",
    marginTop: 2,
  },
  removeIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
