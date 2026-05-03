import mongoose from 'mongoose';

const pomodoroSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studySession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudySession',
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    subject: { type: String, trim: true, default: '' },
    config: {
      workMinutes:            { type: Number, default: 25 },
      shortBreakMinutes:      { type: Number, default: 5 },
      longBreakMinutes:       { type: Number, default: 15 },
      cyclesBeforeLongBreak:  { type: Number, default: 4 },
    },
    cycles: [
      {
        cycleNumber: { type: Number },
        phase: {
          type: String,
          enum: ['work', 'short_break', 'long_break'],
        },
        startTime:  { type: Date },
        endTime:    { type: Date },
        completed:  { type: Boolean, default: false },
        skipped:    { type: Boolean, default: false },
      },
    ],
    totalWorkMinutes:  { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    completedCycles:   { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    startTime: { type: Date, default: Date.now },
    endTime:   { type: Date, default: null },
    xpEarned:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

pomodoroSessionSchema.index({ student: 1, startTime: -1 });

const PomodoroSession = mongoose.model('PomodoroSession', pomodoroSessionSchema);
export default PomodoroSession;