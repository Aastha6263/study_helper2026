import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    submittedAt: { type: Date, default: Date.now },
    content:     { type: String, default: '' },
    attachments: [
      {
        fileName: String,
        fileUrl:  String,
        fileType: String,
      },
    ],
    status: {
      type:    String,
      enum:    ['submitted', 'late', 'graded', 'returned'],
      default: 'submitted',
    },
    grade:    { type: Number, default: null, min: 0, max: 100 },
    feedback: { type: String, default: '' },
    gradedAt: { type: Date, default: null },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    room: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Room',
      required: true,
      index:    true,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    title: {
      type:      String,
      required:  [true, 'Assignment title is required'],
      trim:      true,
      maxlength: [200, 'Title too long'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Description too long'],
      default:   '',
    },
    subject:  { type: String, trim: true, default: '' },
    type: {
      type:    String,
      enum:    ['homework', 'quiz', 'project', 'exam', 'practice'],
      default: 'homework',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate:     { type: Date, required: [true, 'Due date is required'] },
    availableFrom:{ type: Date, default: Date.now },
    maxScore:    { type: Number, default: 100 },
    passingScore:{ type: Number, default: 40 },
    // Specific students or all (empty = all students in room)
    assignedTo: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
    submissions:  [submissionSchema],
    attachments: [
      {
        fileName: String,
        fileUrl:  String,
        fileType: String,
      },
    ],
    instructions: { type: String, default: '' },
    tags:         [{ type: String, trim: true }],
    isPublished:  { type: Boolean, default: true },
    allowLate:    { type: Boolean, default: true },
    xpReward:     { type: Number, default: 20 },
    // Auto-computed stats
    stats: {
      totalAssigned:  { type: Number, default: 0 },
      totalSubmitted: { type: Number, default: 0 },
      totalGraded:    { type: Number, default: 0 },
      avgGrade:       { type: Number, default: 0 },
      passCount:      { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ room: 1, dueDate: -1 });
assignmentSchema.index({ room: 1, isPublished: 1 });
assignmentSchema.index({ 'submissions.student': 1 });

// Auto-flag late submissions
assignmentSchema.methods.isSubmissionLate = function (submittedAt) {
  return submittedAt > this.dueDate;
};

// Recompute stats
assignmentSchema.methods.recomputeStats = function () {
  const subs = this.submissions;
  this.stats.totalSubmitted = subs.length;
  this.stats.totalGraded    = subs.filter((s) => s.status === 'graded').length;

  const graded = subs.filter((s) => s.grade !== null);
  this.stats.avgGrade =
    graded.length > 0
      ? Math.round(graded.reduce((a, b) => a + b.grade, 0) / graded.length)
      : 0;

  this.stats.passCount = graded.filter(
    (s) => s.grade >= this.passingScore
  ).length;
};

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;