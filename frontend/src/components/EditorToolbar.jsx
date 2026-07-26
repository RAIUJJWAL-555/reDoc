// Toolbar for the TipTap editor with formatting buttons
// Each button toggles its respective formatting mark or node
export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  // Helper to check if a mark is currently active (for button highlighting)
  const isActive = (name, attrs) => editor.isActive(name, attrs);

  return (
    <div className="toolbar">
      {/* Text formatting group */}
      <button
        className={`toolbar-btn ${isActive("bold") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        className={`toolbar-btn ${isActive("italic") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        className={`toolbar-btn ${isActive("underline") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <u>U</u>
      </button>

      <div className="toolbar-divider" />

      {/* Heading buttons */}
      <button
        className={`toolbar-btn ${isActive("heading", { level: 1 }) ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        H1
      </button>
      <button
        className={`toolbar-btn ${isActive("heading", { level: 2 }) ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </button>
      <button
        className={`toolbar-btn ${!isActive("heading") && !isActive("bulletList") && !isActive("orderedList") ? "active" : ""}`}
        onClick={() => editor.chain().focus().setParagraph().run()}
        title="Paragraph"
      >
        ¶
      </button>

      <div className="toolbar-divider" />

      {/* List buttons */}
      <button
        className={`toolbar-btn ${isActive("bulletList") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        • List
      </button>
      <button
        className={`toolbar-btn ${isActive("orderedList") ? "active" : ""}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        1. List
      </button>
    </div>
  );
}
