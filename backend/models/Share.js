import mongoose from "mongoose";

// Share model — controls who can access a document and what they can do
// "viewer" can only read, "editor" can also modify content
const shareSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: [true, "Document is required"],
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shared with user is required"],
    },
    access: {
      type: String,
      enum: ["viewer", "editor"],
      default: "viewer",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate shares — a user can only have one share entry per document
shareSchema.index({ document: 1, sharedWith: 1 }, { unique: true });

const Share = mongoose.model("Share", shareSchema);

export default Share;
