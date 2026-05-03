import Note from '../models/Note.js';

// ─── Create Note ──────────────────────────────────────────────────────────────
export const createNote = async (req, res) => {
  try {
    const { title, content, blocks, subject, tags, color, roomId, isShared } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const note = await Note.create({
      author:   req.user._id,
      title,
      content:  content  || '',
      blocks:   blocks   || [],
      subject:  subject  || '',
      tags:     tags     || [],
      color:    color    || 'default',
      room:     roomId   || null,
      isShared: isShared || false,
    });

    res.status(201).json({ success: true, message: 'Note created.', note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get All Notes ────────────────────────────────────────────────────────────
export const getNotes = async (req, res) => {
  try {
    const {
      page  = 1,
      limit = 20,
      subject,
      tag,
      color,
      search,
      isPinned,
      isArchived = false,
    } = req.query;

    const filter = {
      author:     req.user._id,
      isArchived: isArchived === 'true',
    };

    if (subject)          filter.subject  = new RegExp(subject, 'i');
    if (tag)              filter.tags     = tag.toLowerCase();
    if (color)            filter.color    = color;
    if (isPinned)         filter.isPinned = isPinned === 'true';
    if (search) {
      filter.$or = [
        { title:   new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { tags:    new RegExp(search, 'i') },
      ];
    }

    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-blocks'); // blocks returned only on single note fetch

    res.status(200).json({
      success: true,
      notes,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Single Note ──────────────────────────────────────────────────────────
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id:    req.params.id,
      $or: [
        { author:     req.user._id },
        { sharedWith: req.user._id },
      ],
    }).populate('author', 'name avatar').populate('sharedWith', 'name avatar');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Increment view count if viewer is not the author
    if (note.author._id.toString() !== req.user._id.toString()) {
      note.viewCount += 1;
      await note.save({ validateBeforeSave: false });
    }

    res.status(200).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Note ──────────────────────────────────────────────────────────────
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id:    req.params.id,
      author: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const allowed = ['title', 'content', 'blocks', 'subject', 'tags',
                     'color', 'isPinned', 'isArchived', 'isShared'];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    await note.save();

    res.status(200).json({ success: true, message: 'Note updated.', note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Note ──────────────────────────────────────────────────────────────
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id:    req.params.id,
      author: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    res.status(200).json({ success: true, message: 'Note deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Share Note With Users ────────────────────────────────────────────────────
export const shareNote = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide userIds array.' });
    }

    const note = await Note.findOne({ _id: req.params.id, author: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Add unique users only
    const existing = note.sharedWith.map((id) => id.toString());
    const toAdd    = userIds.filter((id) => !existing.includes(id));

    note.sharedWith.push(...toAdd);
    note.isShared = true;
    await note.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Note shared.', note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Shared Notes (notes others shared with me) ───────────────────────────
export const getSharedWithMe = async (req, res) => {
  try {
    const notes = await Note.find({ sharedWith: req.user._id })
      .populate('author', 'name avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Toggle Pin ───────────────────────────────────────────────────────────────
export const togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, author: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    note.isPinned = !note.isPinned;
    await note.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: note.isPinned ? 'Note pinned.' : 'Note unpinned.',
      note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};