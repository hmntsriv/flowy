import { useRef, useState } from "react";
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
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../src/services/api";
import RichTextEditor from "../src/components/RichTextEditor";
import CanvasEditor from "../src/components/CanvasEditor";
import { useTheme } from "../src/context/ThemeContext";

export default function CreateNoteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const editorRef = useRef(null);
  const canvasRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [canvasData, setCanvasData] = useState("");
  const [type, setType] = useState("text");
  const [saving, setSaving] = useState(false);

  const runCommand = (command) => editorRef.current?.runCommand(command);

  const handleSave = async () => {
    const plainContent = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

    if (type === "text" && !title.trim() && !plainContent) {
      Alert.alert("Empty note", "Add a title or some content before saving.");
      return;
    }

    if (type === "canvas" && !canvasData) {
      Alert.alert("Empty canvas", "Draw something before saving.");
      return;
    }

    try {
      setSaving(true);
      await api.post("/notes", {
        title: title.trim() || "Untitled note",
        content: type === "text" ? content : "",
        type,
        canvasData: type === "canvas" ? canvasData : "",
        isStarred: false,
      });
      router.replace("/notes");
    } catch (error) {
      console.error("CREATE NOTE ERROR:", error);
      Alert.alert(
        "Couldn't save note",
        error.response?.data?.message || "The note could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

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
              disabled={saving}
            >
              <Text style={[styles.back, { color: colors.text }]}>‹</Text>
            </Pressable>
          </View>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>New note</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Create something worth keeping.</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.accent }, pressed && styles.pressed]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveText}>Save</Text>}
          </Pressable>
        </View>

        <View style={[styles.typeSelector, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
          <TypeButton label="Text" active={type === "text"} onPress={() => setType("text")} colors={colors} />
          <TypeButton label="Canvas" active={type === "canvas"} onPress={() => setType("canvas")} colors={colors} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.editorCard, { backgroundColor: colors.surface, borderColor: colors.glassBorder, shadowColor: colors.shadow }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Note title"
              placeholderTextColor={colors.textSoft}
              style={[styles.titleInput, { color: colors.text }]}
              maxLength={200}
            />

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            {type === "text" ? (
              <>
                <FormatToolbar editorRef={editorRef} colors={colors} onCommand={runCommand} />
                <View style={styles.editorArea}>
                  <RichTextEditor ref={editorRef} value={content} onChange={setContent} />
                </View>
              </>
            ) : (
              <>
                <CanvasToolbar canvasRef={canvasRef} colors={colors} />
                <View style={styles.canvasArea}>
                  <CanvasEditor ref={canvasRef} value={canvasData} onChange={setCanvasData} />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypeButton({ label, active, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeButton,
        { backgroundColor: active ? colors.accentSoft : "transparent" },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.typeText, { color: active ? colors.accent : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function FormatToolbar({ editorRef, colors, onCommand }) {
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
          onPress={() => onCommand(command)}
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
    ["Blue", () => canvasRef.current?.setColor(colors.accent)],
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
          style={({ pressed }) => [styles.tool, { backgroundColor: danger ? colors.dangerSoft : colors.surfaceSoft, borderColor: colors.glassBorder }, pressed && styles.pressed]}
          onPress={onPress}
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
  back: { fontSize: 33, marginTop: -3, fontWeight: "300" },
  headerCenter: {
    position: "absolute",
    left: 74,
    right: 74,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  headerSide: { zIndex: 2 },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
  headerSubtitle: { marginTop: 3, fontSize: 10, fontWeight: "600" },
  saveButton: { minWidth: 70, height: 42, paddingHorizontal: 16, borderRadius: 15, alignItems: "center", justifyContent: "center", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  typeSelector: { alignSelf: "center", flexDirection: "row", padding: 4, borderRadius: 16, borderWidth: 1, marginBottom: 11 },
  typeButton: { minWidth: 86, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 12 },
  typeText: { fontSize: 13, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
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
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
});
