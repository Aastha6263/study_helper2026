import asyncHandler from 'express-async-handler';
import Note from '../models/Note.js';
import Subject from '../models/Subject.js';

// Get Notes
export const getNotes = asyncHandler(async (req, res) => {
  const query = { user: req.user._id };

  if (req.query.subject) query.subject = req.query.subject;

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { content: { $regex: req.query.search, $options: 'i' } },
      { tags: { $regex: req.query.search, $options: 'i' } },
    ];
  }
    const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 });

  res.json(notes);
});

// Create Note
export const createNote = asyncHandler(async (req, res) => {
  const note = await Note.create({
    ...req.body,
    user: req.user._id,
  });

  res.status(201).json(note);
});

// Update Note
export const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    res.status(404);
      throw new Error('Note not found');
  }

  Object.assign(note, req.body);
  const updated = await note.save();

  res.json(updated);
});

// Delete Note
export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    res.status(404);
    throw new Error('Note not found');
  }

  await note.deleteOne();

  res.json({ message: 'Note deleted' });
});
// Toggle Pin
export const togglePin = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  note.pinned = !note.pinned;
  await note.save();

  res.json(note);
});

// Toggle Favorite
export const toggleFavorite = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  note.favorite = !note.favorite;
  await note.save();

  res.json(note);
});

// Get Subjects
export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id });
  res.json(subjects);
});

// Add Subject
export const addSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create({
    user: req.user._id,
    name: req.body.name,
  });

  res.status(201).json(subject);
});