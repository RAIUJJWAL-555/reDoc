import { Router } from "express";
import { getUsers, getUserById } from "../controllers/userController.js";

const router = Router();

// GET /api/users — List all users
router.get("/", getUsers);

// GET /api/users/:id — Get a single user
router.get("/:id", getUserById);

export default router;
