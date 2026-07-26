import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useUser } from "../context/UserContext";
import EditorToolbar from "../components/EditorToolbar";
import ShareModal from "../components/ShareModal";

const API_URL = "http://localhost:5000";

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

  // Fetch the document on mount and determine access level
  useEffect(() => {
    if (!currentUser) return;

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
        setDocument(doc);
        setTitle(doc.title);

        // Use the role returned by the backend
        setUserRole(doc.userRole);

        // Only owners and editors can edit
        const canEdit = doc.userRole === "owner" || doc.userRole === "editor";
        setIsReadOnly(!canEdit);

        // Load content into the editor once it's ready
        if (editor && doc.content) {
          editor.commands.setContent(doc.content);
          latestContent.current = doc.content;
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, currentUser, editor]);

  // Update editor editable state when readOnly changes
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

      {/* Editable title field */}
      <input
        className="editor-title"
        type="text"
        value={title}
        onChange={(e) => {
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
      {editor && <EditorToolbar editor={editor} />}
      <div className="editor-content">
        <EditorContent editor={editor} />
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
