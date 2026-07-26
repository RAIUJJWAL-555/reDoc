import { Router } from "express";
import {
  createShare,
  getSharesByDocument,
  deleteShare,
} from "../controllers/shareController.js";

const router = Router();

// POST /api/shares — Share a document with a user (owner only)
router.post("/", createShare);

// GET /api/shares/:documentId — List all shares for a document (owner only)
router.get("/:documentId", getSharesByDocument);

// DELETE /api/shares/:id — Remove a share (owner or shared user)
router.delete("/:id", deleteShare);

export default router;
