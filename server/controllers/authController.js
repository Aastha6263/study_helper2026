import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

/* ================= REGISTER USER ================= */
export const registerUser = async (req, res) => {
  try {
    console.log('REGISTER BODY:', req.body);

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'User already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        avatarUrl: user.avatarUrl || '',
        skills: user.skills || [],
        xp: user.xp || 0,
        streak: user.streak || 0,
        completedTasks: user.completedTasks || 0,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET CURRENT USER ================= */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, email, bio, github, linkedin, avatarUrl, skills } = req.body;
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : user.skills;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        github: user.github,
        linkedin: user.linkedin,
        avatarUrl: user.avatarUrl,
        skills: user.skills,
        xp: user.xp,
        streak: user.streak,
        completedTasks: user.completedTasks,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= LOGIN USER ================= */
export const loginUser = async (req, res) => {
  try {
    console.log('LOGIN BODY:', req.body);

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    /* User not found */
    if (!user) {
      return res.status(401).json({
        success: false,
        field: 'email',
        message: 'Invalid email or password',
      });
    }

    /* Account inactive */
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled',
      });
    }

    /* Account lock check */
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message:
          'Account temporarily locked due to multiple failed login attempts',
      });
    }

    /* Password match */
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil =
          Date.now() + 15 * 60 * 1000; // 15 min lock
      }

      await user.save();

      return res.status(401).json({
        success: false,
        field: 'password',
        message: 'Invalid email or password',
      });
    }

    /* Successful login reset */
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= LOGOUT USER ================= */
export const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};