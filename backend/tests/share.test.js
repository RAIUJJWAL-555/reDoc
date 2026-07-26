/**
 * Share access test suite
 *
 * This test verifies the document sharing system works end-to-end:
 * - Owner shares a document with a recipient
 * - Recipient can access the document
 * - Unauthorized users cannot access the document
 *
 * We use mongodb-memory-server so tests run against an in-memory database
 * — no real data is touched, and no external MongoDB is needed.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import documentRoutes from "../routes/documentRoutes.js";

// Increase the timeout for the entire test suite — MongoMemoryServer
// needs time to download (first run) and start the in-memory MongoDB binary
jest.setTimeout(30000);

// --- Test setup ---
// Create a lightweight Express app for testing (no .listen needed)
// This lets supertest send requests without starting a real server.
const app = express();
app.use(express.json());
app.use("/api/documents", documentRoutes);

let mongoServer;

// beforeAll: start an in-memory MongoDB instance before any tests run
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    // Give the server extra time to start up
    serverOptions: { bind_ip: "127.0.0.1" },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// afterAll: close the connection and stop the in-memory server
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// afterEach: clear all collections between tests so they don't interfere
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("Document Sharing & Access Control", () => {
  it("should let the recipient access a shared document, and block unauthorized users", async () => {
    // --- Step 1: Create test users directly in the database ---
    // We import the models here after mongoose.connect() is done
    const User = mongoose.model("User");
    const Document = mongoose.model("Document");

    const owner = await User.create({
      name: "Test Owner",
      email: "owner@test.com",
    });

    const recipient = await User.create({
      name: "Test Recipient",
      email: "recipient@test.com",
    });

    const randomUser = await User.create({
      name: "Random User",
      email: "random@test.com",
    });

    // --- Step 2: Create a document owned by the owner ---
    const doc = await Document.create({
      title: "Shared Document",
      content: "<p>Hello world</p>",
      owner: owner._id,
    });

    // --- Step 3: Share the document with the recipient as "viewer" ---
    const shareRes = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .send({
        ownerId: owner._id.toString(),
        sharedWithEmail: "recipient@test.com",
        access: "viewer",
      });

    // Verify the share was created successfully
    expect(shareRes.status).toBe(201);
    expect(shareRes.body.message).toBe("Document shared");

    // --- Step 4: Recipient should be able to GET the document (200) ---
    const recipientGetRes = await request(app)
      .get(`/api/documents/${doc._id}`)
      .query({ userId: recipient._id.toString() });

    expect(recipientGetRes.status).toBe(200);
    expect(recipientGetRes.body.title).toBe("Shared Document");
    expect(recipientGetRes.body.userRole).toBe("viewer");

    // --- Step 5: Owner should also be able to GET the document ---
    const ownerGetRes = await request(app)
      .get(`/api/documents/${doc._id}`)
      .query({ userId: owner._id.toString() });

    expect(ownerGetRes.status).toBe(200);
    expect(ownerGetRes.body.userRole).toBe("owner");

    // --- Step 6: A random user with no share should get 403 ---
    const unauthorizedRes = await request(app)
      .get(`/api/documents/${doc._id}`)
      .query({ userId: randomUser._id.toString() });

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.error).toBe("Access denied");

    // --- Step 7: Sharing with yourself should fail ---
    const selfShareRes = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .send({
        ownerId: owner._id.toString(),
        sharedWithEmail: "owner@test.com",
        access: "editor",
      });

    expect(selfShareRes.status).toBe(400);
    expect(selfShareRes.body.error).toContain("Cannot share a document with yourself");

    // --- Step 8: Sharing with a non-existent email should fail ---
    const noUserRes = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .send({
        ownerId: owner._id.toString(),
        sharedWithEmail: "nobody@test.com",
        access: "viewer",
      });

    expect(noUserRes.status).toBe(404);
    expect(noUserRes.body.error).toContain("No user found with that email");

    // --- Step 9: Non-owner cannot share the document ---
    const unauthorizedShareRes = await request(app)
      .post(`/api/documents/${doc._id}/share`)
      .send({
        ownerId: recipient._id.toString(),
        sharedWithEmail: "random@test.com",
        access: "viewer",
      });

    expect(unauthorizedShareRes.status).toBe(403);
    expect(unauthorizedShareRes.body.error).toContain("Only the owner can share");

    // --- Step 10: Removing access should block the recipient ---
    // First, get the share ID to delete
    const sharesRes = await request(app)
      .get(`/api/documents/${doc._id}/shares`)
      .query({ ownerId: owner._id.toString() });

    const shareId = sharesRes.body[0].sharedWith._id;

    const removeRes = await request(app)
      .delete(`/api/documents/${doc._id}/share/${shareId}`)
      .send({ ownerId: owner._id.toString() });

    expect(removeRes.status).toBe(200);

    // After removal, recipient should get 403
    const afterRemoveRes = await request(app)
      .get(`/api/documents/${doc._id}`)
      .query({ userId: recipient._id.toString() });

    expect(afterRemoveRes.status).toBe(403);
  });
});
