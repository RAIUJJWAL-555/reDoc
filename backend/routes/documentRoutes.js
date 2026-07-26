import { Router } from "express";
import {
  createDocument,
  getMyDocuments,
  getSharedDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  getDocumentShares,
  removeShare,
} from "../controllers/documentController.js";

const router = Router();

// POST /api/documents — Create a new document
router.post("/", createDocument);

// GET /api/documents/mine — List documents owned by the user
router.get("/mine", getMyDocuments);

// GET /api/documents/shared — List documents shared with the user
router.get("/shared", getSharedDocuments);

// GET /api/documents/:id — Get a single document (returns userRole: owner/editor/viewer)
router.get("/:id", getDocument);

// PUT /api/documents/:id — Update a document (owner or editor only)
router.put("/:id", updateDocument);

// DELETE /api/documents/:id — Delete a document (owner only)
router.delete("/:id", deleteDocument);

// POST /api/documents/:id/share — Share a document with a user (owner only)
router.post("/:id/share", shareDocument);

// GET /api/documents/:id/shares — List all shares for a document (owner only)
router.get("/:id/shares", getDocumentShares);

// DELETE /api/documents/:id/share/:userId — Remove a user's access (owner only)
router.delete("/:id/share/:userId", removeShare);

export default router;
