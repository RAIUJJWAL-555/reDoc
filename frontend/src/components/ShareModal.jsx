import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Modal for sharing a document with other users
// Shows a form to add new shares and a list of existing shares
export default function ShareModal({ documentId, ownerId, onClose }) {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState("viewer");
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text: "..." }

  // Fetch the current share list — wrapped in useCallback so the useEffect
  // dependency array doesn't cause infinite re-renders
  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/shares?ownerId=${ownerId}`
      );
      if (!res.ok) throw new Error("Failed to load shares");
      const data = await res.json();
      setShares(data);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, [documentId, ownerId]);

  // Fetch shares when the modal opens
  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  // Handle the share form submission
  const handleShare = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Basic validation
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          sharedWithEmail: email.trim(),
          access,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to share");
      }

      setMessage({ type: "success", text: "Document shared successfully!" });
      setEmail(""); // Clear the input
      fetchShares(); // Refresh the share list
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Remove a user's access to the document
  const handleRemove = async (sharedUserId) => {
    try {
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/share/${sharedUserId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove access");
      }

      fetchShares(); // Refresh the list
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Close modal when clicking the backdrop (outside the modal box)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Share Document</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* --- Share Form --- */}
        <form className="share-form" onSubmit={handleShare}>
          <div className="share-form-row">
            <input
              type="email"
              className="share-input"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            <select
              className="share-select"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              disabled={submitting}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>

        {/* --- Status Message --- */}
        {message && (
          <div className={`share-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* --- Shared Users List --- */}
        <div className="share-list">
          <h3>Shared with</h3>
          {loading ? (
            <p className="share-list-empty">Loading...</p>
          ) : shares.length === 0 ? (
            <p className="share-list-empty">Not shared with anyone yet</p>
          ) : (
            <ul>
              {shares.map((share) => (
                <li key={share._id} className="share-list-item">
                  <div className="share-list-user">
                    <span className="share-list-name">
                      {share.sharedWith?.name || "Unknown"}
                    </span>
                    <span className="share-list-email">
                      {share.sharedWith?.email}
                    </span>
                    <span className={`share-access-badge ${share.access}`}>
                      {share.access}
                    </span>
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => handleRemove(share.sharedWith?._id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
