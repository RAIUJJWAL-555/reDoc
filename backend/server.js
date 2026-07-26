import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Enable CORS so the React frontend can talk to this server
app.use(cors());

// Parse incoming JSON requests (req.body)
app.use(express.json());

// --- Routes ---
app.use("/api/documents", documentRoutes);
app.use("/api/documents", uploadRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/users", userRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "reDoc API is running" });
});

// --- Global error handler ---
// Catches any errors that weren't handled in the routes above
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start server ---
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
