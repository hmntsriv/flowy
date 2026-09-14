import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import api from "../src/services/api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert("Missing information", "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      Alert.alert(
        "Account created",
        "Your Flowy account has been created. Please log in.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/login"),
          },
        ],
      );
    } catch (error) {
      console.error("Registration failed:", error);

      const message =
        error.response?.data?.message ||
        "Unable to create your account. Please try again.";

      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Flowy</Text>
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subheading}>
            Start organizing your thoughts with Flowy.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating account..." : "Create account"}
            </Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>

            <Pressable
              onPress={() => router.replace("/login")}
              disabled={loading}
            >
              <Text style={styles.loginLink}> Log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  header: {
    marginBottom: 32,
  },

  logo: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 18,
  },

  heading: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },

  subheading: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },

  form: {
    width: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222",
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 18,
    color: "#111",
    backgroundColor: "#fafafa",
  },

  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
    marginTop: 6,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },

  loginText: {
    color: "#666",
    fontSize: 14,
  },

  loginLink: {
    color: "#111",
    fontSize: 14,
    fontWeight: "700",
  },
});