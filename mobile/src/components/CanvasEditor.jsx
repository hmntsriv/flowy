import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "../context/ThemeContext";

const CanvasEditor = forwardRef(function CanvasEditor({ value = "", onChange }, ref) {
  const { colors } = useTheme();
  const webViewRef = useRef(null);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<style>
  html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:${colors.editorBackground}; }
  #canvas { display:block; width:100vw; height:100vh; background:${colors.editorBackground}; touch-action:none; }
</style>
</head>
<body>
<canvas id="canvas"></canvas>
<script>
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let mode = "pen";
  let color = ${JSON.stringify(colors.editorText)};
  let size = 4;
  const ratio = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const previous = canvas.toDataURL();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (previous && previous !== "data:,") {
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
      image.src = previous;
    }
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event) {
    event.preventDefault();
    drawing = true;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(event) {
    if (!drawing) return;
    event.preventDefault();
    const p = point(event);
    ctx.globalCompositeOperation = mode === "eraser" ? "destination-out" : "source-over";
    if (mode !== "eraser") ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end() {
    if (!drawing) return;
    drawing = false;
    ctx.closePath();
    send();
  }

  function send() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:"canvas", value:canvas.toDataURL("image/png") }));
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    send();
  }

  function setTool(next) {
    mode = next;
    ctx.globalCompositeOperation = mode === "eraser" ? "destination-out" : "source-over";
  }

  function setColor(next) { color = next; }
  function setSize(next) { size = Number(next); }

  function loadImage(data) {
    if (!data) return;
    const image = new Image();
    image.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      ctx.drawImage(image, 0, 0, rect.width, rect.height);
    };
    image.src = data;
  }

  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", end);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  window.canvasApi = {
    clear: clearCanvas,
    pen: () => setTool("pen"),
    eraser: () => setTool("eraser"),
    color: (next) => setColor(next),
    size: (next) => setSize(next),
    load: (data) => loadImage(data),
  };
</script>
</body>
</html>`;

  useImperativeHandle(ref, () => ({
    clear: () => webViewRef.current?.injectJavaScript("window.canvasApi?.clear?.(); true;"),
    setPen: () => webViewRef.current?.injectJavaScript("window.canvasApi?.pen?.(); true;"),
    setEraser: () => webViewRef.current?.injectJavaScript("window.canvasApi?.eraser?.(); true;"),
    setColor: (color) => webViewRef.current?.injectJavaScript(`window.canvasApi?.color?.(${JSON.stringify(color)}); true;`),
    setSize: (size) => webViewRef.current?.injectJavaScript(`window.canvasApi?.size?.(${Number(size)}); true;`),
  }), []);

  useEffect(() => {
    if (!value || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`window.canvasApi?.load?.(${JSON.stringify(value)}); true;`);
  }, [value]);

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "canvas") onChange?.(message.value);
    } catch (error) {
      console.error("Canvas message error:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.editorBackground, borderColor: colors.glassBorder }]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={handleMessage}
        onLoadEnd={() => {
          if (value) {
            webViewRef.current?.injectJavaScript(`window.canvasApi?.load?.(${JSON.stringify(value)}); true;`);
          }
        }}
        style={[styles.webView, { backgroundColor: colors.editorBackground }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 520, borderRadius: 18, overflow: "hidden", borderWidth: 1 },
  webView: { flex: 1 },
});

export default CanvasEditor;
