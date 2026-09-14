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
    if (!editor || !noteId) return;

    editor.innerHTML = normalizeLegacyContent(value);
  }, [noteId]);

  const serialize = () => {
    const editor = editorRef.current;
    if (!editor) return "";

    const clone = editor.cloneNode(true);

    clone.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.checked) {
        checkbox.setAttribute("checked", "checked");
      } else {
        checkbox.removeAttribute("checked");
      }
    });

    return clone.innerHTML;
  };

  const emitChange = () => onChange(serialize());

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
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
      <div className="rich-editor-toolbar" role="toolbar" aria-label="Formatting tools">
        <button type="button" className="rich-editor-tool" onClick={() => runCommand("bold")} title="Bold" aria-label="Bold"><Bold size={16} /></button>
        <button type="button" className="rich-editor-tool" onClick={() => runCommand("italic")} title="Italic" aria-label="Italic"><Italic size={16} /></button>
        <span className="rich-editor-separator" />
        <button type="button" className="rich-editor-tool" onClick={() => runCommand("insertUnorderedList")} title="Bulleted list" aria-label="Bulleted list"><List size={17} /></button>
        <button type="button" className="rich-editor-tool" onClick={() => runCommand("insertOrderedList")} title="Numbered list" aria-label="Numbered list"><ListOrdered size={17} /></button>
        <button type="button" className="rich-editor-tool" onClick={insertChecklist} title="Checklist" aria-label="Checklist"><CheckSquare size={17} /></button>
        <span className="rich-editor-separator" />
        <button type="button" className="rich-editor-tool" onClick={() => runCommand("formatBlock", "blockquote")} title="Quote" aria-label="Quote"><Quote size={16} /></button>
        <button type="button" className="rich-editor-tool" onClick={() => runCommand("formatBlock", "pre")} title="Code block" aria-label="Code block"><Code size={16} /></button>
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
