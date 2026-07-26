import Document from "../models/Document.js";
import Share from "../models/Share.js";
import User from "../models/User.js";

// Helper: validate that a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// POST /api/shares — Share a document with another user
// Only the document owner can share it
export const createShare = async (req, res) => {
  try {
    const { documentId, sharedWithUserId, access, userId } = req.body;

    // Validate required fields
    if (!documentId || !sharedWithUserId || !userId) {
      return res.status(400).json({
        error: "documentId, sharedWithUserId, and userId are required",
      });
    }

    // Validate all ObjectIds
    if (
      !isValidObjectId(documentId) ||
      !isValidObjectId(sharedWithUserId) ||
      !isValidObjectId(userId)
    ) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Cannot share a document with yourself
    if (userId === sharedWithUserId) {
      return res.status(400).json({ error: "Cannot share a document with yourself" });
    }

    // Verify the document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only the owner can share the document
    if (document.owner.toString() !== userId) {
      return res.status(403).json({
        error: "Only the owner can share this document",
      });
    }

    // Verify the user being shared with exists
    const targetUser = await User.findById(sharedWithUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "User to share with not found" });
    }

    // Create or update the share record
    // If already shared, update the access level instead of creating a duplicate
    const existingShare = await Share.findOne({
      document: documentId,
      sharedWith: sharedWithUserId,
    });

    if (existingShare) {
      existingShare.access = access || "viewer";
      await existingShare.save();
      return res.json(existingShare);
    }

    const share = await Share.create({
      document: documentId,
      sharedWith: sharedWithUserId,
      access: access || "viewer",
    });

    res.status(201).json(share);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/shares/:documentId — List all shares for a document
// Only the document owner can see who it's shared with
export const getSharesByDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId } = req.query;

    if (!isValidObjectId(documentId)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    // Verify the document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only the owner can view share records
    if (document.owner.toString() !== userId) {
      return res.status(403).json({
        error: "Only the owner can view share details",
      });
    }

    const shares = await Share.find({ document: documentId })
      .populate("sharedWith", "name email")
      .sort({ createdAt: -1 });

    res.json(shares);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/shares/:id — Remove a share (revoke access)
// The document owner can remove any share; a user can also remove their own share
export const deleteShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid share ID format" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const share = await Share.findById(id);
    if (!share) {
      return res.status(404).json({ error: "Share not found" });
    }

    // Check if user is the document owner or the shared user
    const document = await Document.findById(share.document);
    const isOwner = document && document.owner.toString() === userId;
    const isSharedUser = share.sharedWith.toString() === userId;

    if (!isOwner && !isSharedUser) {
      return res.status(403).json({
        error: "Only the owner or the shared user can remove this share",
      });
    }

    await Share.findByIdAndDelete(id);

    res.json({ message: "Share removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
