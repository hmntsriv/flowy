import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../src/services/api";
import RichTextEditor from "../src/components/RichTextEditor";
import CanvasEditor from "../src/components/CanvasEditor";
import useNoteRealtime from "../src/hooks/useNoteRealtime";
import { useTheme } from "../src/context/ThemeContext";

export default function EditNoteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedRef = useRef(false);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [canvasData, setCanvasData] = useState("");
  const [type, setType] = useState("text");
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const [saveState, setSaveState] = useState("saved");

  const loadNote = useCallback(async () => {
    if (!id) {
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/notes/${id}`);
      const note = response.data?.note || response.data?.data || response.data;

      setTitle(note.title || "");
      setContent(note.content || "");
      setCanvasData(note.canvasData || "");
      setType(note.type || "text");
      setIsStarred(Boolean(note.isStarred));
      dirtyRef.current = false;
      loadedRef.current = true;
    } catch (error) {
      console.error("LOAD NOTE ERROR:", error);
      Alert.alert(
        "Couldn't open note",
        error.response?.data?.message || "The note could not be loaded.",
      );
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const saveNote = useCallback(
    async (showSpinner = false) => {
      if (!id || !loadedRef.current || savingRef.current) return false;

      try {
        savingRef.current = true;
        if (showSpinner) setSaving(true);
        setSaveState("saving");

        await api.put(`/notes/${id}`, {
          title: title.trim() || "Untitled note",
          content: type === "text" ? content : "",
          type,
          canvasData: type === "canvas" ? canvasData : "",
          isStarred,
        });

        dirtyRef.current = false;
        setSaveState("saved");
        return true;
      } catch (error) {
        console.error("SAVE NOTE ERROR:", error);
        setSaveState("error");
        if (showSpinner) {
          Alert.alert(
            "Couldn't save note",
            error.response?.data?.message || "The note could not be saved.",
          );
        }
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [id, title, content, canvasData, type, isStarred],
  );

  useEffect(() => {
    if (!loadedRef.current || !dirtyRef.current) return;

    const timer = setTimeout(() => saveNote(false), 900);
    return () => clearTimeout(timer);
  }, [title, content, canvasData, isStarred, saveNote]);

  const handleRemoteUpdate = useCallback(
    (remoteNote) => {
      if (!remoteNote || String(remoteNote._id) !== String(id)) return;

      const nextTitle = remoteNote.title || "";
      const nextContent = remoteNote.content || "";
      const nextCanvas = remoteNote.canvasData || "";

      setTitle(nextTitle);
      setContent(nextContent);
      setCanvasData(nextCanvas);
      setIsStarred(Boolean(remoteNote.isStarred));
      dirtyRef.current = false;
      setSaveState("saved");

      if (remoteNote.type === "text") {
        editorRef.current?.replaceContent(nextContent);
      }
    },
    [id],
  );

  useNoteRealtime(handleRemoteUpdate);

  const handleSave = async () => {
    const success = await saveNote(true);
    if (success) router.replace("/notes");
  };

  const moveToTrash = async () => {
    try {
      setTrashing(true);
      await api.delete(`/notes/${id}`);
      dirtyRef.current = false;
      router.replace("/notes");
    } catch (error) {
      console.error("TRASH ERROR:", error);
      Alert.alert(
        "Couldn't move note to trash",
        error.response?.data?.message || "Please try again.",
      );
    } finally {
      setTrashing(false);
    }
  };

  const statusText =
    saveState === "saving" ? "Saving..." : saveState === "error" ? "Not saved" : "Saved";

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.loadingScreen}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading note...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Pressable
              style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.iconButton, borderColor: colors.glassBorder }, pressed && styles.pressed]}
              onPress={() => router.back()}
              disabled={saving || trashing}
            >
              <Text style={[styles.back, { color: colors.text }]}>‹</Text>
            </Pressable>
          </View>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Edit note</Text>
            <Text style={[styles.status, { color: saveState === "error" ? colors.danger : colors.textMuted }]}>{statusText}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.starButton, { backgroundColor: colors.iconButton, borderColor: colors.glassBorder }, pressed && styles.pressed]}
              onPress={() => {
                dirtyRef.current = true;
                setIsStarred((value) => !value);
              }}
              disabled={saving || trashing}
            >
              <Text style={[styles.star, { color: isStarred ? colors.star : colors.textSoft }]}>{isStarred ? "★" : "☆"}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.accent }, (saving || trashing) && styles.disabled, pressed && styles.pressed]}
              onPress={handleSave}
              disabled={saving || trashing}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.editorCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder, shadowColor: colors.shadow }]}>
            <TextInput
              value={title}
              onChangeText={(text) => {
                dirtyRef.current = true;
                setTitle(text);
              }}
              placeholder="Note title"
              placeholderTextColor={colors.textSoft}
              style={[styles.titleInput, { color: colors.text }]}
              maxLength={200}
            />

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            {type === "text" ? (
              <>
                <FormatToolbar editorRef={editorRef} colors={colors} />
                <View style={styles.editorArea}>
                  <RichTextEditor
                    ref={editorRef}
                    value={content}
                    onChange={(value) => {
                      dirtyRef.current = true;
                      setContent(value);
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                <CanvasToolbar canvasRef={canvasRef} colors={colors} />
                <View style={styles.canvasArea}>
                  <CanvasEditor
                    ref={canvasRef}
                    value={canvasData}
                    onChange={(value) => {
                      dirtyRef.current = true;
                      setCanvasData(value);
                    }}
                  />
                </View>
              </>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.trashButton,
              { backgroundColor: colors.dangerSoft, borderColor: colors.glassBorder },
              (saving || trashing) && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={moveToTrash}
            disabled={saving || trashing}
          >
            {trashing ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={[styles.trashText, { color: colors.danger }]}>Move to Trash</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormatToolbar({ editorRef, colors }) {
  const tools = [
    ["B", "bold", true, false],
    ["I", "italic", false, true],
    ["•", "unorderedList"],
    ["1.", "orderedList"],
    ["☑", "checklist"],
    ["❝", "quote"],
    ["<>", "code"],
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
      {tools.map(([label, command, bold, italic]) => (
        <Pressable
          key={command}
          onPress={() => editorRef.current?.runCommand(command)}
          style={({ pressed }) => [styles.formatButton, { backgroundColor: colors.surfaceSoft, borderColor: colors.glassBorder }, pressed && styles.pressed]}
        >
          <Text style={[styles.formatText, { color: colors.text }, bold && styles.bold, italic && styles.italic]}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CanvasToolbar({ canvasRef, colors }) {
  const tools = [
    ["Pen", () => canvasRef.current?.setPen()],
    ["Eraser", () => canvasRef.current?.setEraser()],
    ["Accent", () => canvasRef.current?.setColor(colors.accent)],
    ["Ink", () => canvasRef.current?.setColor(colors.text)],
    ["Thin", () => canvasRef.current?.setSize(3)],
    ["Thick", () => canvasRef.current?.setSize(8)],
    ["Clear", () => canvasRef.current?.clear(), true],
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
      {tools.map(([label, onPress, danger]) => (
        <Pressable
          key={label}
          onPress={onPress}
          style={({ pressed }) => [styles.tool, { backgroundColor: danger ? colors.dangerSoft : colors.surfaceSoft, borderColor: colors.glassBorder }, pressed && styles.pressed]}
        >
          <Text style={[styles.toolText, { color: danger ? colors.danger : colors.textMuted }]}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { height: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  back: { fontSize: 33, fontWeight: "300", marginTop: -3 },
  headerCenter: {
    position: "absolute",
    left: 72,
    right: 72,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  headerSide: { zIndex: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7, zIndex: 2 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  status: { marginTop: 3, fontSize: 10, fontWeight: "700" },
  starButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  star: { fontSize: 24 },
  saveButton: { minWidth: 68, height: 42, paddingHorizontal: 15, borderRadius: 15, alignItems: "center", justifyContent: "center", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  editorCard: { minHeight: 660, borderRadius: 24, overflow: "hidden", borderWidth: 1, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  titleInput: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  divider: { height: 1, marginHorizontal: 20 },
  toolbar: { paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  formatButton: { width: 42, height: 38, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  formatText: { fontSize: 15, fontWeight: "650" },
  bold: { fontWeight: "900" },
  italic: { fontStyle: "italic" },
  editorArea: { flex: 1, minHeight: 540 },
  canvasArea: { flex: 1, minHeight: 540, paddingHorizontal: 10, paddingBottom: 10 },
  tool: { height: 38, paddingHorizontal: 13, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  toolText: { fontSize: 12, fontWeight: "750" },
  trashButton: { height: 50, marginTop: 13, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  trashText: { fontSize: 14, fontWeight: "800" },
  loadingScreen: {
    flex: 1,
    position: "relative",
  },
  loadingContent: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    transform: [{ translateY: -18 }],
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 11, fontSize: 13, fontWeight: "600" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
});
