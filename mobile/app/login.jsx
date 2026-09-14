import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Link, router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Enter your email and password.",
      );
      return;
    }

    try {
      setSubmitting(true);

      await login(
        email.trim().toLowerCase(),
        password,
      );

      router.replace("/notes");
    } catch (error) {
      console.error("Login failed:", error);

      Alert.alert(
        "Login failed",
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.content}>
          <View style={styles.brand}>
            <Text style={styles.logoMark}>~</Text>
            <Text style={styles.logoText}>Flowy</Text>
          </View>

          <Text style={styles.heading}>
            Welcome back
          </Text>

          <Text style={styles.subtitle}>
            Better thoughts. A calmer you.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#98a2b3"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#98a2b3"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
  style={[
    styles.button,
    submitting && styles.buttonDisabled,
  ]}
  onPress={handleLogin}
  disabled={submitting}
>
  <Text style={styles.buttonText}>
    {submitting ? "Signing in..." : "Sign in"}
  </Text>
</Pressable>
</View>

<View style={styles.registerRow}>
  <Text style={styles.registerText}>
    Don't have an account?
  </Text>

  <Pressable
    onPress={() => router.push("/register")}
    disabled={submitting}
  >
    <Text style={styles.registerLink}> Create an account</Text>
  </Pressable>
</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2f8",
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 38,
  },

  logoMark: {
    color: "#4f83e1",
    fontSize: 32,
    fontWeight: "700",
  },

  logoText: {
    color: "#172033",
    fontSize: 26,
    fontWeight: "700",
  },

  heading: {
    color: "#172033",
    fontSize: 32,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 8,
    color: "#667085",
    fontSize: 15,
  },

  form: {
    marginTop: 30,
    gap: 14,
  },

  input: {
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(23,32,51,0.08)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.78)",
    color: "#172033",
    fontSize: 15,
  },

  button: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: "#4f83e1",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    gap: 5,
  },

  registerText: {
    color: "#667085",
    fontSize: 13,
  },

  registerLink: {
    color: "#4f83e1",
    fontSize: 13,
    fontWeight: "700",
  },
});