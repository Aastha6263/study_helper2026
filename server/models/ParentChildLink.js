import mongoose from 'mongoose';

const parentChildLinkSchema = new mongoose.Schema(
  {
    parent: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    child: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'rejected', 'revoked'],
      default: 'pending',
    },
    // Child must accept the link request
    requestedAt: { type: Date, default: Date.now },
    acceptedAt:  { type: Date, default: null },
    revokedAt:   { type: Date, default: null },
    // What data parent is allowed to see
    permissions: {
      viewStudySessions:  { type: Boolean, default: true },
      viewTasks:          { type: Boolean, default: true },
      viewNotes:          { type: Boolean, default: false }, // private by default
      viewAssignments:    { type: Boolean, default: true },
      viewAnalytics:      { type: Boolean, default: true },
      viewPomodoro:       { type: Boolean, default: true },
    },
    // Parent-set alert thresholds
    alerts: {
      inactivityDays:     { type: Number, default: 2 },
      minDailyStudyMins:  { type: Number, default: 30 },
      overdueTaskLimit:   { type: Number, default: 3 },
      gradeDropThreshold: { type: Number, default: 10 }, // % drop
    },
    linkCode:   { type: String, default: null }, // used for invite-based linking
    linkedBy:   { type: String, enum: ['parent', 'child', 'teacher'], default: 'parent' },
    notes:      { type: String, default: '' },   // parent's private notes about child
  },
  { timestamps: true }
);

// One parent ↔ one child link only
parentChildLinkSchema.index({ parent: 1, child: 1 }, { unique: true });

const ParentChildLink = mongoose.model('ParentChildLink', parentChildLinkSchema);
export default ParentChildLink;