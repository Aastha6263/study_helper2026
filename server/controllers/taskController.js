import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';

// @desc Get all tasks
export const getTasks = asyncHandler(async (req, res) => {
  const query = { user: req.user._id };

  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.subject) query.subject = req.query.subject;
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }

  const tasks = await Task.find(query).sort({ createdAt: -1 });
  res.json(tasks);
});
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, subject, priority, status, dueDate } = req.body;

  if (!title || !subject) {
    res.status(400);
    throw new Error('Title and subject are required');
  }

  const task = await Task.create({
    user: req.user._id,
    title,
    description,
    subject,
    priority,
    status,
    dueDate,
  });

  res.status(201).json(task);
});
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  Object.assign(task, req.body);
  const updatedTask = await task.save();

  res.json(updatedTask);
});
// @desc Delete task
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.deleteOne();
  res.json({ message: 'Task removed' });
});
// @desc Update task status
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.status = req.body.status;
  const updatedTask = await task.save();

  res.json(updatedTask);
});
// @desc Get analytics
export const getTaskAnalytics = asyncHandler(async (req, res) => {
  const total = await Task.countDocuments({ user: req.user._id });
  const completed = await Task.countDocuments({
    user: req.user._id,
    status: 'completed',
  });
  const pending = total - completed;

  res.json({ total, completed, pending });
});