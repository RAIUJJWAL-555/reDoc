import User from "../models/User.js";

// GET /api/users — List all users (for the share dialog)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email").sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/users/:id — Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id, "name email");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
