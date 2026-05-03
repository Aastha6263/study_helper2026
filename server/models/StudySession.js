import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    sessionType: {
      type: String,
      enum: ['pomodoro', 'free', 'group'],
      default: 'free',
    },
    // Pomodoro specific
    pomodoroConfig: {
      workMinutes:  { type: Number, default: 25 },
      shortBreak:  { type: Number, default: 5 },
      longBreak:   { type: Number, default: 15 },
      cyclesBeforeLongBreak: { type: Number, default: 4 },
      completedCycles: { type: Number, default: 0 },
    },
    startTime:  { type: Date, required: true },
    endTime:    { type: Date, default: null },
    pausedAt:   { type: Date, default: null },
    totalPausedMs: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'abandoned'],
      default: 'active',
    },
    focusScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    tags: [{ type: String, trim: true }],
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for analytics queries
studySessionSchema.index({ student: 1, startTime: -1 });
studySessionSchema.index({ student: 1, status: 1 });
studySessionSchema.index({ student: 1, subject: 1 });

// Calculate duration and XP before saving completed session
studySessionSchema.pre('save', function (next) {
  if (this.status === 'completed' && this.endTime && this.startTime) {
    const rawMs = this.endTime - this.startTime - this.totalPausedMs;
    this.durationMinutes = Math.max(0, Math.round(rawMs / 60000));

    // XP formula: 1 XP per minute + bonus for pomodoro
    let xp = this.durationMinutes;
    if (this.sessionType === 'pomodoro') {
      xp += this.pomodoroConfig.completedCycles * 10;
    }
    this.xpEarned = xp;
  }
  next();
});

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;