import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Document from "./models/Document.js";
import Share from "./models/Share.js";

dotenv.config();

// Seed script — inserts mock users, sample documents, and shares
// Run with: node seed.js

const mockUsers = [
  { name: "Alice Johnson", email: "alice@example.com" },
  { name: "Bob Smith", email: "bob@example.com" },
  { name: "Charlie Brown", email: "charlie@example.com" },
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/redoc";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for seeding...");

    // --- Clear existing data ---
    await User.deleteMany({});
    await Document.deleteMany({});
    await Share.deleteMany({});
    console.log("Cleared existing data");

    // --- Insert mock users ---
    const users = await User.insertMany(mockUsers);
    const [alice, bob, charlie] = users;
    console.log("Seeded users:");
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) [${user._id}]`);
    });

    // --- Insert sample documents ---
    const docs = await Document.insertMany([
      {
        title: "Meeting Notes",
        content:
          "<h1>Weekly Team Sync</h1><p>Discussed project timeline and milestones.</p><ul><li>Frontend UI due Friday</li><li>Backend API review on Wednesday</li><li>Deploy to staging by end of sprint</li></ul>",
        owner: alice._id,
      },
      {
        title: "Project Requirements",
        content:
          "<h1>reDoc Requirements</h1><p>A collaborative document editor built with the MERN stack.</p><h2>Core Features</h2><ol><li>Rich text editing with TipTap</li><li>Real-time collaboration (planned)</li><li>Document sharing with access control</li><li>File upload support (.txt, .md)</li></ol>",
        owner: alice._id,
      },
      {
        title: "Quick Notes",
        content:
          "<p>Remember to review the pull request before EOD.</p><p>Follow up with the design team about the new mockups.</p>",
        owner: bob._id,
      },
      {
        title: "API Documentation Draft",
        content:
          "<h1>API Endpoints</h1><p>Base URL: <code>http://localhost:5000</code></p><h2>Documents</h2><ul><li><code>POST /api/documents</code> — Create document</li><li><code>GET /api/documents/mine</code> — List my docs</li><li><code>GET /api/documents/shared</code> — List shared docs</li></ul>",
        owner: bob._id,
      },
    ]);
    const [meetingNotes, requirements, quickNotes, apiDocs] = docs;
    console.log(`\nSeeded ${docs.length} documents`);

    // --- Create shares ---
    // Alice shares "Meeting Notes" with Bob (editor) and Charlie (viewer)
    // Bob shares "Quick Notes" with Alice (viewer)
    const shares = await Share.insertMany([
      {
        document: meetingNotes._id,
        sharedWith: bob._id,
        access: "editor",
      },
      {
        document: meetingNotes._id,
        sharedWith: charlie._id,
        access: "viewer",
      },
      {
        document: quickNotes._id,
        sharedWith: alice._id,
        access: "viewer",
      },
    ]);
    console.log(`Seeded ${shares.length} shares`);

    console.log("\n--- Summary ---");
    console.log("Alice owns: Meeting Notes, Project Requirements");
    console.log("Alice has viewer access to: Quick Notes");
    console.log("Bob owns: Quick Notes, API Documentation Draft");
    console.log("Bob has editor access to: Meeting Notes");
    console.log("Charlie has viewer access to: Meeting Notes");
    console.log("\nSeeding complete!");
  } catch (error) {
    console.error("Seeding error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

seedDB();
