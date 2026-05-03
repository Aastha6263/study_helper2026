import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    isPinned:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Class name is required'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    subject: {
      type:     String,
      required: [true, 'Subject is required'],
      trim:     true,
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description too long'],
      default:   '',
    },
    teacher: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    // Co-teachers who can manage the room
    coTeachers: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
    students: [
      {
        student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
    ],
    // Unique 6-char invite code
    inviteCode: {
      type:    String,
      unique:  true,
      index:   true,
    },
    // Allow students to join via invite code
    isInviteEnabled: { type: Boolean, default: true },
    coverColor: {
      type:    String,
      enum:    ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'red'],
      default: 'blue',
    },
    isArchived: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    maxStudents:{ type: Number, default: 100 },
    schedule: [
      {
        day:       { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
        startTime: { type: String },
        endTime:   { type: String },
      },
    ],
    announcements: [announcementSchema],
    // Quick stats (denormalized for performance)
    stats: {
      totalTasks:      { type: Number, default: 0 },
      totalStudents:   { type: Number, default: 0 },
      avgCompletionRate:{ type: Number, default: 0 },
    },
    resources: [
      {
        title:      { type: String, trim: true },
        url:        { type: String },
        fileType:   { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate invite code before first save
roomSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  }
  next();
});

// Virtual: active student count
roomSchema.virtual('studentCount').get(function () {
  return this.students.filter((s) => s.isActive).length;
});

roomSchema.set('toJSON',   { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

roomSchema.index({ teacher: 1, isArchived: 1 });
roomSchema.index({ 'students.student': 1 });

const Room = mongoose.model('Room', roomSchema);
export default Room;