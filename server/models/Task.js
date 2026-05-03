import mongoose from 'mongoose';

const subTaskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const taskSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional — if assigned by teacher via room
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description too long'],
      default: '',
    },
    subject:  { type: String, trim: true, default: '' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'todo',
    },
    dueDate:       { type: Date, default: null },
    completedAt:   { type: Date, default: null },
    estimatedMins: { type: Number, default: null },
    actualMins:    { type: Number, default: null },
    subTasks:      [subTaskSchema],
    tags:          [{ type: String, trim: true }],
    reminderAt:    { type: Date, default: null },
    isReminderSent:{ type: Boolean, default: false },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    xpReward: { type: Number, default: 10 },
    xpEarned: { type: Number, default: 0 },
    attachments: [
      {
        fileName: String,
        fileUrl:  String,
        fileType: String,
      },
    ],
  },
  { timestamps: true }
);

taskSchema.index({ student: 1, status: 1 });
taskSchema.index({ student: 1, dueDate: 1 });
taskSchema.index({ student: 1, priority: 1 });
taskSchema.index({ dueDate: 1, isReminderSent: 1 }); // for cron jobs

// Auto-set completedAt and xpEarned
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = new Date();
      this.xpEarned   = this.xpReward;
    } else {
      this.completedAt = null;
      this.xpEarned    = 0;
    }
  }
  next();
});

// Auto-compute subtask progress
taskSchema.virtual('subTaskProgress').get(function () {
  if (!this.subTasks.length) return 0;
  const done = this.subTasks.filter((s) => s.isCompleted).length;
  return Math.round((done / this.subTasks.length) * 100);
});

taskSchema.set('toJSON', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;