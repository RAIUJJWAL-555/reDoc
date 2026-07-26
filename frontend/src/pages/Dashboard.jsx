import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import heroImg from "../assets/hero.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Allowed file extensions and maximum upload size
const ALLOWED_EXTENSIONS = ["txt", "md"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export default function Dashboard() {
  const { currentUser } = useUser();
  const navigate = useNavigate();

  const [myDocs, setMyDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  // Tracks how many nested dragEnter events are active (see handleDragEnter)
  const dragCounterRef = useRef(0);

  // Fetch both owned and shared documents when the user changes
  useEffect(() => {
    if (!currentUser) return;

    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mineRes, sharedRes] = await Promise.all([
          fetch(`${API_URL}/api/documents/mine?userId=${currentUser._id}`),
          fetch(`${API_URL}/api/documents/shared?userId=${currentUser._id}`),
        ]);

        if (!mineRes.ok || !sharedRes.ok) {
          throw new Error("Failed to fetch documents");
        }

        const mineData = await mineRes.json();
        const sharedData = await sharedRes.json();

        setMyDocs(mineData);
        setSharedDocs(sharedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [currentUser]);

  // Create a new blank document and navigate straight to the editor
  const handleNewDocument = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id }),
      });

      if (!res.ok) throw new Error("Failed to create document");

      const doc = await res.json();
      navigate(`/document/${doc._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── File validation ──────────────────────────────────────────────
  // Checks extension (.txt / .md) and size (≤ 2 MB) before uploading.
  // Returns an error string if invalid, or null if the file is OK.
  const validateFile = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Only .txt and .md files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 2 MB.";
    }
    return null;
  };

  // ── Shared upload logic ──────────────────────────────────────────
  // Called by both the click-to-upload button AND the drop handler
  // so we don't duplicate the fetch / navigation code.
  const uploadFile = async (file) => {
    setUploadError(null);

    // Validate before sending to the server
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUser._id);

      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        body: formData, // browser sets Content-Type + boundary automatically
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Success — navigate to the new document's editor
      navigate(`/document/${data._id}`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      // Reset the hidden file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Called when the user picks a file via the native file picker
  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  // ── Drag-and-drop handlers ───────────────────────────────────────
  // The browser fires dragEnter / dragLeave on every child element inside
  // the drop zone, which causes flickering. We solve this with a simple
  // counter: increment on dragEnter, decrement on dragLeave, and only
  // show the highlight when the counter goes above zero.

  const handleDragEnter = (e) => {
    e.preventDefault();          // required so the browser allows a drop
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);       // first child entered → show highlight
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();          // WITHOUT this the browser will open the file
    e.stopPropagation();         // instead of firing the drop event
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);      // last child left → hide highlight
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // Format a date string into a readable format
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!currentUser) {
    return (
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to reDoc</h1>
          <p className="hero-subtitle">
            A collaborative document editor. Create, share, and edit documents in real time.
          </p>
          <p className="hero-cta">Select a user from the dropdown above to get started.</p>
        </div>
        <div className="hero-image-wrapper">
          <img src={heroImg} alt="reDoc illustration" className="hero-image" />
        </div>
      </section>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Documents</h1>
        <div className="dashboard-actions">
          <button
            className="btn-primary"
            onClick={handleNewDocument}
            disabled={creating || uploading}
          >
            {creating ? "Creating..." : "+ New Document"}
          </button>
        </div>
      </div>

      {/* ── Drop zone — drag-and-drop OR click to upload ─────────── */}
      {/* Clicking anywhere inside opens the native file picker.
          Dragging a file over shows a highlighted overlay. */}
      <div
        className={`drop-zone ${isDragOver ? "drop-zone--active" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        {/* Hidden file input — triggered by clicking the drop zone */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.md"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />

        {uploading ? (
          <p className="drop-zone__text">Uploading…</p>
        ) : isDragOver ? (
          <p className="drop-zone__text drop-zone__text--highlight">
            Drop file to upload
          </p>
        ) : (
          <>
            <p className="drop-zone__text">
              Drag &amp; drop a file here, or{" "}
              <span className="drop-zone__link">browse</span>
            </p>
            <p className="drop-zone__hint">Supported formats: .txt, .md · Max 2 MB</p>
          </>
        )}
      </div>

      {/* Upload error shown inline near the buttons */}
      {uploadError && <div className="error-message">{uploadError}</div>}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="dashboard-loading">Loading documents...</div>
      ) : (
        <>
          {/* --- My Documents Section --- */}
          <section className="doc-section">
            <h2>My Documents</h2>
            {myDocs.length === 0 ? (
              <p className="empty-state">
                No documents yet. Click &quot;+ New Document&quot; to get started.
              </p>
            ) : (
              <div className="doc-grid">
                {myDocs.map((doc) => (
                  <div
                    key={doc._id}
                    className="doc-card"
                    onClick={() => navigate(`/document/${doc._id}`)}
                  >
                    <div className="doc-card-header">
                      <h3 className="doc-card-title">
                        {doc.title || "Untitled Document"}
                      </h3>
                      <span className="role-badge owner">Owner</span>
                    </div>
                    <p className="doc-card-date">
                      Updated {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* --- Shared with Me Section --- */}
          <section className="doc-section">
            <h2>Shared with Me</h2>
            {sharedDocs.length === 0 ? (
              <p className="empty-state">No documents have been shared with you yet.</p>
            ) : (
              <div className="doc-grid">
                {sharedDocs.map((doc) => (
                  <div
                    key={doc._id}
                    className="doc-card"
                    onClick={() => navigate(`/document/${doc._id}`)}
                  >
                    <div className="doc-card-header">
                      <h3 className="doc-card-title">
                        {doc.title || "Untitled Document"}
                      </h3>
                      <span className={`role-badge ${doc.shareAccess}`}>
                        Shared ({doc.shareAccess === "editor" ? "Editor" : "Viewer"})
                      </span>
                    </div>
                    <p className="doc-card-date">
                      Updated {formatDate(doc.updatedAt)}
                    </p>
                    <p className="doc-card-owner">
                      by {doc.owner?.name || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
