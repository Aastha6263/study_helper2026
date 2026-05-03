import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    author: {
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
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    // Rich content blocks (for future editor support)
    blocks: [
      {
        type: {
          type: String,
          enum: ['text', 'heading', 'bullet', 'code', 'image', 'divider'],
          default: 'text',
        },
        content: { type: String, default: '' },
        meta:    { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    subject:  { type: String, trim: true, default: '' },
    tags:     [{ type: String, trim: true, lowercase: true }],
    color: {
      type: String,
      enum: ['default', 'yellow', 'blue', 'green', 'pink', 'purple', 'orange'],
      default: 'default',
    },
    isPinned:   { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isShared:   { type: Boolean, default: false },
    // Collaborators who can view this note
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    attachments: [
      {
        fileName:  { type: String },
        fileUrl:   { type: String },
        fileType:  { type: String },
        uploadedAt:{ type: Date, default: Date.now },
      },
    ],
    viewCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ author: 1, updatedAt: -1 });
noteSchema.index({ author: 1, isPinned: -1 });
noteSchema.index({ author: 1, subject: 1 });
noteSchema.index({ tags: 1 });

// Auto word count
noteSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.wordCount = this.content
      ? this.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
  }
  next();
});

const Note = mongoose.model('Note', noteSchema);
export default Note;