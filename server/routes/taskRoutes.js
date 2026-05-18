import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskAnalytics,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getTasks).post(protect, createTask);
router.route('/analytics').get(protect, getTaskAnalytics);
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);
router.route('/:id/status').patch(protect, updateTaskStatus);

export default router;