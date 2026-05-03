import Room       from '../models/Room.js';
import User       from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Task       from '../models/Task.js';

// ─── Create Room ──────────────────────────────────────────────────────────────
export const createRoom = async (req, res) => {
  try {
    const {
      name, subject, description,
      coverColor, maxStudents, schedule,
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Class name and subject are required.',
      });
    }

    const room = await Room.create({
      name,
      subject,
      description:  description  || '',
      teacher:      req.user._id,
      coverColor:   coverColor   || 'blue',
      maxStudents:  maxStudents  || 100,
      schedule:     schedule     || [],
    });

    // Add to teacher's managedRooms
    await User.findByIdAndUpdate(req.user._id, {
      $push: { managedRooms: room._id },
    });

    await room.populate('teacher', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      room,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Teacher's Rooms ──────────────────────────────────────────────────────
export const getMyRooms = async (req, res) => {
  try {
    const { isArchived = false } = req.query;

    const rooms = await Room.find({
      $or: [
        { teacher:    req.user._id },
        { coTeachers: req.user._id },
      ],
      isArchived: isArchived === 'true',
    })
      .populate('teacher',    'name avatar')
      .populate('coTeachers', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Room By ID ───────────────────────────────────────────────────────────
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('teacher',             'name email avatar role')
      .populate('coTeachers',          'name email avatar')
      .populate('students.student',    'name email avatar role lastSeen')
      .populate('announcements.author','name avatar');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Check access: teacher, co-teacher, or enrolled student
    const isTeacher =
      room.teacher._id.toString()  === req.user._id.toString() ||
      room.coTeachers.some((t) => t._id.toString() === req.user._id.toString());

    const isStudent = room.students.some(
      (s) => s.student._id.toString() === req.user._id.toString() && s.isActive
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class.',
      });
    }

    res.status(200).json({ success: true, room, isTeacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Room ──────────────────────────────────────────────────────────────
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const allowed = [
      'name','subject','description','coverColor',
      'maxStudents','schedule','isInviteEnabled','isArchived',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) room[field] = req.body[field];
    });

    await room.save();

    res.status(200).json({ success: true, message: 'Class updated.', room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Room ──────────────────────────────────────────────────────────────
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id:     req.params.id,
      teacher: req.user._id,
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Remove from teacher's managed rooms
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { managedRooms: room._id },
    });

    // Remove room ref from all enrolled students (optional cleanup)
    const studentIds = room.students.map((s) => s.student);
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $pull: { enrolledRooms: room._id } }
    );

    await room.deleteOne();

    res.status(200).json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Regenerate Invite Code ───────────────────────────────────────────────────
export const regenerateInviteCode = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    room.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await room.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Invite code regenerated.',
      inviteCode: room.inviteCode,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Add Students Manually ────────────────────────────────────────────────────
export const addStudents = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of student emails.',
      });
    }

    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const currentCount = room.students.filter((s) => s.isActive).length;
    if (currentCount + emails.length > room.maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Adding ${emails.length} students would exceed the limit of ${room.maxStudents}.`,
      });
    }

    const users = await User.find({
      email: { $in: emails.map((e) => e.toLowerCase()) },
      role:  'student',
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No student accounts found for the provided emails.',
      });
    }

    const existingIds = room.students.map((s) => s.student.toString());
    const added       = [];
    const skipped     = [];

    for (const user of users) {
      if (existingIds.includes(user._id.toString())) {
        skipped.push(user.email);
        continue;
      }
      room.students.push({ student: user._id });
      added.push(user.email);
    }

    room.stats.totalStudents = room.students.filter((s) => s.isActive).length;
    await room.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `${added.length} student(s) added.`,
      added,
      skipped,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Remove Student ───────────────────────────────────────────────────────────
export const removeStudent = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const entry = room.students.find(
      (s) => s.student.toString() === req.params.studentId
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in this class.',
      });
    }

    // Soft remove
    entry.isActive = false;
    room.stats.totalStudents = room.students.filter((s) => s.isActive).length;
    await room.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Student removed from class.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Join Room via Invite Code (Student action) ───────────────────────────────
export const joinRoom = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required.' });
    }

    const room = await Room.findOne({
      inviteCode:       inviteCode.toUpperCase(),
      isInviteEnabled:  true,
      isArchived:       false,
      isActive:         true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invite code.',
      });
    }

    const alreadyEnrolled = room.students.find(
      (s) => s.student.toString() === req.user._id.toString()
    );

    if (alreadyEnrolled) {
      if (alreadyEnrolled.isActive) {
        return res.status(400).json({
          success: false,
          message: 'You are already enrolled in this class.',
        });
      }
      // Re-activate if previously removed
      alreadyEnrolled.isActive = true;
      alreadyEnrolled.joinedAt = new Date();
    } else {
      const activeCount = room.students.filter((s) => s.isActive).length;
      if (activeCount >= room.maxStudents) {
        return res.status(400).json({
          success: false,
          message: 'This class is full.',
        });
      }
      room.students.push({ student: req.user._id });
    }

    room.stats.totalStudents = room.students.filter((s) => s.isActive).length;
    await room.save({ validateBeforeSave: false });

    await room.populate('teacher', 'name avatar');

    res.status(200).json({
      success: true,
      message: `Joined "${room.name}" successfully!`,
      room,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Leave Room (Student action) ──────────────────────────────────────────────
export const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const entry = room.students.find(
      (s) => s.student.toString() === req.user._id.toString()
    );

    if (!entry || !entry.isActive) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this class.',
      });
    }

    entry.isActive = false;
    room.stats.totalStudents = room.students.filter((s) => s.isActive).length;
    await room.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Left class successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Post Announcement ────────────────────────────────────────────────────────
export const postAnnouncement = async (req, res) => {
  try {
    const { message, isPinned } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    room.announcements.unshift({
      author:   req.user._id,
      message,
      isPinned: isPinned || false,
    });

    // Keep latest 50 announcements
    if (room.announcements.length > 50) {
      room.announcements = room.announcements.slice(0, 50);
    }

    await room.save({ validateBeforeSave: false });
    await room.populate('announcements.author', 'name avatar');

    res.status(201).json({
      success:      true,
      message:      'Announcement posted.',
      announcement: room.announcements[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Announcement ──────────────────────────────────────────────────────
export const deleteAnnouncement = async (req, res) => {
  try {
    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    room.announcements = room.announcements.filter(
      (a) => a._id.toString() !== req.params.announcementId
    );

    await room.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Add Resource ─────────────────────────────────────────────────────────────
export const addResource = async (req, res) => {
  try {
    const { title, url, fileType } = req.body;

    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required.' });
    }

    const room = await Room.findOne({
      _id:     req.params.id,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    room.resources.push({
      title,
      url,
      fileType:   fileType || 'link',
      uploadedBy: req.user._id,
    });

    await room.save({ validateBeforeSave: false });

    res.status(201).json({
      success:  true,
      message:  'Resource added.',
      resource: room.resources[room.resources.length - 1],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};