import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import api from "../src/services/api";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import useNoteRealtime from "../src/hooks/useNoteRealtime";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.84, 360);

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionNote, setActionNote] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const drawerProgress = useRef(new Animated.Value(0)).current;
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  const fetchNotes = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await api.get("/notes");
      const receivedNotes = Array.isArray(response.data)
        ? response.data
        : response.data.notes || response.data.data || [];

      setNotes(receivedNotes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      Alert.alert(
        "Couldn't load notes",
        error.response?.data?.message || "Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [fetchNotes, entrance]);

  const handleRealtimeUpdate = useCallback((updatedNote) => {
    if (!updatedNote?._id) return;

    if (updatedNote.permanentlyDeleted) {
      setNotes((currentNotes) =>
        currentNotes.filter((note) => note._id !== updatedNote._id),
      );
      return;
    }

    setNotes((currentNotes) => {
      const exists = currentNotes.some((note) => note._id === updatedNote._id);

      if (!exists) {
        if (updatedNote.isTrashed) return currentNotes;
        return [updatedNote, ...currentNotes];
      }

      if (updatedNote.isTrashed) {
        return currentNotes.filter((note) => note._id !== updatedNote._id);
      }

      return currentNotes.map((note) =>
        note._id === updatedNote._id ? { ...note, ...updatedNote } : note,
      );
    });
  }, []);

  useNoteRealtime(handleRealtimeUpdate);

  const openDrawer = () => {
    setMenuOpen(true);
    drawerProgress.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(drawerProgress, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDrawer = () => {
    Animated.timing(drawerProgress, {
      toValue: 0,
      duration: 190,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMenuOpen(false);
    });
  };

  const openActionMenu = (note) => {
    setActionNote(note);
    sheetProgress.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(sheetProgress, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeActionMenu = () => {
    if (actionBusy) return;
    Animated.timing(sheetProgress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setActionNote(null);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotes(false);
  };

  const handleLogout = async () => {
    closeDrawer();
    setTimeout(() => {
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
                await logout();
                router.replace("/login");
              } catch (error) {
                console.error("Logout failed:", error);
              }
            },
          },
        ],
      );
    }, 210);
  };

  const editNote = (note) => {
    closeActionMenu();
    setTimeout(() => {
      router.push({ pathname: "/edit-note", params: { id: note._id } });
    }, 190);
  };

  const toggleStar = async (note) => {
    try {
      setActionBusy(true);
      const response = await api.put(`/notes/${note._id}`, {
        isStarred: !note.isStarred,
      });
      const updatedNote = response.data?.note || response.data;

      setNotes((currentNotes) =>
        currentNotes.map((item) =>
          item._id === note._id
            ? { ...item, ...(updatedNote || {}), isStarred: !note.isStarred }
            : item,
        ),
      );
      closeActionMenu();
    } catch (error) {
      console.error("Failed to toggle star:", error);
      Alert.alert(
        "Couldn't update star",
        error.response?.data?.message || "Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const duplicateNote = async (note) => {
    try {
      setActionBusy(true);
      const response = await api.post("/notes", {
        title: `${note.title?.trim() || "Untitled note"} (Copy)`,
        content: note.content || "",
        type: note.type || "text",
        canvasData: note.canvasData || null,
        isStarred: false,
      });
      const newNote = response.data?.note || response.data;
      if (newNote) setNotes((currentNotes) => [newNote, ...currentNotes]);
      closeActionMenu();
    } catch (error) {
      console.error("Failed to duplicate note:", error);
      Alert.alert(
        "Couldn't duplicate note",
        error.response?.data?.message || "Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const moveToTrash = async (note) => {
    try {
      setActionBusy(true);
      await api.delete(`/notes/${note._id}`);
      setNotes((currentNotes) =>
        currentNotes.filter((item) => item._id !== note._id),
      );
      closeActionMenu();
    } catch (error) {
      console.error("Failed to move note to trash:", error);
      Alert.alert(
        "Couldn't move note to trash",
        error.response?.data?.message || "Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const confirmMoveToTrash = (note) => {
    Alert.alert(
      "Move to trash?",
      `"${note.title?.trim() || "Untitled note"}" will be moved to Trash.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move to Trash",
          style: "destructive",
          onPress: () => moveToTrash(note),
        },
      ],
    );
  };

  const createNote = () => router.push("/create-note");
  const openProfile = () => {
    closeDrawer();
    setTimeout(() => router.push("/profile"), 190);
  };
  const openTrash = () => {
    closeDrawer();
    setTimeout(() => router.push("/trash"), 190);
  };

  const filteredNotes = notes.filter((note) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (note.title || "").toLowerCase().includes(query) ||
      (note.content || "")
        .replace(/<[^>]*>/g, " ")
        .toLowerCase()
        .includes(query);
    const matchesFilter = filter === "all" || note.isStarred;
    return matchesSearch && matchesFilter;
  });

  const getPreview = (note) => {
    if (note.type === "canvas") return "Canvas note";
    const text = (note.content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
    return text || "No content yet";
  };

  const renderNote = ({ item, index }) => (
    <AnimatedNoteCard
      item={item}
      index={index}
      colors={colors}
      onPress={() => router.push({ pathname: "/edit-note", params: { id: item._id } })}
      onLongPress={() => openActionMenu(item)}
      getPreview={getPreview}
    />
  );

  const drawerTranslateX = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const sheetTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [380, 0],
  });

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.container}>
        <Animated.View
          style={{
            flex: 1,
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.menuButton,
                { backgroundColor: colors.iconButton, borderColor: colors.glassBorder },
                pressed && styles.pressed,
              ]}
              onPress={openDrawer}
            >
              <Text style={[styles.menuIcon, { color: colors.text }]}>☰</Text>
            </Pressable>

            <Text style={[styles.logo, { color: colors.text }]}>Flowy</Text>

            <Pressable
              style={({ pressed }) => [
                styles.avatar,
                { backgroundColor: colors.accent },
                pressed && styles.avatarPressed,
              ]}
              onPress={openProfile}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.greetingBlock}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hi, {user?.name?.split(" ")?.[0] || "there"} 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Keep your thoughts flowing.</Text>
          </View>

          <View style={[
            styles.searchWrap,
            { backgroundColor: colors.input, borderColor: colors.glassBorder },
          ]}>
            <Text style={[styles.searchIcon, { color: colors.textSoft }]}>⌕</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search notes..."
              placeholderTextColor={colors.textSoft}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} style={styles.clearSearch}>
                <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filterRow}>
            {[
              ["all", "All"],
              ["starred", "Starred"],
            ].map(([value, label]) => {
              const active = filter === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setFilter(value)}
                  style={({ pressed }) => [
                    styles.filterButton,
                    {
                      backgroundColor: active ? colors.activePill : colors.surfaceSoft,
                      borderColor: colors.glassBorder,
                    },
                    pressed && styles.pressedSmall,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: active ? colors.activePillText : colors.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : (
            <FlatList
              data={filteredNotes}
              keyExtractor={(item) => item._id}
              renderItem={renderNote}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.list,
                filteredNotes.length === 0 && styles.emptyList,
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.accent}
                />
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
                    <Text style={{ color: colors.accent, fontSize: 20 }}>~</Text>
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {search.trim()
                      ? "No matching notes"
                      : filter === "starred"
                        ? "No starred notes"
                        : "Nothing here yet"}
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {search.trim()
                      ? "Try a different search."
                      : filter === "starred"
                        ? "Star something you want to keep close."
                        : "Create a note and let your thoughts flow."}
                  </Text>
                </View>
              }
            />
          )}
        </Animated.View>

        {!loading ? (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.text,
              shadowColor: colors.shadow,
            },
            pressed && styles.fabPressed,
          ]}
          onPress={createNote}
        >
          <Text style={[styles.fabText, { color: colors.mode === "dark" ? "#111A27" : "#FFFFFF" }]}>+</Text>
        </Pressable>
        ) : null}
      </View>

      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.drawerBackdrop, { opacity: drawerProgress }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                width: DRAWER_WIDTH,
                backgroundColor: isDark ? "rgba(10,16,25,0.94)" : "rgba(248,251,255,0.94)",
                borderRightColor: colors.glassBorder,
                transform: [{ translateX: drawerTranslateX }],
                shadowColor: colors.shadow,
              },
            ]}
          >
            <BlurView
              intensity={72}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: isDark
                    ? "rgba(10,16,25,0.78)"
                    : "rgba(248,251,255,0.78)",
                },
              ]}
            />
            <View style={styles.drawerTop}>
              <View>
                <Text style={[styles.drawerBrand, { color: colors.text }]}>~ Flowy</Text>
                <Text style={[styles.drawerEmail, { color: colors.textMuted }]}>
                  {user?.email || "Your Flowy account"}
                </Text>
              </View>
              <Pressable
                onPress={closeDrawer}
                style={[styles.drawerClose, { backgroundColor: colors.iconButton }]}
              >
                <Text style={[styles.drawerCloseText, { color: colors.text }]}>×</Text>
              </Pressable>
            </View>

            <View style={[styles.drawerDivider, { backgroundColor: colors.divider }]} />

            <DrawerItem
              label="Profile"
              description="Account and settings"
              icon="👤"
              colors={colors}
              onPress={openProfile}
            />
            <DrawerItem
              label="Trash"
              description="Restore or delete notes"
              icon="🗑️"
              colors={colors}
              onPress={openTrash}
            />

            <Pressable
              onPress={toggleTheme}
              style={({ pressed }) => [styles.themeRow, pressed && styles.pressed]}
            >
              <View style={[styles.themeIcon, { backgroundColor: colors.accentSoft }]}>
                <Text style={{ color: colors.accent, fontSize: 17 }}>{isDark ? "☀️" : "🌙"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeTitle, { color: colors.text }]}>
                  {isDark ? "Light mode" : "Dark mode"}
                </Text>
                <Text style={[styles.themeDescription, { color: colors.textMuted }]}>Switch the visual mood</Text>
              </View>
              <View style={[styles.toggleTrack, { backgroundColor: isDark ? colors.accent : colors.backgroundStrong }]}>
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: isDark ? "#FFFFFF" : colors.surfaceSolid,
                      transform: [{ translateX: isDark ? 14 : 0 }],
                    },
                  ]}
                />
              </View>
            </Pressable>

            <View style={{ flex: 1 }} />

            <View style={[styles.drawerFooter, { borderTopColor: colors.divider }]}>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}
              >
                <View style={[styles.logoutIcon, { backgroundColor: colors.dangerSoft }]}>
                  <Text style={{ color: colors.danger, fontSize: 16 }}>↪</Text>
                </View>
                <Text style={[styles.logoutText, { color: colors.danger }]}>Log out</Text>
              </Pressable>
              <Text style={[styles.versionText, { color: colors.textSoft }]}>Flowy Mobile · 1.0.0</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!actionNote} transparent animationType="none" onRequestClose={closeActionMenu}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.drawerBackdrop, { opacity: sheetProgress }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeActionMenu} />
          </Animated.View>

          <Animated.View
            style={[
              styles.actionSheet,
              {
                backgroundColor: isDark ? "rgba(13,19,29,0.94)" : "rgba(248,251,255,0.94)",
                borderColor: colors.glassBorder,
                shadowColor: colors.shadow,
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <BlurView
              intensity={76}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: isDark
                    ? "rgba(13,19,29,0.84)"
                    : "rgba(248,251,255,0.84)",
                },
              ]}
            />
            <View style={[styles.sheetHandle, { backgroundColor: colors.textSoft }]} />
            <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
              {actionNote?.title?.trim() || "Untitled note"}
            </Text>

            <ActionButton label="Edit" colors={colors} disabled={actionBusy} onPress={() => editNote(actionNote)} />
            <ActionButton
              label={actionNote?.isStarred ? "Remove star" : "Star note"}
              colors={colors}
              disabled={actionBusy}
              onPress={() => toggleStar(actionNote)}
            />
            <ActionButton label="Duplicate" colors={colors} disabled={actionBusy} onPress={() => duplicateNote(actionNote)} />
            <ActionButton
              label="Move to Trash"
              colors={colors}
              disabled={actionBusy}
              danger
              onPress={() => confirmMoveToTrash(actionNote)}
            />

            <Pressable
              style={styles.cancelButton}
              disabled={actionBusy}
              onPress={closeActionMenu}
            >
              {actionBusy ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DrawerItem({ label, description, icon, colors, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.drawerItem, pressed && styles.pressed]}
    >
      <View style={[styles.drawerItemIcon, { backgroundColor: colors.iconButton }]}>
        <Text style={{ color: colors.text, fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.drawerItemTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.drawerItemDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.textSoft }]}>›</Text>
    </Pressable>
  );
}

function ActionButton({ label, colors, onPress, disabled, danger = false }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: danger ? colors.dangerSoft : colors.surfaceSoft,
          borderColor: colors.glassBorder,
        },
        pressed && styles.pressed,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        style={[
          styles.actionButtonText,
          { color: danger ? colors.danger : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AnimatedNoteCard({ item, index, colors, onPress, onLongPress, getPreview }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }).start();
    }, Math.min(index * 45, 220));

    return () => clearTimeout(timer);
  }, [index, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
          },
        ],
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.noteCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.glassBorder,
            shadowColor: colors.shadow,
          },
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={450}
      >
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title?.trim() || "Untitled note"}
          </Text>
          {item.isStarred ? <Text style={[styles.star, { color: colors.star }]}>★</Text> : null}
        </View>

        <Text style={[styles.notePreview, { color: colors.textMuted }]} numberOfLines={2}>
          {getPreview(item)}
        </Text>

        <View style={styles.noteFooter}>
          <View style={[styles.typePill, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.noteType, { color: colors.accent }]}>
              {item.type === "canvas" ? "Canvas" : "Text"}
            </Text>
          </View>
          <Text style={[styles.noteHint, { color: colors.textSoft }]}>Tap to open</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  menuIcon: { fontSize: 20, fontWeight: "500" },
  logo: { fontSize: 23, fontWeight: "800", letterSpacing: -0.6 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  avatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  avatarPressed: { transform: [{ scale: 0.96 }] },
  greetingBlock: { marginTop: 22, marginBottom: 16 },
  greeting: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { marginTop: 5, fontSize: 14, fontWeight: "500" },
  searchWrap: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchIcon: { fontSize: 25, marginRight: 10, marginTop: -2 },
  searchInput: { flex: 1, fontSize: 15 },
  clearSearch: { paddingLeft: 8, paddingVertical: 6 },
  clearSearchText: { fontSize: 22, lineHeight: 20 },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: 10 },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "700" },
  list: { paddingTop: 6, paddingBottom: 115 },
  emptyList: { flexGrow: 1 },
  noteCard: {
    padding: 17,
    marginBottom: 11,
    borderRadius: 22,
    borderWidth: 1,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.992 }], opacity: 0.95 },
  noteHeader: { flexDirection: "row", alignItems: "center" },
  noteTitle: { flex: 1, fontSize: 17, fontWeight: "750", letterSpacing: -0.15 },
  star: { marginLeft: 8, fontSize: 17 },
  notePreview: { marginTop: 8, fontSize: 14, lineHeight: 21 },
  noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  typePill: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  noteType: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
  noteHint: { fontSize: 10, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 34, minHeight: 360 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", letterSpacing: -0.4 },
  emptyText: { marginTop: 8, fontSize: 14, lineHeight: 21, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 22,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.22,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabPressed: { transform: [{ scale: 0.94 }] },
  fabText: { fontSize: 32, fontWeight: "400", marginTop: -3 },
  modalRoot: { flex: 1, backgroundColor: "transparent" },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,12,19,0.38)" },
  drawer: {
    height: "100%",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderRightWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 12, height: 0 },
    elevation: 12,
  },
  drawerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  drawerBrand: { fontSize: 25, fontWeight: "850", letterSpacing: -0.5 },
  drawerEmail: { marginTop: 4, fontSize: 12 },
  drawerClose: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  drawerCloseText: { fontSize: 25, fontWeight: "300", marginTop: -2 },
  drawerDivider: { height: 1, marginVertical: 21 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, marginBottom: 7 },
  drawerItemIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 13 },
  drawerItemTitle: { fontSize: 16, fontWeight: "750" },
  drawerItemDescription: { marginTop: 3, fontSize: 12 },
  chevron: { fontSize: 24, marginLeft: 8 },
  themeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, marginTop: 4 },
  themeIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 13 },
  themeTitle: { fontSize: 15, fontWeight: "750" },
  themeDescription: { marginTop: 3, fontSize: 12 },
  toggleTrack: { width: 38, height: 22, borderRadius: 11, justifyContent: "center", paddingHorizontal: 4 },
  toggleThumb: { width: 14, height: 14, borderRadius: 7 },
  drawerFooter: { paddingTop: 16, borderTopWidth: 1 },
  logoutRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  logoutIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 13 },
  logoutText: { fontSize: 15, fontWeight: "800" },
  versionText: { fontSize: 11, textAlign: "center", marginTop: 22 },
  actionSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 30,
    shadowOpacity: 0.3,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: -8 },
    elevation: 14,
  },
  sheetHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, marginBottom: 17, opacity: 0.55 },
  actionTitle: { fontSize: 19, fontWeight: "800", marginBottom: 10, letterSpacing: -0.3 },
  actionButton: { height: 52, borderRadius: 16, borderWidth: 1, justifyContent: "center", paddingHorizontal: 16, marginTop: 9 },
  actionButtonText: { fontSize: 15, fontWeight: "700" },
  cancelButton: { height: 48, alignItems: "center", justifyContent: "center", marginTop: 8 },
  cancelText: { fontWeight: "800", fontSize: 14 },
  pressed: { opacity: 0.78 },
  pressedSmall: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
