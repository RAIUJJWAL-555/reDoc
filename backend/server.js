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
// Enable CORS — if FRONTEND_URL is set, only allow that origin;
// otherwise allow all origins (useful during local development)
// Strip trailing slashes from FRONTEND_URL so "https://example.com/" and
// "https://example.com" both match correctly.
const allowedOrigin = process.env.FRONTEND_URL?.replace(/\/+$/, "");
const corsOptions = allowedOrigin
  ? {
      origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, mobile apps)
        if (!origin || origin.replace(/\/+$/, "") === allowedOrigin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }
  : {};
app.use(cors(corsOptions));

// Parse incoming JSON requests (req.body)
app.use(express.json());

// --- Routes ---
app.use("/api/documents", documentRoutes);
app.use("/api/documents", uploadRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/users", userRoutes);

// Health check — used by deployment platforms (Render, etc.) to verify the app is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Legacy root endpoint
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
// Only listen when NOT in test mode (jest sets NODE_ENV=test)
// This lets supertest use the app without needing a running server
if (process.env.NODE_ENV !== "test") {
  const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  start();
}

// Export the app so supertest (and other tools) can use it
export default app;
