import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";

const AGE_RANGE = Array.from({ length: 13 }, (_, i) => 18 + i); // 18-30
const CLASS_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Grad Student",
  "Post-Grad",
];
const FEET_OPTIONS = [4, 5, 6, 7];
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

export default function AgeClassHeightScreen({ navigation }) {
  const [age, setAge] = useState(19);
  const [classYear, setClassYear] = useState("Sophomore");
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);

  const handleContinue = () => {
    // Placeholder for backend logic
    console.log("Submitting to backend:", {
      age,
      classYear,
      height: `${feet}'${inches}"`,
    });
    // Save or pass data as needed
    navigation.navigate("Step6", {
      age,
      classYear,
      height: `${feet}'${inches}"`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>
      {/* <Text style={styles.title}>How old are you?</Text> */}

      {/* <ScrollView> */}
      {/* Age Picker */}
      <View style={styles.pickerGroup}>
        <Text style={styles.label}>How Old Are You?</Text>
        <View style={styles.singlePickerWrapper}>
          <Picker
            selectedValue={age}
            onValueChange={setAge}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {AGE_RANGE.map((a) => (
              <Picker.Item key={a} label={a.toString()} value={a} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Class Picker */}
      <View style={styles.pickerGroup}>
        <Text style={styles.label}>What year are you in school?</Text>
        <View style={styles.singlePickerWrapper}>
          <Picker
            selectedValue={classYear}
            onValueChange={setClassYear}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {CLASS_OPTIONS.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Height Picker */}
      <View style={styles.pickerGroup}>
        <Text style={styles.label}>How tall are you?</Text>
        <View style={styles.heightPickersRow}>
          <View style={styles.heightPickerWrapper}>
            <Picker
              selectedValue={feet}
              onValueChange={setFeet}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {FEET_OPTIONS.map((f) => (
                <Picker.Item key={f} label={`${f}'`} value={f} />
              ))}
            </Picker>
          </View>
          <View style={styles.heightPickerWrapper}>
            <Picker
              selectedValue={inches}
              onValueChange={setInches}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {INCHES_OPTIONS.map((inch) => (
                <Picker.Item key={inch} label={`${inch}\"`} value={inch} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      {/* </ScrollView> */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  backArrow: { position: "absolute", top: "5%", left: "5%", zIndex: 1 },
  arrowText: { fontSize: 32, color: "#3A5A6A" },
  title: {
    fontSize: 32,
    color: "#3A5A6A",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 8,
  },
  pickerGroup: {
    marginTop: 10,
    marginBottom: 40,
  },
  label: {
    fontSize: 24,
    color: "#3A5A6A",
    marginBottom: 0,
    marginLeft: 4,
    alignSelf: "center",
  },
  singlePickerWrapper: {
    borderBottomWidth: 1,
    borderColor: "#3A5A6A",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 120, // taller for scroll effect
    width: "100%",
  },
  pickerItem: { fontSize: 24, color: "#3A5A6A" },
  heightPickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heightPickerWrapper: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#3A5A6A",
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
  },
  button: {
    marginTop: 40,
    backgroundColor: "#E6EEF3",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3A5A6A",
  },
  buttonText: { color: "#3A5A6A", fontSize: 24 },
});
