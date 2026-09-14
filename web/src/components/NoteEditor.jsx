import {
  MoreHorizontal,
  Star,
  Trash2,
  StarOff,
  RotateCcw,
  Copy,
  Files,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CanvasEditor from "./CanvasEditor";
import RichTextEditor from "./RichTextEditor";

function NoteEditor({ note, onUpdate, onDelete, onDuplicate, onRestore, onPermanentDelete, isTrashView = false }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [canvasData, setCanvasData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreMenuClosing, setMoreMenuClosing] = useState(false);

  const canvasSaveTimerRef = useRef(null);
  const titleSaveTimerRef = useRef(null);
  const contentSaveTimerRef = useRef(null);
  const lastSavedTitleRef = useRef("");
  const lastSavedContentRef = useRef("");
  const lastSavedCanvasDataRef = useRef(null);
  const saveOperationRef = useRef(0);
  const moreMenuRef = useRef(null);

  const beginSave = () => {
    const operationId = saveOperationRef.current + 1;
    saveOperationRef.current = operationId;
    setSaveStatus("saving");
    return operationId;
  };

  const finishSave = (operationId, status) => {
    if (operationId === saveOperationRef.current) setSaveStatus(status);
  };

  useEffect(() => {
    if (!note) return;
    const nextTitle = note.title || "";
    const nextContent = note.content || "";
    const nextCanvasData = note.canvasData || null;

    setTitle(nextTitle);
    setContent(nextContent);
    setCanvasData(nextCanvasData);
    setSaveStatus("saved");
    lastSavedTitleRef.current = nextTitle;
    lastSavedContentRef.current = nextContent;
    lastSavedCanvasDataRef.current = nextCanvasData;
    saveOperationRef.current += 1;

    [canvasSaveTimerRef, titleSaveTimerRef, contentSaveTimerRef].forEach((timerRef) => {
      if (timerRef.current) clearTimeout(timerRef.current);
    });
  }, [note?._id, isTrashView]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuClosing(true);
        setTimeout(() => {
          setMoreMenuOpen(false);
          setMoreMenuClosing(false);
        }, 140);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreMenuOpen]);

  useEffect(() => setMoreMenuOpen(false), [note?._id]);

  useEffect(() => {
    if (!note || isTrashView || note.type !== "canvas") return;
    if (canvasData === lastSavedCanvasDataRef.current) return;
    setSaveStatus("saving");
    if (canvasSaveTimerRef.current) clearTimeout(canvasSaveTimerRef.current);

    canvasSaveTimerRef.current = setTimeout(async () => {
      const operationId = beginSave();
      try {
        await onUpdate({ canvasData });
        lastSavedCanvasDataRef.current = canvasData;
        finishSave(operationId, "saved");
      } catch (error) {
        console.error("Failed to save canvas:", error);
        finishSave(operationId, "error");
      }
    }, 700);
    return () => clearTimeout(canvasSaveTimerRef.current);
  }, [canvasData, note?._id, note?.type, isTrashView]);

  useEffect(() => {
    if (!note || isTrashView || note.type !== "canvas") return;
    if (title === lastSavedTitleRef.current) return;
    setSaveStatus("saving");
    if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current);

    titleSaveTimerRef.current = setTimeout(async () => {
      const operationId = beginSave();
      try {
        await onUpdate({ title });
        lastSavedTitleRef.current = title;
        finishSave(operationId, "saved");
      } catch (error) {
        console.error("Failed to save canvas title:", error);
        finishSave(operationId, "error");
      }
    }, 500);
    return () => clearTimeout(titleSaveTimerRef.current);
  }, [title, note?._id, note?.type, isTrashView]);

  useEffect(() => {
    if (!note || isTrashView || note.type === "canvas") return;
    const titleChanged = title !== lastSavedTitleRef.current;
    const contentChanged = content !== lastSavedContentRef.current;
    if (!titleChanged && !contentChanged) return;
    setSaveStatus("saving");
    if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);

    contentSaveTimerRef.current = setTimeout(async () => {
      const operationId = beginSave();
      try {
        await onUpdate({ title, content });
        lastSavedTitleRef.current = title;
        lastSavedContentRef.current = content;
        finishSave(operationId, "saved");
      } catch (error) {
        console.error("Failed to save note:", error);
        finishSave(operationId, "error");
      }
    }, 500);
    return () => clearTimeout(contentSaveTimerRef.current);
  }, [title, content, note?._id, note?.type, isTrashView]);

  const getWordCount = () => {
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  };

  const formatEditedTime = (date) => {
    if (!date) return "";
    const editedDate = new Date(date);
    const minutes = Math.floor((Date.now() - editedDate.getTime()) / (1000 * 60));
    if (minutes < 1) return "Edited just now";
    if (minutes < 60) return `Edited ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Edited ${hours}h ago`;
    return `Edited ${editedDate.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  };

  if (!note) {
    return <main className="note-editor empty-editor"><div className="empty-editor-content"><h2>{isTrashView ? "Select a deleted note" : "Select a note"}</h2><p>{isTrashView ? "Choose a deleted note to restore it." : "Choose a note from the list to start writing."}</p></div></main>;
  }

  if (isTrashView) {
    return (
      <main className="note-editor empty-editor">
        <div className="empty-editor-content">
          <div className="empty-icon"><Trash2 size={24} /></div>
          <h2>{note.title || "Untitled"}</h2>
          <p>This note is currently in the trash.</p>
          <div className="trash-actions">
            <button className="new-note-button" type="button" onClick={() => onRestore(note._id)}><RotateCcw size={17} /><span>Restore note</span></button>
            <button className="trash-permanent-delete-button" type="button" onClick={() => { if (window.confirm("Permanently delete this note? This cannot be undone.")) onPermanentDelete(note._id); }}><Trash2 size={17} /><span>Permanently delete</span></button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="note-editor">
      <header className="editor-header">
        <div className="editor-heading">
          <input className="editor-title" type="text" placeholder="Untitled" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="editor-meta"><span>{formatEditedTime(note.updatedAt)}</span></div>
        </div>

        <div className="editor-actions">
          <button type="button" className={`icon-button ${note?.isStarred ? "starred" : ""}`} onClick={() => onUpdate({ isStarred: !note.isStarred })} aria-label={note?.isStarred ? "Unstar note" : "Star note"} title={note?.isStarred ? "Unstar note" : "Star note"}>
            {note?.isStarred ? <StarOff size={18} /> : <Star size={18} />}
          </button>

          <div className="more-menu-wrapper" ref={moreMenuRef}>
            <button className="icon-button" type="button" title="More options" onClick={() => {
              if (moreMenuOpen) {
                setMoreMenuClosing(true);
                setTimeout(() => { setMoreMenuOpen(false); setMoreMenuClosing(false); }, 140);
              } else {
                setMoreMenuOpen(true);
                setMoreMenuClosing(false);
              }
            }}><MoreHorizontal size={20} /></button>

            {moreMenuOpen && (
              <div className={`note-more-menu ${moreMenuClosing ? "note-more-menu-closing" : ""}`}>
                <button type="button" onClick={() => {
                  const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                  const textToCopy = note.type === "canvas" ? `${title || "Untitled"}\n\nCanvas note` : `${title || "Untitled"}\n\n${plainText}`;
                  navigator.clipboard.writeText(textToCopy);
                  setMoreMenuClosing(true);
                  setTimeout(() => { setMoreMenuOpen(false); setMoreMenuClosing(false); }, 140);
                }}><Copy size={16} /><span>Copy note</span></button>
                <div className="note-more-divider" />
                <button type="button" onClick={() => {
                  if (onDuplicate) onDuplicate(note);
                  setMoreMenuClosing(true);
                  setTimeout(() => { setMoreMenuOpen(false); setMoreMenuClosing(false); }, 140);
                }}><Files size={16} /><span>Duplicate note</span></button>
              </div>
            )}
          </div>

          <button className="icon-button delete-icon-button" type="button" title="Delete note" onClick={() => { if (window.confirm("Move this note to trash?")) onDelete(note._id); }}><Trash2 size={18} /></button>
        </div>
      </header>

      {note.type === "canvas" ? (
        <CanvasEditor canvasData={canvasData} onChange={setCanvasData} noteId={note._id} />
      ) : (
        <RichTextEditor value={content} onChange={setContent} noteId={note._id} />
      )}

      <footer className="editor-footer">
        <span className="word-count">{note.type === "canvas" ? "Canvas" : `${getWordCount()} ${getWordCount() === 1 ? "word" : "words"}`}</span>
        <div className="save-status">
          {saveStatus === "saving" && <><span className="status-dot saving" />Saving changes...</>}
          {saveStatus === "saved" && <><span className="status-dot saved" />All changes saved</>}
          {saveStatus === "error" && <><span className="status-dot error" />Couldn't save changes</>}
        </div>
      </footer>
    </main>
  );
}

export default NoteEditor;
