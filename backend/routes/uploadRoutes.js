import { Router } from "express";
import { upload, uploadDocument, handleMulterError } from "../controllers/uploadController.js";

const router = Router();

// POST /api/documents/upload
// Accepts multipart/form-data with a "file" field + "userId" in the body
// multer.single("file") reads one file from the form and stores it in req.file
router.post(
  "/upload",
  upload.single("file"),
  handleMulterError,
  uploadDocument
);

export default router;
