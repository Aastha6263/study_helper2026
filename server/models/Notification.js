import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    sender: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    type: {
      type:     String,
      required: true,
      enum: [
        // Task
        'task_assigned',
        'task_completed',
        'task_overdue',
        'task_upcoming',
        'task_xp_earned',
        // Assignment
        'assignment_created',
        'assignment_submitted',
        'assignment_graded',
        'assignment_returned',
        'assignment_due_soon',
        // Study
        'study_session_started',
        'study_session_completed',
        'study_streak',
        'study_milestone',
        // Room
        'room_joined',
        'room_announcement',
        'room_invite',
        // Parent
        'parent_link_request',
        'parent_link_accepted',
        'child_inactive',
        'child_overdue_tasks',
        'child_studying',
        'monthly_report',
        // System
        'xp_earned',
        'level_up',
        'welcome',
        'system',
      ],
    },
    title:   { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    // Deep link on client
    link:    { type: String, default: null },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    isRead:  { type: Boolean, default: false, index: true },
    readAt:  { type: Date,    default: null },
    // Channels this was delivered to
    channels: {
      inApp:   { type: Boolean, default: true },
      email:   { type: Boolean, default: false },
      push:    { type: Boolean, default: false },
    },
    // Delivery status per channel
    deliveryStatus: {
      inApp: {
        sent:   { type: Boolean, default: false },
        sentAt: { type: Date,    default: null },
      },
      email: {
        sent:   { type: Boolean, default: false },
        sentAt: { type: Date,    default: null },
      },
      push: {
        sent:   { type: Boolean, default: false },
        sentAt: { type: Date,    default: null },
      },
    },
    // Arbitrary extra data (taskId, roomId, assignmentId, etc.)
    meta:      { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, default: null },
    // Batch reference (e.g. weekly digest run id)
    batchId:   { type: String, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound indexes for common queries
notificationSchema.index({ recipient: 1, isRead: 1,    createdAt: -1 });
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1,      createdAt: -1 });
// TTL index: auto-delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Soft-delete helper
notificationSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return this.save({ validateBeforeSave: false });
};

// Mark read helper
notificationSchema.methods.markRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save({ validateBeforeSave: false });
  }
  return this;
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;