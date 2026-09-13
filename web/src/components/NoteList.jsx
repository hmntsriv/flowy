import {
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  Star,
  Trash2,
} from "lucide-react";

import { useState } from "react";

function NoteList({
  notes,
  selectedNote,
  onSelectNote,
  onOpenMenu,
  onNewNote,
  title,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes
    .filter((note) => {
      const query = searchQuery.toLowerCase().trim();

      if (!query) return true;

      const noteTitle = note.title?.toLowerCase() || "";
      const content = note.content?.toLowerCase() || "";

      return (
        noteTitle.includes(query) ||
        content.includes(query)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt) -
        new Date(a.updatedAt)
    );

  const getPreview = (content) => {
    if (!content) return "No content yet";

    return content.length > 70
      ? `${content.slice(0, 70)}...`
      : content;
  };

  const formatNoteDate = (date) => {
    if (!date) return "";

    const noteDate = new Date(date);
    const now = new Date();

    const noteDay = new Date(
      noteDate.getFullYear(),
      noteDate.getMonth(),
      noteDate.getDate()
    );

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const difference =
      today.getTime() - noteDay.getTime();

    const oneDay = 24 * 60 * 60 * 1000;

    if (difference === 0) {
      return noteDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (difference === oneDay) {
      return "Yesterday";
    }

    if (difference < 7 * oneDay) {
      return noteDate.toLocaleDateString([], {
        weekday: "long",
      });
    }

    return noteDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="note-list">
      {/* Mobile header */}
      <div className="mobile-note-header">
        <div className="flowy-logo">
          <div className="flowy-logo-mark">~</div>
          <span>Flowy</span>
        </div>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Open menu"
          onClick={onOpenMenu}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Title */}
      <div className="note-list-header">
        <h1>{title}</h1>
      </div>

      {/* Search */}
      <div className="note-search">
        <Search size={17} />

        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
        />

        <button
          className="note-filter-button"
          type="button"
          aria-label="Filter notes"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Notes */}
      <div className="note-list-content">
        <p className="note-section-label">
          {filteredNotes.length > 0 ? "RECENT" : ""}
        </p>

        {filteredNotes.length === 0 ? (
  <div className="notes-empty">
    {searchQuery.trim() ? (
      <>
        <div className="empty-icon">
          <Search size={20} />
        </div>

        <p>No notes found</p>

        <span>
          Try a different search.
        </span>
      </>
    ) : title === "Starred" ? (
      <>
        <div className="empty-icon">
          <Star size={20} />
        </div>

        <p>No starred notes</p>

        <span>
          Star your important notes to find them here.
        </span>
      </>
    ) : title === "Trash" ? (
      <>
        <div className="empty-icon">
          <Trash2 size={20} />
        </div>

        <p>Trash is empty</p>

        <span>
          Notes you delete will appear here.
        </span>
      </>
    ) : (
      <>
        <div className="empty-icon">
          <FileText size={20} />
        </div>

        <p>No notes yet</p>

        <span>
          Create your first note and let the ideas flow.
        </span>

        <button
          type="button"
          className="empty-create-button"
          onClick={onNewNote}
        >
          <Plus size={16} />
          <span>Create a note</span>
        </button>
      </>
    )}
  </div>
) : (
          filteredNotes.map((note) => {
            const isSelected =
              selectedNote?._id === note._id;

            return (
              <button
                key={note._id}
                className={`note-item ${
                  isSelected ? "selected" : ""
                }`}
                type="button"
                onClick={() => onSelectNote(note)}
              >
                <div className="note-item-top">
                  <h2>
                    {note.title || "Untitled"}
                  </h2>

                  <span>
                    {formatNoteDate(note.updatedAt)}
                  </span>
                </div>

                <p>{getPreview(note.content)}</p>
              </button>
            );
          })
        )}
      </div>

      {/* Mobile create button */}
      <button
        className="mobile-new-note-button"
        type="button"
        aria-label="Create new note"
        onClick={onNewNote}
      >
        <Plus size={21} />
      </button>
    </section>
  );
}

export default NoteList;