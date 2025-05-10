import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

// Our app colors matching the login screen
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

const USER_TYPE_OPTIONS = [
  { 
    label: "Match Maker", 
    value: "match_maker",
    icon: "people-outline",
    description: "Set up your friends with potential matches. Choose friends to add to your network and suggest pairings."
  },
  { 
    label: "Dater", 
    value: "dater",
    icon: "heart-outline",
    description: "Get matched by your friends and discover new people through trusted connections."
  },
  { 
    label: "Both Roles", 
    value: "both",
    icon: "star-outline",
    description: "Enjoy the full Kinera experience - find matches for your friends and get matched yourself."
  },
];

export default function Step3PurposeScreen({ navigation, route }) {
  const [selected, setSelected] = useState(null);
  const [userName, setUserName] = useState("");
  const { updateProfile } = useAuth();
  
  // Get username when component mounts
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUserName(parsedData.name || "");
          
          // Check if user type is already set during login
          if (parsedData.userType) {
            console.log("User type already set during login:", parsedData.userType);
            setSelected(parsedData.userType);
            
            // Convert userType format for compatibility with the app
            let userTypeValue;
            switch(parsedData.userType) {
              case "match_maker":
                userTypeValue = "Match Maker";
                break;
              case "dater":
                userTypeValue = "Dater";
                break;
              case "both":
                userTypeValue = "Dater & Match Maker";
                break;
              default:
                userTypeValue = parsedData.userType;
            }
            
            // Only update the stored userType if needed, but DON'T navigate away
            if (userTypeValue !== parsedData.userType) {
              await updateProfile({ userType: userTypeValue });
            }
            
            // REMOVED: Automatic navigation - let the user manually press Continue
          }
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
      }
    };
    
    getUserInfo();
  }, [updateProfile, navigation]);

  const handleContinue = async () => {
    if (!selected) return;
    
    try {
      console.log("UserType: User selected type, navigating to Profile...");
      
      // Convert userType format for compatibility with the app
      let userTypeValue;
      switch(selected) {
        case "match_maker":
          userTypeValue = "Match Maker";
          break;
        case "dater":
          userTypeValue = "Dater";
          break;
        case "both":
          userTypeValue = "Dater & Match Maker";
          break;
        default:
          userTypeValue = selected;
      }
      
      // Save the userType in the standard format
      // First, save to Firestore through updateProfile
      await updateProfile({ userType: userTypeValue });
      console.log(`UserType: Saved user type as "${userTypeValue}" to Firestore`);
      
      // Also save to AsyncStorage as a backup
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedData = JSON.parse(userData);
          const updatedData = { ...parsedData, userType: userTypeValue };
          await AsyncStorage.setItem('user', JSON.stringify(updatedData));
          console.log("UserType: Also saved to AsyncStorage as backup");
        }
      } catch (storageError) {
        console.log("UserType: Failed to update AsyncStorage, but Firestore update succeeded");
      }
      
      // FORCE navigation to Profile immediately - high priority
      console.log("UserType: FORCING navigation to Profile...");
      
      // Additional safety: Mark this navigation as done
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      // Create animation parameters - explicitly set all flags to true
      const animationParams = {
        showWelcome: true,
        isNewUser: true,
        fromOnboarding: true
      };
      
      console.log("UserType: Passing animation parameters:", JSON.stringify(animationParams));
      
      // Include a delay to ensure Firestore update completes
      setTimeout(() => {
        // Immediate navigation with no delay
        navigation.reset({
          index: 0,
          routes: [
            { 
              name: 'Main',
              params: { 
                screen: 'ProfileTab', // Directly specify the ProfileTab
                params: animationParams
              }
            }
          ]
        });
      }, 300); // Short delay to ensure data is saved
    } catch (error) {
      console.error("Error saving user type:", error);
      Alert.alert("Error", "There was a problem saving your selection.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primaryNavy} />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>
            Hi{userName ? `, ${userName}` : ""}!
          </Text>
          <Text style={styles.title}>How will you use Kinera?</Text>
          <Text style={styles.subtitle}>
            Select your role in our matchmaking community
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {USER_TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                selected === option.value && styles.selectedCard,
              ]}
              onPress={() => setSelected(option.value)}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons 
                  name={option.icon} 
                  size={34} 
                  color={COLORS.primaryNavy} 
                />
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selected === option.value && styles.selectedText,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    selected === option.value && styles.selectedDescriptionText,
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              <View style={styles.checkboxContainer}>
                <View 
                  style={[
                    styles.checkbox,
                    selected === option.value && styles.checkedBox
                  ]}
                >
                  {selected === option.value && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 20,
    color: COLORS.accentOrange,
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    color: COLORS.primaryNavy,
    fontWeight: "600",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mutedBlue,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: "row",
    backgroundColor: COLORS.paleBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.skyBlue,
  },
  selectedCard: {
    backgroundColor: COLORS.primaryNavy,
    borderColor: COLORS.primaryNavy,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primaryNavy,
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.mutedBlue,
    lineHeight: 20,
  },
  selectedText: {
    color: "#fff",
  },
  selectedDescriptionText: {
    color: COLORS.skyBlue,
  },
  checkboxContainer: {
    paddingLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.skyBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: COLORS.accentOrange,
    borderColor: COLORS.accentOrange,
  },
  continueButton: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: COLORS.mutedBlue,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
