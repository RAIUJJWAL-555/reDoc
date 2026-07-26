import Document from "../models/Document.js";
import Share from "../models/Share.js";
import User from "../models/User.js";

// Helper: validate that a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// POST /api/documents — Create a new document
// The owner is set to the userId passed in the request body
export const createDocument = async (req, res) => {
  try {
    const { userId, title, content } = req.body;

    // Validate userId is provided
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Validate userId is a valid ObjectId
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Check that the user actually exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create and save the document
    const document = await Document.create({
      title: title || "Untitled Document",
      content: content || "",
      owner: userId,
    });

    res.status(201).json(document);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/documents/mine — List all documents owned by a user
// userId is passed as a query parameter
export const getMyDocuments = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Find all documents where this user is the owner, newest first
    const documents = await Document.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .populate("owner", "name email");

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/documents/shared — List documents shared with a user
// userId is passed as a query parameter
export const getSharedDocuments = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Find all share records for this user, then get the documents
    const shares = await Share.find({ sharedWith: userId })
      .populate({
        path: "document",
        populate: { path: "owner", select: "name email" },
      })
      .sort({ updatedAt: -1 });

    // Extract the actual documents from the share records
    // Include the access level so the frontend can show "Shared (Viewer)" etc.
    const documents = shares.map((share) => ({
      ...share.document.toObject(),
      shareAccess: share.access,
    }));

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/documents/:id — Get a single document
// Checks if the user is the owner or has been shared access
// Returns the document plus the requesting user's role ("owner", "editor", or "viewer")
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    const document = await Document.findById(id).populate(
      "owner",
      "name email"
    );

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Determine the requesting user's role for this document
    let userRole = null;

    if (userId) {
      const isOwner = document.owner._id.toString() === userId;

      if (isOwner) {
        userRole = "owner";
      } else {
        // Check if user has a share record for this document
        const share = await Share.findOne({
          document: id,
          sharedWith: userId,
        });

        if (!share) {
          return res.status(403).json({ error: "Access denied" });
        }

        userRole = share.access; // "viewer" or "editor"
      }
    }

    // Return the document along with the user's role
    res.json({ ...document.toObject(), userRole });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/documents/:id — Update document title and/or content
// Only the owner or users with "editor" access can update
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, content } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check if user is the owner
    const isOwner = document.owner.toString() === userId;

    if (!isOwner) {
      // If not owner, check if they have editor access
      const share = await Share.findOne({
        document: id,
        sharedWith: userId,
      });

      if (!share || share.access !== "editor") {
        return res.status(403).json({
          error: "Only the owner or editors can update this document",
        });
      }
    }

    // Update fields that were provided
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;

    const updated = await document.save();

    res.json(updated);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/documents/:id — Delete a document
// Only the owner can delete their document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only the owner can delete
    if (document.owner.toString() !== userId) {
      return res.status(403).json({
        error: "Only the owner can delete this document",
      });
    }

    await Document.findByIdAndDelete(id);

    // Also remove all share records for this document
    await Share.deleteMany({ document: id });

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/documents/:id/share — Share a document with another user
// Body: { ownerId, sharedWithEmail, access }
// Only the document owner can share it
export const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, sharedWithEmail, access } = req.body;

    // Validate required fields
    if (!ownerId || !sharedWithEmail) {
      return res.status(400).json({
        error: "ownerId and sharedWithEmail are required",
      });
    }

    if (!isValidObjectId(id) || !isValidObjectId(ownerId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Validate access level
    const validAccess = ["viewer", "editor"];
    if (access && !validAccess.includes(access)) {
      return res.status(400).json({
        error: "Access must be 'viewer' or 'editor'",
      });
    }

    // Verify the document exists
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only the owner can share
    if (document.owner.toString() !== ownerId) {
      return res.status(403).json({
        error: "Only the owner can share this document",
      });
    }

    // Look up the target user by email
    const targetUser = await User.findOne({
      email: sharedWithEmail.toLowerCase().trim(),
    });
    if (!targetUser) {
      return res.status(404).json({
        error: "No user found with that email",
      });
    }

    // Prevent sharing with yourself
    if (targetUser._id.toString() === ownerId) {
      return res.status(400).json({
        error: "Cannot share a document with yourself",
      });
    }

    // If a share already exists, update the access level instead of duplicating
    const existingShare = await Share.findOne({
      document: id,
      sharedWith: targetUser._id,
    });

    if (existingShare) {
      existingShare.access = access || "viewer";
      await existingShare.save();
      return res.json({
        message: "Share updated",
        share: existingShare,
      });
    }

    // Create new share record
    const share = await Share.create({
      document: id,
      sharedWith: targetUser._id,
      access: access || "viewer",
    });

    res.status(201).json({ message: "Document shared", share });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/documents/:id/shares — List all users a document is shared with
// Only the owner can view the share list
export const getDocumentShares = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    if (!ownerId) {
      return res.status(400).json({ error: "ownerId query param is required" });
    }

    // Verify the document exists
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only the owner can view shares
    if (document.owner.toString() !== ownerId) {
      return res.status(403).json({
        error: "Only the owner can view share details",
      });
    }

    // Get all shares with user details populated
    const shares = await Share.find({ document: id })
      .populate("sharedWith", "name email")
      .sort({ createdAt: -1 });

    res.json(shares);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/documents/:id/share/:userId — Remove a user's access
// Only the owner can remove shares
export const removeShare = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { ownerId } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    // Verify the document exists
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only the owner can remove shares
    if (document.owner.toString() !== ownerId) {
      return res.status(403).json({
        error: "Only the owner can remove shares",
      });
    }

    // Find and remove the share record
    const share = await Share.findOneAndDelete({
      document: id,
      sharedWith: userId,
    });

    if (!share) {
      return res.status(404).json({ error: "Share not found" });
    }

    res.json({ message: "Access removed" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
