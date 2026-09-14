const Note = require("../models/note");

const emitNoteUpdate = (req, note) => {
  const io = req.app.get("io");

  if (!io || !note) {
    return;
  }

  io.to(`user:${req.user.userId}`).emit(
    "note:updated",
    note,
  );
};

const emitNoteDeleted = (req, noteId) => {
  const io = req.app.get("io");

  if (!io || !noteId) {
    return;
  }

  io.to(`user:${req.user.userId}`).emit(
    "note:updated",
    {
      _id: noteId,
      isTrashed: true,
      permanentlyDeleted: true,
    },
  );
};

// @desc    Get all notes for logged-in user
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      owner: req.user.userId,
      isTrashed: false,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Failed to fetch notes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
    });
  }
};

// @desc    Get trashed notes
// @route   GET /api/notes/trash
// @access  Private
const getTrashNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      owner: req.user.userId,
      isTrashed: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Failed to fetch trash notes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch trash notes",
    });
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Failed to fetch note:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch note",
    });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      canvasData,
    } = req.body;

    const note = await Note.create({
      owner: req.user.userId,
      title: title || "",
      content: content || "",
      type: type || "text",
      canvasData: canvasData || null,
    });

    emitNoteUpdate(req, note);

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Failed to create note:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create note",
    });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      canvasData,
      isStarred,
    } = req.body;

    const updates = {};

    if (title !== undefined) {
      updates.title = title;
    }

    if (content !== undefined) {
      updates.content = content;
    }

    if (type !== undefined) {
      updates.type = type;
    }

    if (canvasData !== undefined) {
      updates.canvasData = canvasData;
    }

    if (isStarred !== undefined) {
      updates.isStarred = isStarred;
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    emitNoteUpdate(req, note);

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Failed to update note:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update note",
    });
  }
};

// @desc    Move note to trash
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
      },
      {
        $set: {
          isTrashed: true,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    emitNoteUpdate(req, note);

    res.status(200).json({
      success: true,
      message: "Note moved to trash",
      note,
    });
  } catch (error) {
    console.error("Failed to move note to trash:", error);

    res.status(500).json({
      success: false,
      message: "Failed to move note to trash",
    });
  }
};

// @desc    Restore note from trash
// @route   PUT /api/notes/:id/restore
// @access  Private
const restoreNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.userId,
        isTrashed: true,
      },
      {
        $set: {
          isTrashed: false,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Trashed note not found",
      });
    }

    emitNoteUpdate(req, note);

    res.status(200).json({
      success: true,
      message: "Note restored successfully",
      note,
    });
  } catch (error) {
    console.error("Failed to restore note:", error);

    res.status(500).json({
      success: false,
      message: "Failed to restore note",
    });
  }
};

// @desc    Permanently delete note
// @route   DELETE /api/notes/:id/permanent
// @access  Private
const permanentlyDeleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
      isTrashed: true,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Trashed note not found",
      });
    }

    emitNoteDeleted(req, note._id);

    res.status(200).json({
      success: true,
      message: "Note permanently deleted",
    });
  } catch (error) {
    console.error(
      "Failed to permanently delete note:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to permanently delete note",
    });
  }
};

module.exports = {
  getNotes,
  getTrashNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
};