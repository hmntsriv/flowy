import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../context/ThemeContext";

const RichTextEditor = forwardRef(function RichTextEditor({ value = "", onChange }, ref) {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef(null);
  const isReadyRef = useRef(false);
  const lastValueRef = useRef(value || "");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: ${colors.editorBackground};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  #editor {
    min-height: 390px;
    padding: 20px 18px 32px;
    outline: none;
    color: ${colors.editorText};
    font-size: 16px;
    line-height: 1.7;
    word-break: break-word;
  }
  #editor:empty::before {
    content: "Start writing...";
    color: ${colors.textSoft};
    pointer-events: none;
  }
  #editor blockquote {
    border-left: 3px solid ${colors.accent};
    margin: 12px 0;
    padding: 8px 0 8px 14px;
    color: ${colors.textMuted};
  }
  #editor pre {
    background: ${isDark ? "#0B111A" : "#F3F6FA"};
    color: ${colors.editorText};
    padding: 14px;
    border-radius: 12px;
    overflow-x: auto;
    border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(20,32,51,0.06)"};
  }
  #editor ul, #editor ol { padding-left: 24px; }
  #editor input[type="checkbox"] { margin-right: 8px; }
</style>
</head>
<body>
<div id="editor" contenteditable="true"></div>
<script>
  const editor = document.getElementById("editor");
  let lastLocalValue = "";
  let applyingRemoteValue = false;

  function serialize() {
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.checked) checkbox.setAttribute("checked", "checked");
      else checkbox.removeAttribute("checked");
    });
    return clone.innerHTML;
  }

  function emitChange() {
    if (applyingRemoteValue) return;
    const nextValue = serialize();
    lastLocalValue = nextValue;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "change", value: nextValue }));
  }

  function setContent(nextValue) {
    const value = nextValue || "";
    if (value === lastLocalValue && editor.innerHTML === value) return;
    applyingRemoteValue = true;
    if (editor.innerHTML !== value) editor.innerHTML = value;
    lastLocalValue = value;
    setTimeout(() => { applyingRemoteValue = false; }, 0);
  }

  function runCommand(command) {
    editor.focus();
    if (command === "bold") document.execCommand("bold", false);
    if (command === "italic") document.execCommand("italic", false);
    if (command === "unorderedList") document.execCommand("insertUnorderedList", false);
    if (command === "orderedList") document.execCommand("insertOrderedList", false);
    if (command === "quote") document.execCommand("formatBlock", false, "blockquote");
    if (command === "code") document.execCommand("formatBlock", false, "pre");

    if (command === "checklist") {
      const wrapper = document.createElement("div");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      wrapper.appendChild(checkbox);
      wrapper.appendChild(document.createTextNode(" "));

      const selection = window.getSelection();
      if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(wrapper);
        range.setStartAfter(wrapper);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editor.appendChild(wrapper);
      }
    }

    emitChange();
  }

  editor.addEventListener("input", emitChange);
  document.addEventListener("change", (event) => {
    if (event.target?.tagName === "INPUT" && event.target.type === "checkbox") emitChange();
  });

  window.flowyEditor = { setContent, runCommand };
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
</script>
</body>
</html>`;

  useImperativeHandle(ref, () => ({
    runCommand(command) {
      webViewRef.current?.injectJavaScript(`window.flowyEditor?.runCommand(${JSON.stringify(command)}); true;`);
    },
    replaceContent(nextValue) {
      lastValueRef.current = nextValue || "";
      webViewRef.current?.injectJavaScript(`window.flowyEditor?.setContent(${JSON.stringify(nextValue || "")}); true;`);
    },
  }), []);

  useEffect(() => {
    if (!isReadyRef.current) return;
    const nextValue = value || "";
    if (nextValue === lastValueRef.current) return;

    lastValueRef.current = nextValue;
    webViewRef.current?.injectJavaScript(
      `window.flowyEditor?.setContent(${JSON.stringify(nextValue)}); true;`,
    );
  }, [value]);

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "ready") {
        isReadyRef.current = true;
        const initialValue = value || "";
        lastValueRef.current = initialValue;
        webViewRef.current?.injectJavaScript(
          `window.flowyEditor?.setContent(${JSON.stringify(initialValue)}); true;`,
        );
        return;
      }

      if (message.type === "change") {
        lastValueRef.current = message.value || "";
        onChange?.(message.value || "");
      }
    } catch (error) {
      console.error("RichTextEditor message error:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.editorBackground }]}>
      <WebView
        key={isDark ? "dark" : "light"}
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        keyboardDisplayRequiresUserAction={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        style={[styles.webview, { backgroundColor: colors.editorBackground }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 390 },
  webview: { flex: 1 },
});

export default RichTextEditor;
