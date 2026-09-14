import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#eef2f8",
        }}
      >
        <ActivityIndicator size="large" color="#4f83e1" />
      </View>
    );
  }

  return (
    <Redirect
      href={isAuthenticated ? "/notes" : "/login"}
    />
  );
}