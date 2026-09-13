const express = require("express");

const {
  createNote,
  getNotes,
  getTrashNotes,
  getNoteById,
  updateNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
} = require("../controllers/noteController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createNote);
router.get("/", authMiddleware, getNotes);
router.get("/trash", authMiddleware, getTrashNotes);
router.delete("/:id/permanent", authMiddleware, permanentlyDeleteNote);
router.put("/:id/restore", authMiddleware, restoreNote);
router.get("/:id", authMiddleware, getNoteById);
router.put("/:id", authMiddleware, updateNote);
router.delete("/:id", authMiddleware, deleteNote);

module.exports = router;
