import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  toggleFavorite,
  getSubjects,
  addSubject,
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(protect, getNotes).post(protect, createNote);
router.route('/subjects').get(protect, getSubjects).post(protect, addSubject);
router.route('/:id').put(protect, updateNote).delete(protect, deleteNote);
router.route('/:id/pin').patch(protect, togglePin);
router.route('/:id/favorite').patch(protect, toggleFavorite);

export default router;