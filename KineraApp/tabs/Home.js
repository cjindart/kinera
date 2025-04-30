import React from "react";
import { View, Text, StyleSheet} from "react-native";
import theme from "../assets/theme";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingTop: 50,
  },
});