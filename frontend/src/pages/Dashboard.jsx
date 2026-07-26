import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import heroImg from "../assets/hero.png";

const API_URL = "http://localhost:5000";

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
  const fileInputRef = useRef(null); // Ref to trigger the hidden file input

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

  // Handle file upload — sends the file to the backend as multipart/form-data
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      // Build a FormData object — this is how browsers send file uploads
      // The backend expects a "file" field and a "userId" field
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUser._id);

      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        body: formData, // No Content-Type header — browser sets it automatically with the boundary
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Success — navigate to the new document's editor
      navigate(`/document/${data._id}`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be re-uploaded if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

          {/* Hidden file input — triggered by the upload button */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.md"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={creating || uploading}
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
          <span className="upload-hint">Supported formats: .txt, .md</span>
        </div>
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
