import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [busy, setBusy] = useState(false);

  const name = user?.name?.trim() || "Flowy user";
  const email = user?.email?.trim() || "";
  const initial = name.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    Alert.alert(
      "Log out?",
      "You will need to sign in again to access your notes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              await logout();
              router.replace("/login");
            } catch (error) {
              setBusy(false);
              Alert.alert("Couldn't log out", "Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.iconButton, borderColor: colors.glassBorder },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.back, { color: colors.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { borderColor: colors.glassBorder, shadowColor: colors.shadow }]}>
            <BlurView intensity={55} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? "rgba(16,24,36,0.84)" : "rgba(255,255,255,0.82)" }]} />

            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{email}</Text>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.accent, fontSize: 17 }}>◉</Text>
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Appearance</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>Keep Flowy comfortable to use</Text>
              </View>
              <Pressable
                onPress={toggleTheme}
                style={[styles.toggleTrack, { backgroundColor: isDark ? colors.accent : colors.backgroundStrong }]}
              >
                <View style={[styles.toggleThumb, { backgroundColor: "#FFFFFF", transform: [{ translateX: isDark ? 16 : 0 }] }]} />
              </Pressable>
            </View>

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSoft }]}>
                <Text style={{ color: colors.text, fontSize: 17 }}>✦</Text>
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Theme</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{isDark ? "Dark mode" : "Light mode"}</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            disabled={busy}
            style={({ pressed }) => [styles.logout, { backgroundColor: colors.dangerSoft, borderColor: colors.glassBorder }, pressed && styles.pressed, busy && styles.disabled]}
          >
            {busy ? <ActivityIndicator size="small" color={colors.danger} /> : <Text style={[styles.logoutText, { color: colors.danger }]}>Log out</Text>}
          </Pressable>

          <Text style={[styles.version, { color: colors.textSoft }]}>Flowy Mobile · 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18 },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  back: { fontSize: 33, fontWeight: "300", marginTop: -3 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSpacer: { width: 44 },
  content: { flex: 1, paddingTop: 18 },
  card: { overflow: "hidden", borderRadius: 28, borderWidth: 1, padding: 24, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { textAlign: "center", fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  email: { textAlign: "center", marginTop: 5, fontSize: 13 },
  divider: { height: 1, marginVertical: 22 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  rowIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "800" },
  rowSubtitle: { marginTop: 3, fontSize: 12 },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, justifyContent: "center", paddingHorizontal: 4 },
  toggleThumb: { width: 16, height: 16, borderRadius: 8 },
  logout: { height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 16 },
  logoutText: { fontSize: 14, fontWeight: "800" },
  version: { textAlign: "center", fontSize: 11, marginTop: 18 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
