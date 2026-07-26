import mongoose from "mongoose";

// User model — simple mock-user system for demo purposes
// No password or auth; just name and email to identify who is using the app
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
