import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addSubTask,
  toggleSubTask,
  deleteSubTask,
  getTaskAnalytics,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Task CRUD
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

// Task status and subtasks
router.put('/:id/status', updateTaskStatus);
router.post('/:id/subtasks', addSubTask);
router.put('/:id/subtasks/:subtaskId', toggleSubTask);
router.delete('/:id/subtasks/:subtaskId', deleteSubTask);

// Analytics
router.get('/:id/analytics', getTaskAnalytics);

export default router;