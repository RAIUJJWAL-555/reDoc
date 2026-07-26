import mongoose from "mongoose";

// Document model — stores rich text content as HTML
// Each document has an owner who has full control over it
const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      default: "Untitled Document",
      trim: true,
    },
    content: {
      type: String,
      default: "", // Rich text stored as HTML
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
