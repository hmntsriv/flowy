import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import {
  router,
  useFocusEffect,
} from "expo-router";
import api from "../src/services/api";
import { useTheme } from "../src/context/ThemeContext";

export default function TrashScreen() {
  const { colors, isDark } = useTheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [actionId, setActionId] =
    useState(null);
  const [error, setError] =
    useState("");

  const fetchTrash = async (
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/notes/trash",
      );

      const receivedNotes =
        Array.isArray(response.data)
          ? response.data
          : response.data.notes ||
            response.data.data ||
            [];

      setNotes(receivedNotes);
    } catch (err) {
console.error("Failed to fetch trash:", err);

  setError(
    err.response?.data?.message ||
      "Unable to load trash.",
  );
} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrash();
    }, []),
  );

  const restoreNote = async (note) => {
    if (actionId === note._id) {
      return;
    }

    try {
      setActionId(note._id);

      await api.put(
        `/notes/${note._id}/restore`,
      );

      setNotes((current) =>
        current.filter(
          (item) =>
            item._id !== note._id,
        ),
      );
    } catch (err) {
      Alert.alert(
        "Couldn't restore note",
        err.response?.data?.message ||
          "Please try again.",
      );
    } finally {
      setActionId(null);
    }
  };

  const permanentlyDelete = (note) => {
    Alert.alert(
      "Delete permanently?",
      `"${note.title?.trim() || "Untitled note"}" will be permanently deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionId(note._id);

              await api.delete(
                `/notes/${note._id}/permanent`,
              );

              setNotes((current) =>
                current.filter(
                  (item) =>
                    item._id !== note._id,
                ),
              );
            } catch (err) {
              Alert.alert(
                "Couldn't delete note",
                err.response?.data?.message ||
                  "Please try again.",
              );
            } finally {
              setActionId(null);
            }
          },
        },
      ],
    );
  };

  const renderNote = ({
    item,
  }) => {
    const preview =
      item.content
        ?.replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim() ||
      "No content";

    const busy =
      actionId === item._id;

    return (
      <View style={[styles.noteCard, { borderColor: colors.glassBorder, shadowColor: colors.shadow }]}>
        <BlurView intensity={58} tint={isDark ? "dark" : "light"} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? "rgba(20,29,42,0.50)" : "rgba(255,255,255,0.48)" }]} />
        <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.title?.trim() ||
            "Untitled note"}
        </Text>

        <Text
          style={[styles.preview, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {preview}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.restore,
              busy &&
                styles.disabled,
            ]}
            disabled={busy}
            onPress={() =>
              restoreNote(item)
            }
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
              />
            ) : (
              <Text
                style={
                  styles.restoreText
                }
              >
                Restore
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.delete,
              busy &&
                styles.disabled,
            ]}
            disabled={busy}
            onPress={() =>
              permanentlyDelete(item)
            }
          >
            <Text
              style={styles.deleteText}
            >
              Delete permanently
            </Text>
          </Pressable>
        </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView
        style={styles.safeArea}
        edges={[
          "top",
          "left",
          "right",
        ]}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.iconButton, borderColor: colors.glassBorder }]}
              onPress={() =>
                router.back()
              }
            >
              <Text style={[styles.back, { color: colors.text }]}>
                ‹
              </Text>
            </Pressable>

            <View style={styles.headerText}>
              <Text
                style={[styles.headerTitle, { color: colors.text }]}
              >
                Trash
              </Text>

              <Text
                style={[styles.subtitle, { color: colors.textMuted }]}
              >
                Deleted notes
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="small"
                color={colors.accent}
              />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text
                style={styles.error}
              >
                {error}
              </Text>

              <Pressable
                style={styles.retry}
                onPress={() =>
                  fetchTrash()
                }
              >
                <Text
                  style={styles.retryText}
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={notes}
              keyExtractor={(item) =>
                item._id
              }
              renderItem={renderNote}
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={[
                styles.list,
                notes.length === 0 &&
                  styles.emptyList,
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={
                    refreshing
                  }
                  onRefresh={() => {
                    setRefreshing(
                      true,
                    );
                    fetchTrash(false);
                  }}
                  tintColor="#4f83e1"
                />
              }
              ListEmptyComponent={
                <View
                  style={styles.empty}
                >
                  <Text
                    style={
                      styles.emptyMark
                    }
                  >
                    ⌫
                  </Text>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    Trash is empty
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Deleted notes will
                    appear here.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#edf2f8",
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
  },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.72)",
    marginRight: 12,
  },

  back: {
    marginTop: -3,
    fontSize: 31,
    color: "#667085",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#172033",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#98a2b3",
  },

  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  emptyList: {
    flexGrow: 1,
  },

  noteCard: {
    position: "relative",
    overflow: "hidden",
    padding: 17,
    marginBottom: 9,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.72)",
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#172033",
  },

  preview: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#667085",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  restore: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(79,131,225,0.10)",
    borderWidth: 1,
    borderColor:
      "rgba(79,131,225,0.13)",
  },

  restoreText: {
    color: "#4f83e1",
    fontSize: 13,
    fontWeight: "700",
  },

  delete: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(190,18,60,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(190,18,60,0.09)",
  },

  deleteText: {
    color: "#be123c",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  disabled: {
    opacity: 0.5,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    maxWidth: 280,
    marginBottom: 14,
    textAlign: "center",
    color: "#be123c",
  },

  retry: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#4f83e1",
  },

  retryText: {
    color: "#fff",
    fontWeight: "700",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMark: {
    fontSize: 32,
    color: "#9caac0",
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#172033",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#667085",
  },
});