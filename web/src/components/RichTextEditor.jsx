import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
} from "lucide-react";

function RichTextEditor({ value, onChange, noteId }) {
  const editorRef = useRef(null);
  const initializedNoteRef = useRef(null);

  const normalizeLegacyContent = (content) => {
    if (!content) return "";
    if (/<[a-z][\s\S]*>/i.test(content)) return content;

    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .split("\n")
      .map((line) => line || "<br>")
      .join("<br>");
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !noteId || initializedNoteRef.current === noteId) {
      return;
    }

    editor.innerHTML = normalizeLegacyContent(value);
    initializedNoteRef.current = noteId;
  }, [noteId, value]);

  const serialize = () => {
    const editor = editorRef.current;
    if (!editor) return "";

    const clone = editor.cloneNode(true);

    clone
      .querySelectorAll('input[type="checkbox"]')
      .forEach((checkbox) => {
        if (checkbox.checked) {
          checkbox.setAttribute("checked", "checked");
        } else {
          checkbox.removeAttribute("checked");
        }
      });

    return clone.innerHTML;
  };

  const emitChange = () => {
    onChange(serialize());
  };

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const toggleBlockquote = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    let node = selection.anchorNode;

    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    const blockquote = node?.closest?.("blockquote");

    if (blockquote && editor.contains(blockquote)) {
      // Toggle the current block back to a normal paragraph.
      document.execCommand("formatBlock", false, "p");
    } else {
      // Turn the current block into a quote.
      document.execCommand("formatBlock", false, "blockquote");
    }

    emitChange();
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      '<div class="rich-checklist-item"><input type="checkbox"><span>Checklist item</span></div>'
    );
    emitChange();
  };

  const handleClick = (event) => {
    if (event.target.matches('input[type="checkbox"]')) {
      requestAnimationFrame(emitChange);
    }
  };

  return (
    <div className="rich-editor">
      <div
        className="rich-editor-toolbar"
        role="toolbar"
        aria-label="Formatting tools"
      >
        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("bold")}
          title="Bold"
          aria-label="Bold"
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("italic")}
          title="Italic"
          aria-label="Italic"
        >
          <Italic size={16} />
        </button>

        <span className="rich-editor-separator" />

        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("insertUnorderedList")}
          title="Bulleted list"
          aria-label="Bulleted list"
        >
          <List size={17} />
        </button>

        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("insertOrderedList")}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered size={17} />
        </button>

        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertChecklist}
          title="Checklist"
          aria-label="Checklist"
        >
          <CheckSquare size={17} />
        </button>

        <span className="rich-editor-separator" />

        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleBlockquote}
          title="Quote"
          aria-label="Quote"
        >
          <Quote size={16} />
        </button>

        <button
          type="button"
          className="rich-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("formatBlock", "pre")}
          title="Code block"
          aria-label="Code block"
        >
          <Code size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        className="rich-editor-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing..."
        onInput={emitChange}
        onClick={handleClick}
      />
    </div>
  );
}

export default RichTextEditor;
