import Task from '../models/Task.js';

// ─── Create Task ──────────────────────────────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    const {
      title, description, subject, priority,
      dueDate, estimatedMins, subTasks, tags,
      reminderAt, recurrence, roomId, xpReward,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const task = await Task.create({
      student:      req.user._id,
      title,
      description:  description  || '',
      subject:      subject      || '',
      priority:     priority     || 'medium',
      dueDate:      dueDate      || null,
      estimatedMins:estimatedMins|| null,
      subTasks:     subTasks     || [],
      tags:         tags         || [],
      reminderAt:   reminderAt   || null,
      recurrence:   recurrence   || 'none',
      room:         roomId       || null,
      xpReward:     xpReward     || 10,
    });

    res.status(201).json({ success: true, message: 'Task created.', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Tasks ────────────────────────────────────────────────────────────────
export const getTasks = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 20,
      status,
      priority,
      subject,
      search,
      sortBy   = 'dueDate',
      sortOrder= 'asc',
      dueBefore,
      dueAfter,
    } = req.query;

    const filter = { student: req.user._id };

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (subject)  filter.subject  = new RegExp(subject, 'i');
    if (search)   filter.title    = new RegExp(search, 'i');

    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter)  filter.dueDate.$gte = new Date(dueAfter);
    }

    const sortDir = sortOrder === 'desc' ? -1 : 1;
    const total   = await Task.countDocuments(filter);
    const tasks   = await Task.find(filter)
      .sort({ [sortBy]: sortDir, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('assignedBy', 'name avatar role');

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Task By ID ───────────────────────────────────────────────────────────
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id:     req.params.id,
      student: req.user._id,
    }).populate('assignedBy', 'name avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Task ──────────────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const allowed = [
      'title', 'description', 'subject', 'priority', 'status',
      'dueDate', 'estimatedMins', 'actualMins', 'tags',
      'reminderAt', 'recurrence', 'xpReward',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();

    res.status(200).json({ success: true, message: 'Task updated.', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Task ──────────────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id:     req.params.id,
      student: req.user._id,
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Task Status ───────────────────────────────────────────────────────
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const task = await Task.findOne({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.status = status;
    await task.save();

    res.status(200).json({
      success: true,
      message: `Task marked as ${status}. ${task.xpEarned > 0 ? `+${task.xpEarned} XP earned!` : ''}`,
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Manage Subtasks ──────────────────────────────────────────────────────────
export const addSubTask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Subtask title required.' });

    const task = await Task.findOne({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.subTasks.push({ title });
    await task.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Subtask added.', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSubTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const sub = task.subTasks.id(req.params.subTaskId);
    if (!sub) return res.status(404).json({ success: false, message: 'Subtask not found.' });

    sub.isCompleted = !sub.isCompleted;
    sub.completedAt = sub.isCompleted ? new Date() : null;
    await task.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: sub.isCompleted ? 'Subtask completed.' : 'Subtask reopened.',
      task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    task.subTasks = task.subTasks.filter(
      (s) => s._id.toString() !== req.params.subTaskId
    );
    await task.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Subtask deleted.', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Task Analytics ───────────────────────────────────────────────────────
export const getTaskAnalytics = async (req, res) => {
  try {
    const [statusCounts, priorityCounts, overdueTasks, totalXP] =
      await Promise.all([
        Task.aggregate([
          { $match: { student: req.user._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Task.aggregate([
          { $match: { student: req.user._id, status: { $ne: 'cancelled' } } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        Task.countDocuments({
          student: req.user._id,
          status:  { $nin: ['completed', 'cancelled'] },
          dueDate: { $lt: new Date() },
        }),
        Task.aggregate([
          { $match: { student: req.user._id, status: 'completed' } },
          { $group: { _id: null, totalXP: { $sum: '$xpEarned' } } },
        ]),
      ]);

    // Auto-mark overdue tasks
    await Task.updateMany(
      {
        student: req.user._id,
        status:  { $nin: ['completed', 'cancelled', 'overdue'] },
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    );

    res.status(200).json({
      success: true,
      analytics: {
        byStatus:   statusCounts,
        byPriority: priorityCounts,
        overdue:    overdueTasks,
        totalXP:    totalXP[0]?.totalXP || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};