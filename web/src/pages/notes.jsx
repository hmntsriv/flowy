import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  PenTool,
  X,
} from "lucide-react";
import api from "../services/api";

import Sidebar from "../components/Sidebar";
import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor";
import GlassCard from "../components/GlassCard";
import Toast from "../components/Toast";
import socket from "../services/socket";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [trashNotes, setTrashNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [toast, setToast] = useState({
  message: "",
  type: "success",
});

  const [activeView, setActiveView] = useState("notes");

  const [loading, setLoading] = useState(true);

  const [mobileView, setMobileView] = useState("list");
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [createNoteMenuOpen, setCreateNoteMenuOpen] =
  useState(false);
const showToast = (message, type = "success") => {
  setToast({
    message,
    type,
  });

  setTimeout(() => {
    setToast({
      message: "",
      type: "success",
    });
  }, 3000);
};
  // =========================
  // Fetch active notes
  // =========================

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await api.get("/notes");

        setNotes(response.data.notes);
            } catch (error) {
        console.error(
          "Failed to fetch notes:",
          error
        );

        showToast(
          error.response?.data?.message ||
            "Couldn't load your notes",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // =========================
  // Fetch trash notes
  // =========================

  useEffect(() => {
    const fetchTrashNotes = async () => {
      try {
        const response = await api.get(
          "/notes/trash"
        );

        setTrashNotes(response.data.notes);
       } catch (error) {
        console.error(
          "Failed to fetch trash notes:",
          error
        );

        showToast(
          error.response?.data?.message ||
            "Couldn't load your trash",
          "error"
        );
      }
    };

    fetchTrashNotes();
  }, []);

  // =========================
  // Socket connection
  // =========================

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "Connected to Flowy realtime server"
      );
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  // =========================
  // Realtime note updates
  // =========================

  useEffect(() => {
    const handleNoteUpdate = (updatedNote) => {
      if (updatedNote.isTrashed) {
        // Remove from active notes
        setNotes((prevNotes) =>
          prevNotes.filter(
            (note) =>
              note._id !== updatedNote._id
          )
        );

        // Add/update in trash
        setTrashNotes((prevNotes) => {
          const exists = prevNotes.some(
            (note) =>
              note._id === updatedNote._id
          );

          if (exists) {
            return prevNotes.map((note) =>
              note._id === updatedNote._id
                ? updatedNote
                : note
            );
          }

          return [updatedNote, ...prevNotes];
        });
      } else {
        // Remove from trash
        setTrashNotes((prevNotes) =>
          prevNotes.filter(
            (note) =>
              note._id !== updatedNote._id
          )
        );

        // Add/update active notes
        setNotes((prevNotes) => {
          const exists = prevNotes.some(
            (note) =>
              note._id === updatedNote._id
          );

          if (exists) {
            return prevNotes.map((note) =>
              note._id === updatedNote._id
                ? updatedNote
                : note
            );
          }

          return [updatedNote, ...prevNotes];
        });
      }

      // Update editor if this note is open
      setSelectedNote((currentNote) => {
        if (
          currentNote?._id === updatedNote._id
        ) {
          return updatedNote;
        }

        return currentNote;
      });
    };

    socket.on(
      "note:updated",
      handleNoteUpdate
    );

    return () => {
      socket.off(
        "note:updated",
        handleNoteUpdate
      );
    };
  }, []);

  // =========================
  // Visible notes
  // =========================

  const visibleNotes =
    activeView === "starred"
      ? notes.filter(
          (note) => note.isStarred
        )
      : activeView === "trash"
        ? trashNotes
        : notes;

  // =========================
  // View navigation
  // =========================

  const handleSelectView = (view) => {
    setActiveView(view);
    setSelectedNote(null);
    setMobileView("list");
    setMobileMenuOpen(false);
  };

  // =========================
  // Create new note
  // =========================

const handleOpenCreateNoteMenu = () => {
  setCreateNoteMenuOpen(true);
  setMobileMenuOpen(false);
};
  
const handleNewNote = async (type = "text") => {
  try {
    setCreateNoteMenuOpen(false);
    const response = await api.post("/notes", {
      title: "",
      content: "",
      type,
    });

    const newNote = response.data.note;

    setNotes((prevNotes) => [
      newNote,
      ...prevNotes,
    ]);

    setSelectedNote(newNote);

    setActiveView("notes");
    setMobileMenuOpen(false);
    setMobileView("editor");
    } catch (error) {
    console.error("Failed to create note:", error);

    showToast(
      error.response?.data?.message ||
        "Couldn't create note",
      "error"
    );
  }
};

  // =========================
  // Update note
  // =========================

  const handleUpdateNote = async (updates) => {
    if (!selectedNote) return;

    try {
      const response = await api.put(
        `/notes/${selectedNote._id}`,
        updates
      );

      const updatedNote = response.data.note;

      if (updatedNote.isTrashed) {
        setNotes((prevNotes) =>
          prevNotes.filter(
            (note) =>
              note._id !== updatedNote._id
          )
        );

        setTrashNotes((prevNotes) => {
          const exists = prevNotes.some(
            (note) =>
              note._id === updatedNote._id
          );

          if (exists) {
            return prevNotes.map((note) =>
              note._id === updatedNote._id
                ? updatedNote
                : note
            );
          }

          return [updatedNote, ...prevNotes];
        });
      } else {
        setTrashNotes((prevNotes) =>
          prevNotes.filter(
            (note) =>
              note._id !== updatedNote._id
          )
        );

        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === updatedNote._id
              ? updatedNote
              : note
          )
        );
      }

      setSelectedNote(updatedNote);

      socket.emit(
        "note:updated",
        updatedNote
      );

      return updatedNote;
    } catch (error) {
      console.error(
        "Failed to update note:",
        error
      );

      throw error;
    }
  };

  // =========================
  // Move note to trash
  // =========================

  const handleDuplicateNote = async (note) => {
    try {
      const response = await api.post("/notes", {
        title: `${note.title || "Untitled"} Copy`,
        content: note.content || "",
        type: note.type || "text",
        canvasData: note.canvasData || null,
        isStarred: false,
        isTrashed: false,
      });

      const duplicatedNote = response.data.note;

      setNotes((prevNotes) => [
        duplicatedNote,
        ...prevNotes,
      ]);

      setSelectedNote(duplicatedNote);
      setActiveView("notes");
      setMobileView("editor");
      showToast("Note duplicated");
    } catch (error) {
      console.error(
        "Failed to duplicate note:",
        error
      );
      showToast("Couldn't duplicate note", "error");
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await api.delete(
        `/notes/${noteId}`
      );

      const trashedNote = response.data.note;

      // Remove from active notes
      setNotes((prevNotes) =>
        prevNotes.filter(
          (note) => note._id !== noteId
        )
      );

      // Add to trash
      setTrashNotes((prevNotes) => [
        trashedNote,
        ...prevNotes.filter(
          (note) => note._id !== noteId
        ),
      ]);

      // Close editor
      if (selectedNote?._id === noteId) {
        setSelectedNote(null);
        setMobileView("list");
      }

      // Tell other tabs
      socket.emit(
        "note:updated",
        trashedNote
      );
      showToast("Note moved to trash");
    } catch (error) {
      console.error(
        "Failed to move note to trash:",
        error
      );
      showToast("Couldn't move note to trash", "error");
    }
  };


const handleRestoreNote = async (noteId) => {
  try {
    const response = await api.put(
      `/notes/${noteId}/restore`
    );

    const restoredNote = response.data.note;

    // Remove from Trash
    setTrashNotes((prevNotes) =>
      prevNotes.filter(
        (note) => note._id !== noteId
      )
    );

    // Add back to active Notes
    setNotes((prevNotes) => [
      restoredNote,
      ...prevNotes.filter(
        (note) => note._id !== noteId
      ),
    ]);

    // Clear editor
    setSelectedNote(null);
    setMobileView("list");

    // Go back to Notes view
    setActiveView("notes");

    // Tell other tabs
    socket.emit(
      "note:updated",
      restoredNote
    );
    showToast("Note restored");
  } catch (error) {
  console.error(
    "Failed to restore note:",
    error
  );

  showToast("Couldn't restore note", "error");
}
};

const handlePermanentDelete = async (noteId) => {
  try {
    await api.delete(
      `/notes/${noteId}/permanent`
    );

    setTrashNotes((prevNotes) =>
      prevNotes.filter(
        (note) => note._id !== noteId
      )
    );

    setSelectedNote(null);
    setMobileView("list");
    showToast("Note permanently deleted");
  } catch (error) {
    console.error(
      "Failed to permanently delete note:",
      error
    );
    showToast("Couldn't permanently delete note", "error");
  }
};


  // =========================
  // Loading state
  // =========================

  if (loading) {
  return (
    <div className="flowy-state-page">
      <div className="state-content">
        <div className="state-loader">
          <div className="state-loader-ring" />
          <div className="state-loader-mark">~</div>
        </div>

        <p className="state-title">
          Loading your notes
        </p>

        <p className="state-description">
          Getting everything ready for you...
        </p>
      </div>
    </div>
  );
}

  // =========================
  // Main UI
  // =========================

  return (
  <div
    className={`flowy-workspace ${
      mobileView === "editor"
        ? "mobile-editor"
        : ""
    }`}
  >
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() =>
        setToast({
          message: "",
          type: "success",
        })
      }
    />
      {createNoteMenuOpen && (
  <div className="create-note-overlay">
    <div className="create-note-modal">
      <div className="create-note-modal-header">
        <div>
          <h2>Create a new note</h2>
          <p>Choose how you want to capture your thoughts.</p>
        </div>
        
        <button
          type="button"
          className="create-note-close"
          aria-label="Close"
          onClick={() => setCreateNoteMenuOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="create-note-options">
        <button
          type="button"
          className="create-note-option"
          onClick={() => handleNewNote("text")}
        >
          <div className="create-note-option-icon">
            <FileText size={21} />
          </div>

          <div>
            <strong>Text note</strong>
            <span>
              Write down your thoughts and ideas.
            </span>
          </div>
        </button>

        <button
          type="button"
          className="create-note-option"
          onClick={() => handleNewNote("canvas")}
        >
          <div className="create-note-option-icon">
            <PenTool size={21} />
          </div>

          <div>
            <strong>Canvas note</strong>
            <span>
              Draw, sketch, and brainstorm freely.
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
)}
      {/* Mobile sidebar overlay */}

      {mobileMenuOpen && (
        <button
          className="mobile-menu-overlay"
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* Sidebar */}

      <GlassCard
        className={`sidebar-panel ${
          mobileMenuOpen
            ? "mobile-sidebar-open"
            : ""
        }`}
      >
        <Sidebar
          onNewNote={handleOpenCreateNoteMenu}
          activeView={activeView}
          onSelectView={handleSelectView}
        />
      </GlassCard>

      {/* Note list */}

      <GlassCard className="notes-panel">
        <NoteList
          notes={visibleNotes}
          title={
            activeView === "starred"
              ? "Starred"
              : activeView === "trash"
                ? "Trash"
                : "Notes"
          }
          selectedNote={selectedNote}
          onOpenMenu={() =>
            setMobileMenuOpen(true)
          }
          onNewNote={handleOpenCreateNoteMenu}
          onSelectNote={(note) => {
            setSelectedNote(note);
            setMobileView("editor");
            setMobileMenuOpen(false);
          }}
        />
      </GlassCard>

      {/* Editor */}

      <GlassCard className="editor-panel">
        <div className="editor-container">
          {mobileView === "editor" && (
            <button
              className="mobile-back-button"
              onClick={() =>
                setMobileView("list")
              }
              type="button"
            >
              <ArrowLeft size={17} />
              <span>Notes</span>
            </button>
          )}

          <NoteEditor
            note={selectedNote}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onDuplicate={handleDuplicateNote}
            onRestore={handleRestoreNote}
            onPermanentDelete={handlePermanentDelete}
            isTrashView={activeView === "trash"}
          />
        </div>
      </GlassCard>
    </div>
  );
}

export default Notes;