import mongoose from 'mongoose';

const subjectSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
  );

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;