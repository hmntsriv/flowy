import {
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function NoteList({ notes, selectedNote, onSelectNote, onOpenMenu, onNewNote, title }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setFilter("all");
    setFilterOpen(false);
  }, [title]);

  const filteredNotes = notes
    .filter((note) => {
      if (filter === "text" && note.type !== "text") return false;
      if (filter === "canvas" && note.type !== "canvas") return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const noteTitle = note.title?.toLowerCase() || "";
      const content = note.content?.replace(/<[^>]*>/g, " ").toLowerCase() || "";

      return noteTitle.includes(query) || content.includes(query);
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const getPreview = (content, type) => {
    if (type === "canvas") return "Canvas note";
    if (!content) return "No content yet";

    const plainText = content
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!plainText) return "No content yet";
    return plainText.length > 70 ? `${plainText.slice(0, 70)}...` : plainText;
  };

  const formatNoteDate = (date) => {
    if (!date) return "";
    const noteDate = new Date(date);
    const now = new Date();
    const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const difference = today.getTime() - noteDay.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (difference === 0) return noteDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (difference === oneDay) return "Yesterday";
    if (difference < 7 * oneDay) return noteDate.toLocaleDateString([], { weekday: "long" });
    return noteDate.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filterLabel = filter === "text" ? "Text" : filter === "canvas" ? "Canvas" : "All";

  return (
    <section className="note-list">
      <div className="mobile-note-header">
        <div className="flowy-logo">
          <div className="flowy-logo-mark">~</div>
          <span>Flowy</span>
        </div>
        <button className="mobile-menu-button" type="button" aria-label="Open menu" onClick={onOpenMenu}>
          <Menu size={20} />
        </button>
      </div>

      <div className="note-list-header"><h1>{title}</h1></div>

      <div className="note-search-wrapper">
        <div className="note-search">
          <Search size={17} />
          <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <button
            className={`note-filter-button ${filter !== "all" ? "active" : ""}`}
            type="button"
            aria-label="Filter notes"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {filterOpen && (
          <div className="note-filter-menu" ref={filterRef}>
            <div className="note-filter-menu-title">Filter notes</div>
            {[['all', 'All notes'], ['text', 'Text notes'], ['canvas', 'Canvas notes']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`note-filter-option ${filter === value ? "active" : ""}`}
                onClick={() => {
                  setFilter(value);
                  setFilterOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="note-list-content">
        <p className="note-section-label">
          {filteredNotes.length > 0 ? `${filterLabel === "All" ? "RECENT" : `${filterLabel.toUpperCase()} NOTES`}` : ""}
        </p>

        {filteredNotes.length === 0 ? (
          <div className="notes-empty">
            {searchQuery.trim() ? (
              <><div className="empty-icon"><Search size={20} /></div><p>No notes found</p><span>Try a different search.</span></>
            ) : title === "Starred" ? (
              <><div className="empty-icon"><Star size={20} /></div><p>No starred notes</p><span>Star your important notes to find them here.</span></>
            ) : title === "Trash" ? (
              <><div className="empty-icon"><Trash2 size={20} /></div><p>Trash is empty</p><span>Notes you delete will appear here.</span></>
            ) : (
              <><div className="empty-icon"><FileText size={20} /></div><p>No notes yet</p><span>Create your first note and let the ideas flow.</span><button type="button" className="empty-create-button" onClick={onNewNote}><Plus size={16} /><span>Create a note</span></button></>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <button key={note._id} className={`note-item ${selectedNote?._id === note._id ? "selected" : ""}`} type="button" onClick={() => onSelectNote(note)}>
              <div className="note-item-top">
                <h2>{note.title || "Untitled"}</h2>
                <span>{formatNoteDate(note.updatedAt)}</span>
              </div>
              <p>{getPreview(note.content, note.type)}</p>
            </button>
          ))
        )}
      </div>

      <button className="mobile-new-note-button" type="button" aria-label="Create new note" onClick={onNewNote}><Plus size={21} /></button>
    </section>
  );
}

export default NoteList;
