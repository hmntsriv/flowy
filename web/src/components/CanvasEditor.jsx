import { useEffect, useRef, useState } from "react";

function CanvasEditor({
  canvasData,
  onChange,
  noteId,
}) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Prevent the canvas from redrawing when the data change
  // came from this same canvas instance.
  const lastLocalDataRef = useRef(null);
  const loadedNoteIdRef = useRef(null);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#111827");
  const [lineWidth, setLineWidth] = useState(3);

  // =========================
  // Restore saved canvas
  // =========================

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const isNewNote =
      loadedNoteIdRef.current !== noteId;

    if (isNewNote) {
      loadedNoteIdRef.current = noteId;
      lastLocalDataRef.current = null;
    }

    // The canvas is already up-to-date when this exact
    // data came from a local drawing operation.
    if (
      !isNewNote &&
      canvasData === lastLocalDataRef.current
    ) {
      return;
    }

    const context = canvas.getContext("2d");

    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalCompositeOperation =
      "source-over";

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (!canvasData) {
      return;
    }

    const image = new Image();

    image.onload = () => {
      if (!canvasRef.current) {
        return;
      }

      const currentContext =
        canvasRef.current.getContext("2d");

      currentContext.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      currentContext.globalCompositeOperation =
        "source-over";

      currentContext.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    image.src = canvasData;
  }, [noteId, canvasData]);

  // =========================
  // Get canvas position
  // =========================

  const getPosition = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) /
          rect.width) *
        canvas.width,

      y:
        ((event.clientY - rect.top) /
          rect.height) *
        canvas.height,
    };
  };

  // =========================
  // Start drawing
  // =========================

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const { x, y } = getPosition(event);

    isDrawingRef.current = true;

    context.beginPath();
    context.moveTo(x, y);
  };

  // =========================
  // Draw
  // =========================

  const draw = (event) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const { x, y } = getPosition(event);

    context.lineWidth = lineWidth;

    if (tool === "eraser") {
      context.globalCompositeOperation =
        "destination-out";
    } else {
      context.globalCompositeOperation =
        "source-over";

      context.strokeStyle = color;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  // =========================
  // Stop drawing
  // =========================

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    const canvas = canvasRef.current;

    const data = canvas.toDataURL("image/png");

    lastLocalDataRef.current = data;

    if (onChange) {
      onChange(data);
    }
  };

  // =========================
  // Clear canvas
  // =========================

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.globalCompositeOperation =
      "source-over";

    lastLocalDataRef.current = null;

    if (onChange) {
      onChange(null);
    }
  };

  return (
    <div className="canvas-editor">
      {/* Toolbar */}

      <div className="canvas-toolbar">
        <div className="canvas-tools">
          <button
            type="button"
            className={
              tool === "pen"
                ? "canvas-tool active"
                : "canvas-tool"
            }
            onClick={() => setTool("pen")}
          >
            Pen
          </button>

          <button
            type="button"
            className={
              tool === "eraser"
                ? "canvas-tool active"
                : "canvas-tool"
            }
            onClick={() => setTool("eraser")}
          >
            Eraser
          </button>
        </div>

        <div className="canvas-controls">
          <label>
            Color

            <input
              type="color"
              value={color}
              onChange={(event) =>
                setColor(event.target.value)
              }
              disabled={tool === "eraser"}
            />
          </label>

          <label>
            Size

            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(event) =>
                setLineWidth(
                  Number(event.target.value)
                )
              }
            />
          </label>

          <button
            type="button"
            className="canvas-clear-button"
            onClick={clearCanvas}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Drawing area */}

      <div className="canvas-area">
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>
    </div>
  );
}

export default CanvasEditor;