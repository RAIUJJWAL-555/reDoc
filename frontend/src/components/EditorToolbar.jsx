// Toolbar for the TipTap editor with formatting buttons
// Each button toggles its respective formatting mark or node
export default function EditorToolbar({ editor, isReadOnly = false }) {
  if (!editor) return null;

  // Helper to check if a mark is currently active (for button highlighting)
  const isActive = (name, attrs) => editor.isActive(name, attrs);

  // When read-only, every button is disabled — both visually and functionally
  const disabled = isReadOnly;

  // Helper to run a chain of editor commands, but only if editing is allowed
  const runCommand = (command) => {
    if (disabled) return;
    command.run();
  };

  return (
    <div className={`toolbar ${disabled ? "toolbar--readonly" : ""}`}>
      {/* Text formatting group */}
      <button
        className={`toolbar-btn ${isActive("bold") ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleBold())}
        disabled={disabled}
        title={disabled ? "No edit access" : "Bold"}
      >
        <strong>B</strong>
      </button>
      <button
        className={`toolbar-btn ${isActive("italic") ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleItalic())}
        disabled={disabled}
        title={disabled ? "No edit access" : "Italic"}
      >
        <em>I</em>
      </button>
      <button
        className={`toolbar-btn ${isActive("underline") ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleUnderline())}
        disabled={disabled}
        title={disabled ? "No edit access" : "Underline"}
      >
        <u>U</u>
      </button>

      <div className="toolbar-divider" />

      {/* Heading buttons */}
      <button
        className={`toolbar-btn ${isActive("heading", { level: 1 }) ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleHeading({ level: 1 }))}
        disabled={disabled}
        title={disabled ? "No edit access" : "Heading 1"}
      >
        H1
      </button>
      <button
        className={`toolbar-btn ${isActive("heading", { level: 2 }) ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleHeading({ level: 2 }))}
        disabled={disabled}
        title={disabled ? "No edit access" : "Heading 2"}
      >
        H2
      </button>
      <button
        className={`toolbar-btn ${!isActive("heading") && !isActive("bulletList") && !isActive("orderedList") ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().setParagraph())}
        disabled={disabled}
        title={disabled ? "No edit access" : "Paragraph"}
      >
        ¶
      </button>

      <div className="toolbar-divider" />

      {/* List buttons */}
      <button
        className={`toolbar-btn ${isActive("bulletList") ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleBulletList())}
        disabled={disabled}
        title={disabled ? "No edit access" : "Bullet List"}
      >
        • List
      </button>
      <button
        className={`toolbar-btn ${isActive("orderedList") ? "active" : ""}`}
        onClick={() => runCommand(editor.chain().focus().toggleOrderedList())}
        disabled={disabled}
        title={disabled ? "No edit access" : "Numbered List"}
      >
        1. List
      </button>
    </div>
  );
}
