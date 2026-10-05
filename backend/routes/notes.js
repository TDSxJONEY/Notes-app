import { Router } from "express";
import mongoose from "mongoose";
import Note from "../models/Note.js";
import auth from "../middleware/auth.js";

const router = Router();

// Every notes route requires a valid token
router.use(auth);

const validId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid note id" });
  }
  next();
};

// GET /api/notes — only the logged-in user's notes
router.get("/", async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.userId }).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// GET /api/notes/:id
router.get("/:id", validId, async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// POST /api/notes
router.post("/", async (req, res, next) => {
  try {
    const { title, content, pinned } = req.body;
    const note = await Note.create({ user: req.userId, title, content, pinned });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// PUT /api/notes/:id
router.put("/:id", validId, async (req, res, next) => {
  try {
    const update = {};
    ["title", "content", "pinned"].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      update,
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:id
router.delete("/:id", validId, async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted", id: note._id });
  } catch (err) {
    next(err);
  }
});

export default router;