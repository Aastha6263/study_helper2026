import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:   String,
      select: false,
    },
    role: {
      type:    String,
      enum:    ['student', 'teacher', 'parent'],
      default: 'student',
    },
    avatar:        { type: String, default: '' },
    children:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    managedRooms:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    isEmailVerified:       { type: Boolean, default: true },
    emailVerificationToken:{ type: String,  default: null },
    resetPasswordToken:    { type: String,  default: null },
    resetPasswordExpire:   { type: Date,    default: null },
    firebaseUid:           { type: String,  default: null },
    fcmToken:              { type: String,  default: null },
    isActive:              { type: Boolean, default: true },
    lastSeen:              { type: Date,    default: Date.now },
    notificationPrefs: {
      email: { type: Boolean, default: true  },
      inApp: { type: Boolean, default: true  },
      push:  { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Password hash — ONLY when password is modified
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt    = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.fcmToken;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;