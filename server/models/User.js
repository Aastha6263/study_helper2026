import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    bio: {
      type: String,
      trim: true,
      default: '',
    },

    github: {
      type: String,
      trim: true,
      default: '',
    },

    linkedin: {
      type: String,
      trim: true,
      default: '',
    },

    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },

    skills: {
      type: [String],
      default: [],
    },

    xp: {
      type: Number,
      default: 0,
    },

    streak: {
      type: Number,
      default: 0,
    },

    completedTasks: {
      type: Number,
      default: 0,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['student', 'teacher', 'parent'],
      required: true,
    },

    /* ================= ACCOUNT STATUS ================= */
    isActive: {
      type: Boolean,
      default: true,
    },

    /* ================= LOGIN SECURITY ================= */
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    /* ================= SESSION ================= */
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= ACCOUNT LOCK CHECK ================= */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

export default mongoose.model('User', userSchema);