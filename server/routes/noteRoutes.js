import express from 'express';
import {
  createNote, getNotes, getNoteById, updateNote,
  deleteNote, shareNote, getSharedWithMe, togglePin,
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote);

router.get('/shared-with-me', getSharedWithMe);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

router.patch('/:id/pin',   togglePin);
router.post('/:id/share',  shareNote);

export default router;