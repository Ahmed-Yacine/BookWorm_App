import { View, Text } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "center",
          marginTop: 50,
        }}
      >
        My App
      </Text>
      <Text
        style={{
          fontSize: 16,
          textAlign: "center",
          marginTop: 20,
          color: "#666",
        }}
      >
        Welcome to your app!
      </Text>
    </View>
  );
}
