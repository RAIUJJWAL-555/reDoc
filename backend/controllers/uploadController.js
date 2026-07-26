import multer from "multer";
import { marked } from "marked";
import Document from "../models/Document.js";
import User from "../models/User.js";

// Configure multer to store files in memory (no disk writes)
// We only need the file content temporarily to extract text
const storage = multer.memoryStorage();

// File filter — only allow .txt and .md files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".txt", ".md"];
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));

  if (allowedTypes.includes(ext)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only .txt and .md files are supported"));
  }
};

// Create the multer upload middleware
// - memoryStorage: keeps the file in RAM as a Buffer
// - 2MB file size limit
// - fileFilter: rejects non-txt/md files
export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 megabytes
  fileFilter,
});

// Helper: validate that a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// POST /api/documents/upload
// Accepts a file upload, extracts text content, creates a new document
export const uploadDocument = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Check that a file was actually provided
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the filename without extension to use as the document title
    const originalName = req.file.originalname;
    const title = originalName.slice(0, originalName.lastIndexOf(".")) || "Uploaded Document";

    // Read the file content as a UTF-8 string
    const fileContent = req.file.buffer.toString("utf-8");

    // Convert content to HTML based on file type
    let htmlContent;
    const ext = originalName.toLowerCase().slice(originalName.lastIndexOf("."));

    if (ext === ".md") {
      // --- Markdown conversion ---
      // "marked" parses markdown syntax (headers, bold, lists, links, etc.)
      // and produces standard HTML that TipTap can render directly.
      // We use { async: false } so it runs synchronously for simplicity.
      htmlContent = marked.parse(fileContent);
    } else {
      // --- Plain text (.txt) ---
      // Split by double newlines to create paragraphs, wrap each in <p> tags.
      // Single newlines become <br> for line break preservation.
      const paragraphs = fileContent.split(/\n\n+/);
      htmlContent = paragraphs
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
    }

    // Create the document in the database
    const document = await Document.create({
      title,
      content: htmlContent,
      owner: userId,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
};

// Middleware to handle multer errors (wrong type, file too large, etc.)
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors (e.g., file too large)
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 2MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    // Our custom fileFilter errors (wrong file type)
    return res.status(400).json({ error: err.message });
  }

  next();
};
