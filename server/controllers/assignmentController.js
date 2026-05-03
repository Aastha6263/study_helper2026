import Assignment from '../models/Assignment.js';
import Room       from '../models/Room.js';
import Task       from '../models/Task.js';
import User       from '../models/User.js';

// ─── Helper: verify teacher owns the room ─────────────────────────────────────
export const verifyTeacherRoom = async (roomId, userId) => {
  return Room.findOne({
    _id: roomId,
    $or: [{ teacher: userId }, { coTeachers: userId }],
  });
};

// ─── Create Assignment ────────────────────────────────────────────────────────
export const createAssignment = async (req, res) => {
  try {
    const {
      roomId, title, description, subject, type,
      priority, dueDate, availableFrom, maxScore,
      passingScore, assignedTo, instructions,
      tags, allowLate, xpReward, attachments,
    } = req.body;

    if (!roomId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'roomId, title, and dueDate are required.',
      });
    }

    const room = await verifyTeacherRoom(roomId, req.user._id);
    if (!room) {
      return res.status(403).json({
        success: false,
        message: 'Class not found or access denied.',
      });
    }

    // Determine who gets assigned: specific list or all active students
    let targetStudents = assignedTo || [];
    if (targetStudents.length === 0) {
      targetStudents = room.students
        .filter((s) => s.isActive)
        .map((s) => s.student.toString());
    }

    const assignment = await Assignment.create({
      room:         roomId,
      createdBy:    req.user._id,
      title,
      description:  description  || '',
      subject:      subject      || room.subject,
      type:         type         || 'homework',
      priority:     priority     || 'medium',
      dueDate:      new Date(dueDate),
      availableFrom:availableFrom ? new Date(availableFrom) : new Date(),
      maxScore:     maxScore      || 100,
      passingScore: passingScore  || 40,
      assignedTo:   targetStudents,
      instructions: instructions  || '',
      tags:         tags          || [],
      allowLate:    allowLate !== undefined ? allowLate : true,
      xpReward:     xpReward      || 20,
      attachments:  attachments   || [],
    });

    // Mirror as individual Tasks for each student
    const taskDocs = targetStudents.map((studentId) => ({
      student:      studentId,
      assignedBy:   req.user._id,
      room:         roomId,
      title:        `[Assignment] ${title}`,
      description:  description || '',
      subject:      subject     || room.subject,
      priority:     priority    || 'medium',
      dueDate:      new Date(dueDate),
      xpReward:     xpReward    || 20,
      status:       'todo',
    }));

    await Task.insertMany(taskDocs);

    // Update room stats
    room.stats.totalTasks += 1;
    await room.save({ validateBeforeSave: false });

    assignment.stats.totalAssigned = targetStudents.length;
    await assignment.save();

    await assignment.populate('createdBy', 'name avatar');

    res.status(201).json({
      success:    true,
      message:    `Assignment created and assigned to ${targetStudents.length} student(s).`,
      assignment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Assignments for a Room ───────────────────────────────────────────────
export const getRoomAssignments = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      page  = 1,
      limit = 10,
      type,
      status,
      search,
    } = req.query;

    // Verify access (teacher or student in room)
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const isTeacher =
      room.teacher.toString() === req.user._id.toString() ||
      room.coTeachers.some((t) => t.toString() === req.user._id.toString());

    const isStudent = room.students.some(
      (s) => s.student.toString() === req.user._id.toString() && s.isActive
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filter = { room: roomId, isPublished: true };
    if (type)   filter.type  = type;
    if (search) filter.title = new RegExp(search, 'i');

    const total       = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'name avatar')
      .select(isTeacher ? '' : '-submissions');

    res.status(200).json({
      success: true,
      assignments,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Single Assignment ────────────────────────────────────────────────────
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy',         'name avatar')
      .populate('assignedTo',        'name email avatar')
      .populate('submissions.student','name email avatar');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const room = await Room.findById(assignment.room);
    const isTeacher =
      room.teacher.toString() === req.user._id.toString() ||
      room.coTeachers.some((t) => t.toString() === req.user._id.toString());

    if (!isTeacher) {
      // Students only see their own submission
      const mySubmission = assignment.submissions.find(
        (s) => s.student._id.toString() === req.user._id.toString()
      );
      const sanitized = assignment.toObject();
      sanitized.submissions = mySubmission ? [mySubmission] : [];
      return res.status(200).json({ success: true, assignment: sanitized, isTeacher: false });
    }

    res.status(200).json({ success: true, assignment, isTeacher: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Assignment ────────────────────────────────────────────────────────
export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const room = await verifyTeacherRoom(assignment.room, req.user._id);
    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const allowed = [
      'title','description','instructions','dueDate',
      'maxScore','passingScore','priority','type',
      'allowLate','isPublished','xpReward','tags',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) assignment[field] = req.body[field];
    });

    if (req.body.dueDate) assignment.dueDate = new Date(req.body.dueDate);

    await assignment.save();

    res.status(200).json({ success: true, message: 'Assignment updated.', assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Assignment ────────────────────────────────────────────────────────
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const room = await verifyTeacherRoom(assignment.room, req.user._id);
    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Remove mirrored tasks
    await Task.deleteMany({
      room:       assignment.room,
      assignedBy: req.user._id,
      title:      `[Assignment] ${assignment.title}`,
    });

    await assignment.deleteOne();

    room.stats.totalTasks = Math.max(0, room.stats.totalTasks - 1);
    await room.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Assignment deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Submit Assignment (Student) ──────────────────────────────────────────────
export const submitAssignment = async (req, res) => {
  try {
    const { content, attachments } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Verify student is assigned
    const isAssigned =
      assignment.assignedTo.length === 0 ||
      assignment.assignedTo.some(
        (id) => id.toString() === req.user._id.toString()
      );

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this assignment.',
      });
    }

    // Prevent duplicate submission
    const existingSub = assignment.submissions.find(
      (s) => s.student.toString() === req.user._id.toString()
    );

    if (existingSub && existingSub.status !== 'returned') {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment.',
      });
    }

    const now    = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLate) {
      return res.status(400).json({
        success: false,
        message: 'The deadline has passed and late submissions are not allowed.',
      });
    }

    const submission = {
      student:     req.user._id,
      submittedAt: now,
      content:     content     || '',
      attachments: attachments || [],
      status:      isLate ? 'late' : 'submitted',
      isLate,
    };

    if (existingSub) {
      // Re-submission after return
      Object.assign(existingSub, submission);
    } else {
      assignment.submissions.push(submission);
    }

    assignment.recomputeStats();
    await assignment.save();

    res.status(201).json({
      success: true,
      message: isLate
        ? 'Assignment submitted (late).'
        : 'Assignment submitted successfully!',
      submission,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Grade Submission ─────────────────────────────────────────────────────────
export const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const { id, submissionId } = req.params;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ success: false, message: 'Grade is required.' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const room = await verifyTeacherRoom(assignment.room, req.user._id);
    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (grade < 0 || grade > assignment.maxScore) {
      return res.status(400).json({
        success: false,
        message: `Grade must be between 0 and ${assignment.maxScore}.`,
      });
    }

    submission.grade    = grade;
    submission.feedback = feedback || '';
    submission.status   = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;

    assignment.recomputeStats();
    await assignment.save();

    res.status(200).json({
      success:    true,
      message:    'Submission graded.',
      submission,
      stats:      assignment.stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Return Submission for Revision ──────────────────────────────────────────
export const returnSubmission = async (req, res) => {
  try {
    const { feedback } = req.body;
    const { id, submissionId } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const room = await verifyTeacherRoom(assignment.room, req.user._id);
    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    submission.status   = 'returned';
    submission.feedback = feedback || '';
    await assignment.save();

    res.status(200).json({
      success:    true,
      message:    'Submission returned for revision.',
      submission,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};