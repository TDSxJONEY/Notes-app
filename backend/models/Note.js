import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, trim: true, default: "Untitled", maxlength: 200 },
    content: { type: String, default: "" },
    pinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "notes",
  }
);

export default mongoose.model("Note", noteSchema);