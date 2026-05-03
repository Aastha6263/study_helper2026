import crypto from 'crypto';
import User from '../models/User.js';
import { generateTokenAndSetCookie } from '../utils/generateToken.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // ✅ FIX: findByIdAndUpdate — pre-save hook trigger nahi hoga
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    const token = generateTokenAndSetCookie(res, user._id);
    const freshUser = await User.findById(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: freshUser,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (!['student', 'teacher', 'parent'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // User.create → pre-save → password hash ✅
    const user = await User.create({ name, email, password, role, isEmailVerified: true });
    const token = generateTokenAndSetCookie(res, user._id);

    return res.status(201).json({ success: true, message: 'Account created successfully.', token, user });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  res.cookie('studysync_token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ success: true, message: 'Logged out.' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('children', 'name email role avatar')
      .populate('parentAccount', 'name email')
      .populate('managedRooms', 'name subject');
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token.' });
    }
    // ✅ FIX: findByIdAndUpdate
    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
    return res.status(200).json({ success: true, message: 'Email verified.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    // ✅ FIX: findByIdAndUpdate
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken:  crypto.createHash('sha256').update(resetToken).digest('hex'),
      resetPasswordExpire: new Date(Date.now() + 30 * 60 * 1000),
    });
    return res.status(200).json({
      success: true,
      message: 'Reset link sent.',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired link.' });
    }
    // ✅ user.save() intentional — password hash zaroori hai
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
    const token = generateTokenAndSetCookie(res, user._id);
    const freshUser = await User.findById(user._id);
    return res.status(200).json({ success: true, token, user: freshUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, notificationPrefs } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (notificationPrefs) updates.notificationPrefs = notificationPrefs;
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Wrong current password.' });
    }
    // ✅ user.save() intentional — password hash zaroori hai
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true, message: 'Password changed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};