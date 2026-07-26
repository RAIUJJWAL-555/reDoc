import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useUser } from "../context/UserContext";
import EditorToolbar from "../components/EditorToolbar";
import ShareModal from "../components/ShareModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "unsaved"
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [userRole, setUserRole] = useState(null); // "owner" | "editor" | "viewer"
  const [showShareModal, setShowShareModal] = useState(false);
  // Stores the fetched document content until the editor is ready to receive it
  const [pendingContent, setPendingContent] = useState(null);

  // Ref to hold the latest content for auto-save without re-rendering
  const latestContent = useRef("");
  // Ref to the debounce timer
  const saveTimer = useRef(null);

  // Initialize TipTap editor with our extensions
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    editable: !isReadOnly,
    // Track content changes for auto-save
    onUpdate: ({ editor }) => {
      // Skip save-related side effects when the user has read-only access
      if (isReadOnly) return;
      latestContent.current = editor.getHTML();
      setSaveStatus("unsaved");
      // Reset the debounce timer on every keystroke
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveDocument(latestContent.current);
      }, 1200); // 1.2 second debounce
    },
  });

  // Save document content to the backend
  const saveDocument = useCallback(
    async (content) => {
      if (!currentUser || isReadOnly) return;
      setSaveStatus("saving");
      try {
        const res = await fetch(`${API_URL}/api/documents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser._id,
            content,
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
        setSaveStatus("saved");
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus("error");
      }
    },
    [id, currentUser, isReadOnly]
  );

  // Save title when user blurs the input or presses Enter
  const saveTitle = async () => {
    if (!currentUser || isReadOnly) return;
    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
          title,
        }),
      });
      if (!res.ok) throw new Error("Failed to save title");
    } catch (err) {
      console.error("Title save failed:", err);
    }
  };

  // Download the document content as an HTML file
  const handleDownload = () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    const fileName = (title || "document").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-");
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Document"}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a2e; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-bottom: 0.5em; }
    ul, ol { padding-left: 1.5em; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${title || "Untitled Document"}</h1>
  ${htmlContent}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Effect 1: Fetch the document data (runs once on mount / user change) ---
  // This does NOT touch the editor at all — it just loads data into React state.
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false; // Prevents state updates if the component unmounts

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/api/documents/${id}?userId=${currentUser._id}`
        );

        if (res.status === 403) {
          setError("You don't have access to this document.");
          return;
        }
        if (!res.ok) {
          setError("Document not found.");
          return;
        }

        const doc = await res.json();
        if (cancelled) return; // Don't update state if the component unmounted

        setDocument(doc);
        setTitle(doc.title);

        // Use the role returned by the backend
        setUserRole(doc.userRole);

        // Only owners and editors can edit
        const canEdit = doc.userRole === "owner" || doc.userRole === "editor";
        setIsReadOnly(!canEdit);

        // Store the content so Effect 2 can load it into the editor
        setPendingContent(doc.content || "");
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDocument();

    // Cleanup: if the effect re-runs or unmounts, skip stale updates
    return () => { cancelled = true; };
  }, [id, currentUser]);

  // --- Effect 2: Load content into the editor once BOTH the editor and the ---
  // fetched document are ready. This avoids the "Cannot read properties of null"
  // error that happened when the old code tried editor.commands.setContent()
  // inside the async fetch callback where `editor` could be stale/null.
  useEffect(() => {
    if (editor && pendingContent !== null) {
      editor.commands.setContent(pendingContent);
      latestContent.current = pendingContent;
      // Clear pending so we don't re-load on every re-render
      setPendingContent(null);
    }
  }, [editor, pendingContent]);

  // --- Effect 3: Sync the editor's editable state when isReadOnly changes ---
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Cleanup the debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!currentUser) {
    return <div className="editor-loading">Select a user to continue...</div>;
  }

  if (loading) {
    return <div className="editor-loading">Loading document...</div>;
  }

  if (error) {
    return (
      <div className="editor-error">
        <p>{error}</p>
        <button className="btn-secondary" onClick={() => navigate("/")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="editor-page">
      {/* Header with back button, share button, and save status */}
      <div className="editor-header">
        <button className="btn-back" onClick={() => navigate("/")}>
          &larr; Back
        </button>
        <div className="editor-header-right">
          {/* Save status — only relevant for editors and owners */}
          {!isReadOnly && (
            <span
              className={`save-status ${
                saveStatus === "saving"
                  ? "saving"
                  : saveStatus === "saved"
                  ? "saved"
                  : saveStatus === "error"
                  ? "error"
                  : ""
              }`}
            >
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "unsaved" && "Unsaved changes"}
              {saveStatus === "error" && "Save failed"}
            </span>
          )}

          {/* Download button — visible to everyone */}
          <button
            className="btn-secondary"
            onClick={handleDownload}
            title="Download document"
          >
            ↓ Download
          </button>

          {/* Share button — only visible to the owner */}
          {userRole === "owner" && (
            <button
              className="btn-primary"
              onClick={() => setShowShareModal(true)}
            >
              Share
            </button>
          )}
        </div>
      </div>

      {/* Editable title field — readOnly for viewers */}
      <input
        className="editor-title"
        type="text"
        value={title}
        onChange={(e) => {
          if (isReadOnly) return;
          setTitle(e.target.value);
          setSaveStatus("unsaved");
        }}
        onBlur={saveTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.target.blur(); // Triggers onBlur which calls saveTitle
          }
        }}
        readOnly={isReadOnly}
        placeholder="Untitled Document"
      />

      {isReadOnly && (
        <p className="readonly-banner">
          View only — you don&apos;t have edit access
        </p>
      )}

      {/* TipTap toolbar and editor area */}
      {editor && <EditorToolbar editor={editor} isReadOnly={isReadOnly} />}
      <div className="editor-content">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <p className="editor-loading">Loading editor...</p>
        )}
      </div>

      {/* Share modal — shown when the owner clicks "Share" */}
      {showShareModal && (
        <ShareModal
          documentId={id}
          ownerId={currentUser._id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
