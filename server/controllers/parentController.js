import mongoose        from 'mongoose';
import ParentChildLink from '../models/ParentChildLink.js';
import ParentReport    from '../models/ParentReport.js';
import User            from '../models/User.js';
import StudySession    from '../models/StudySession.js';
import Task            from '../models/Task.js';
import Assignment      from '../models/Assignment.js';
import PomodoroSession from '../models/PomodoroSession.js';
import Room            from '../models/Room.js';

// ─── Helper: get verified active link ─────────────────────────────────────────
const getActiveLink = async (parentId, childId) => {
  return ParentChildLink.findOne({
    parent: parentId,
    child:  childId,
    status: 'accepted',
  });
};

// ─── Helper: check permission on link ─────────────────────────────────────────
const hasPermission = (link, permission) => {
  return link.permissions[permission] === true;
};

// ══════════════════════════════════════════════════════════════════════════════
//  LINKING
// ══════════════════════════════════════════════════════════════════════════════

// ─── Send Link Request to Child ───────────────────────────────────────────────
export const sendLinkRequest = async (req, res) => {
  try {
    const { childEmail, permissions, alerts } = req.body;

    if (!childEmail) {
      return res.status(400).json({
        success: false,
        message: 'Child email is required.',
      });
    }

    const child = await User.findOne({
      email: childEmail.toLowerCase(),
      role:  'student',
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'No student account found with that email.',
      });
    }

    if (child._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot link to your own account.',
      });
    }

    // Check if link already exists
    const existing = await ParentChildLink.findOne({
      parent: req.user._id,
      child:  child._id,
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'You are already linked to this student.',
        });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'A pending link request already exists.',
        });
      }
      // Re-send if previously rejected / revoked
      existing.status      = 'pending';
      existing.requestedAt = new Date();
      existing.revokedAt   = null;
      existing.acceptedAt  = null;
      if (permissions) existing.permissions = { ...existing.permissions, ...permissions };
      if (alerts)      existing.alerts      = { ...existing.alerts, ...alerts };
      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Link request re-sent.',
        link:    existing,
      });
    }

    // Generate link code (child can use this to accept)
    const linkCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const link = await ParentChildLink.create({
      parent:      req.user._id,
      child:       child._id,
      status:      'pending',
      linkCode,
      linkedBy:    'parent',
      permissions: permissions || {},
      alerts:      alerts      || {},
    });

    await link.populate('child', 'name email avatar');

    res.status(201).json({
      success: true,
      message: `Link request sent to ${child.name}. They must accept it.`,
      link,
      linkCode,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A link request already exists for this student.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Accept / Reject Link (Child action) ──────────────────────────────────────
export const respondToLinkRequest = async (req, res) => {
  try {
    const { linkId }  = req.params;
    const { action }  = req.body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'accept' or 'reject'.",
      });
    }

    const link = await ParentChildLink.findOne({
      _id:    linkId,
      child:  req.user._id,
      status: 'pending',
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Pending link request not found.',
      });
    }

    if (action === 'accept') {
      link.status     = 'accepted';
      link.acceptedAt = new Date();

      // Update both user records
      await User.findByIdAndUpdate(req.user._id, {
        $set: { parentAccount: link.parent },
      });
      await User.findByIdAndUpdate(link.parent, {
        $addToSet: { children: req.user._id },
      });
    } else {
      link.status = 'rejected';
    }

    await link.save();
    await link.populate('parent', 'name email avatar');

    res.status(200).json({
      success: true,
      message: action === 'accept'
        ? 'Link accepted. Your parent can now view your progress.'
        : 'Link request rejected.',
      link,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Link Requests (for child) ────────────────────────────────────────────
export const getMyLinkRequests = async (req, res) => {
  try {
    const links = await ParentChildLink.find({
      child:  req.user._id,
      status: 'pending',
    }).populate('parent', 'name email avatar');

    res.status(200).json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get My Linked Children (parent view) ─────────────────────────────────────
export const getMyChildren = async (req, res) => {
  try {
    const links = await ParentChildLink.find({
      parent: req.user._id,
      status: { $in: ['accepted', 'pending'] },
    })
      .populate('child', 'name email avatar lastSeen isActive role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Revoke Link (parent or child) ────────────────────────────────────────────
export const revokeLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await ParentChildLink.findOne({
      _id:    linkId,
      $or: [
        { parent: req.user._id },
        { child:  req.user._id },
      ],
      status: 'accepted',
    });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Active link not found.' });
    }

    link.status    = 'revoked';
    link.revokedAt = new Date();
    await link.save();

    // Clean up user records
    await User.findByIdAndUpdate(link.child, {
      $unset: { parentAccount: '' },
    });
    await User.findByIdAndUpdate(link.parent, {
      $pull: { children: link.child },
    });

    res.status(200).json({ success: true, message: 'Link revoked successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Link Permissions / Alerts ─────────────────────────────────────────
export const updateLinkSettings = async (req, res) => {
  try {
    const { linkId }              = req.params;
    const { permissions, alerts } = req.body;

    const link = await ParentChildLink.findOne({
      _id:    linkId,
      parent: req.user._id,
      status: 'accepted',
    });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found.' });
    }

    if (permissions) {
      link.permissions = { ...link.permissions.toObject(), ...permissions };
    }
    if (alerts) {
      link.alerts = { ...link.alerts.toObject(), ...alerts };
    }

    await link.save();

    res.status(200).json({
      success: true,
      message: 'Link settings updated.',
      link,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  CHILD DATA
// ══════════════════════════════════════════════════════════════════════════════

// ─── Get Child Profile ────────────────────────────────────────────────────────
export const getChildProfile = async (req, res) => {
  try {
    const { childId } = req.params;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({
        success: false,
        message: 'No active link found with this student.',
      });
    }

    const child = await User.findById(childId)
      .select('name email avatar lastSeen createdAt role isActive')
      .populate('managedRooms', 'name subject');

    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found.' });
    }

    // Enrolled rooms
    const enrolledRooms = await Room.find({
      'students.student': childId,
      'students.isActive': true,
    })
      .select('name subject teacher coverColor')
      .populate('teacher', 'name avatar');

    res.status(200).json({
      success: true,
      child,
      enrolledRooms,
      linkDetails: {
        linkedSince:  link.acceptedAt,
        permissions:  link.permissions,
        alerts:       link.alerts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Child Study Sessions ─────────────────────────────────────────────────
export const getChildStudySessions = async (req, res) => {
  try {
    const { childId }               = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }
    if (!hasPermission(link, 'viewStudySessions')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view study sessions.',
      });
    }

    const filter = { student: childId, status: 'completed' };
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate)   filter.startTime.$lte = new Date(endDate);
    }

    const total    = await StudySession.countDocuments(filter);
    const sessions = await StudySession.find(filter)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('room', 'name subject');

    res.status(200).json({
      success: true,
      sessions,
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

// ─── Get Child Tasks ──────────────────────────────────────────────────────────
export const getChildTasks = async (req, res) => {
  try {
    const { childId }                  = req.params;
    const { status, priority, page = 1, limit = 20 } = req.query;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }
    if (!hasPermission(link, 'viewTasks')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view tasks.',
      });
    }

    const filter = { student: childId };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('assignedBy', 'name avatar role');

    res.status(200).json({
      success: true,
      tasks,
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

// ─── Get Child Assignments ────────────────────────────────────────────────────
export const getChildAssignments = async (req, res) => {
  try {
    const { childId }        = req.params;
    const { page = 1, limit = 10 } = req.query;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }
    if (!hasPermission(link, 'viewAssignments')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view assignments.',
      });
    }

    // Find all assignments where child has a submission
    const assignments = await Assignment.find({
      'submissions.student': childId,
      isPublished:           true,
    })
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'name avatar')
      .populate('room',      'name subject');

    const total = await Assignment.countDocuments({
      'submissions.student': childId,
      isPublished:           true,
    });

    // Only expose child's own submission in each assignment
    const sanitized = assignments.map((a) => {
      const obj        = a.toObject();
      obj.mySubmission = a.submissions.find(
        (s) => s.student.toString() === childId
      ) || null;
      delete obj.submissions;
      return obj;
    });

    res.status(200).json({
      success: true,
      assignments: sanitized,
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

// ══════════════════════════════════════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// ─── Get Child Analytics Dashboard ───────────────────────────────────────────
export const getChildAnalytics = async (req, res) => {
  try {
    const { childId }          = req.params;
    const { period = '7' }     = req.query;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }
    if (!hasPermission(link, 'viewAnalytics')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics.',
      });
    }

    const since      = new Date();
    since.setDate(since.getDate() - Number(period));
    const childObjId = new mongoose.Types.ObjectId(childId);

    const [
      studySummary,
      dailyStudy,
      subjectBreakdown,
      taskSummary,
      assignmentSummary,
      pomodoroSummary,
      streakData,
    ] = await Promise.all([

      // ── Study summary ────────────────────────────────────────────────────
      StudySession.aggregate([
        {
          $match: {
            student:   childObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:              null,
            totalMinutes:     { $sum: '$durationMinutes' },
            totalSessions:    { $sum: 1 },
            totalXP:          { $sum: '$xpEarned' },
            avgFocusScore:    { $avg: '$focusScore' },
            avgDuration:      { $avg: '$durationMinutes' },
            longestSession:   { $max: '$durationMinutes' },
          },
        },
      ]),

      // ── Daily activity ───────────────────────────────────────────────────
      StudySession.aggregate([
        {
          $match: {
            student:   childObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
            },
            totalMinutes:  { $sum: '$durationMinutes' },
            sessionCount:  { $sum: 1 },
            xpEarned:      { $sum: '$xpEarned' },
            avgFocusScore: { $avg: '$focusScore' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // ── Subject breakdown ────────────────────────────────────────────────
      StudySession.aggregate([
        {
          $match: {
            student:   childObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:          '$subject',
            totalMinutes: { $sum: '$durationMinutes' },
            sessionCount: { $sum: 1 },
            avgFocus:     { $avg: '$focusScore' },
          },
        },
        { $sort: { totalMinutes: -1 } },
        { $limit: 10 },
      ]),

      // ── Task summary ─────────────────────────────────────────────────────
      Task.aggregate([
        { $match: { student: childObjId } },
        {
          $group: {
            _id:       '$status',
            count:     { $sum: 1 },
            xpEarned:  { $sum: '$xpEarned' },
          },
        },
      ]),

      // ── Assignment summary ───────────────────────────────────────────────
      Assignment.aggregate([
        { $unwind: '$submissions' },
        {
          $match: {
            'submissions.student': childObjId,
          },
        },
        {
          $group: {
            _id:         null,
            avgGrade:    { $avg: '$submissions.grade' },
            submitted:   { $sum: 1 },
            lateCount:   {
              $sum: { $cond: ['$submissions.isLate', 1, 0] },
            },
            gradedCount: {
              $sum: {
                $cond: [{ $eq: ['$submissions.status', 'graded'] }, 1, 0],
              },
            },
            passCount: {
              $sum: {
                $cond: [{ $gte: ['$submissions.grade', 40] }, 1, 0],
              },
            },
          },
        },
      ]),

      // ── Pomodoro summary ─────────────────────────────────────────────────
      PomodoroSession.aggregate([
        {
          $match: {
            student:   childObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:            null,
            totalSessions:  { $sum: 1 },
            totalCycles:    { $sum: '$completedCycles' },
            totalWorkMins:  { $sum: '$totalWorkMinutes' },
            totalBreakMins: { $sum: '$totalBreakMinutes' },
          },
        },
      ]),

      // ── Streak calculation (all-time) ────────────────────────────────────
      StudySession.aggregate([
        {
          $match: {
            student: childObjId,
            status:  'completed',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
            },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 90 }, // last 90 days for streak calc
      ]),
    ]);

    // ── Calculate streak ───────────────────────────────────────────────────
    const studyDates   = streakData.map((d) => d._id).sort().reverse();
    let currentStreak  = 0;
    let longestStreak  = 0;
    let tempStreak     = 0;
    const today        = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < studyDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);

      if (studyDates[i] === expectedStr) {
        tempStreak++;
        if (i === 0 || studyDates[0] === today) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak    = 0;
        if (i === 0)  currentStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // ── Task map ───────────────────────────────────────────────────────────
    const taskMap = {};
    taskSummary.forEach((t) => { taskMap[t._id] = t.count; });
    const totalTasks     = taskSummary.reduce((a, t) => a + t.count, 0);
    const completedTasks = taskMap['completed'] || 0;

    // ── Engagement score ───────────────────────────────────────────────────
    const studyData    = studySummary[0] || {};
    const asgData      = assignmentSummary[0] || {};
    const completionRate = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const engagementScore = Math.round(
      (Math.min((studyData.totalMinutes || 0) / (Number(period) * 30), 1) * 40) +
      (completionRate * 0.35) +
      ((asgData.avgGrade || 0) / 100 * 25)
    );

    // ── Trend alerts ───────────────────────────────────────────────────────
    const alerts     = link.alerts;
    const triggered  = [];
    const activeDays = dailyStudy.length;

    if (activeDays === 0) {
      triggered.push({ type: 'inactivity', severity: 'high',
        message: `No study sessions in the last ${period} days.` });
    } else {
      const avgDaily = (studyData.totalMinutes || 0) / Number(period);
      if (avgDaily < alerts.minDailyStudyMins) {
        triggered.push({
          type: 'low_study',
          severity: avgDaily < alerts.minDailyStudyMins / 2 ? 'high' : 'medium',
          message: `Average daily study time (${Math.round(avgDaily)} min) is below target (${alerts.minDailyStudyMins} min).`,
        });
      }
    }

    const overdueTasks = taskMap['overdue'] || 0;
    if (overdueTasks >= alerts.overdueTaskLimit) {
      triggered.push({
        type: 'overdue_tasks',
        severity: overdueTasks >= alerts.overdueTaskLimit * 2 ? 'high' : 'medium',
        message: `${overdueTasks} overdue task(s) detected.`,
      });
    }

    res.status(200).json({
      success: true,
      period:  Number(period),
      child: {
        _id:           childId,
        currentStreak,
        longestStreak,
        engagementScore: Math.min(100, engagementScore),
        activeDays,
      },
      study: {
        summary:          studyData,
        dailyActivity:    dailyStudy,
        subjectBreakdown,
      },
      tasks: {
        total:          totalTasks,
        completed:      completedTasks,
        overdue:        taskMap['overdue']     || 0,
        inProgress:     taskMap['in_progress'] || 0,
        todo:           taskMap['todo']        || 0,
        completionRate,
      },
      assignments: {
        ...asgData,
        avgGrade: asgData.avgGrade ? Math.round(asgData.avgGrade) : null,
      },
      pomodoro: pomodoroSummary[0] || {
        totalSessions: 0, totalCycles: 0,
        totalWorkMins: 0, totalBreakMins: 0,
      },
      alerts: triggered,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Child Weekly Comparison ─────────────────────────────────────────────
export const getWeeklyComparison = async (req, res) => {
  try {
    const { childId } = req.params;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }

    const childObjId  = new mongoose.Types.ObjectId(childId);
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekEnd   = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const weekStats = async (start, end) => {
      const [study, tasks, assignments] = await Promise.all([
        StudySession.aggregate([
          {
            $match: {
              student:   childObjId,
              status:    'completed',
              startTime: { $gte: start, ...(end ? { $lte: end } : {}) },
            },
          },
          {
            $group: {
              _id:           null,
              totalMinutes:  { $sum: '$durationMinutes' },
              sessionCount:  { $sum: 1 },
              totalXP:       { $sum: '$xpEarned' },
              avgFocusScore: { $avg: '$focusScore' },
            },
          },
        ]),
        Task.aggregate([
          {
            $match: {
              student:   childObjId,
              createdAt: { $gte: start, ...(end ? { $lte: end } : {}) },
            },
          },
          {
            $group: {
              _id:   '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Assignment.aggregate([
          { $unwind: '$submissions' },
          {
            $match: {
              'submissions.student':     childObjId,
              'submissions.submittedAt': { $gte: start, ...(end ? { $lte: end } : {}) },
            },
          },
          {
            $group: {
              _id:      null,
              avgGrade: { $avg: '$submissions.grade' },
              submitted:{ $sum: 1 },
            },
          },
        ]),
      ]);

      const taskMap     = {};
      tasks.forEach((t) => { taskMap[t._id] = t.count; });
      const totalT      = tasks.reduce((a, t) => a + t.count, 0);
      const completedT  = taskMap['completed'] || 0;

      return {
        study:       study[0] || { totalMinutes: 0, sessionCount: 0, totalXP: 0 },
        tasks: {
          total:          totalT,
          completed:      completedT,
          completionRate: totalT ? Math.round((completedT / totalT) * 100) : 0,
        },
        assignments: assignments[0] || { avgGrade: null, submitted: 0 },
      };
    };

    const [thisWeek, lastWeek] = await Promise.all([
      weekStats(thisWeekStart, null),
      weekStats(lastWeekStart, lastWeekEnd),
    ]);

    // Calculate deltas
    const delta = (curr, prev) =>
      prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);

    res.status(200).json({
      success: true,
      thisWeek,
      lastWeek,
      deltas: {
        studyMinutes:   delta(thisWeek.study.totalMinutes,     lastWeek.study.totalMinutes),
        studySessions:  delta(thisWeek.study.sessionCount,     lastWeek.study.sessionCount),
        xpEarned:       delta(thisWeek.study.totalXP,          lastWeek.study.totalXP),
        completionRate: delta(thisWeek.tasks.completionRate,   lastWeek.tasks.completionRate),
        avgGrade:       delta(thisWeek.assignments.avgGrade,   lastWeek.assignments.avgGrade),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Generate On-Demand Report ────────────────────────────────────────────────
export const generateReport = async (req, res) => {
  try {
    const { childId }                      = req.params;
    const { startDate, endDate, reportType = 'on_demand' } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required.',
      });
    }

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }

    const start      = new Date(startDate);
    const end        = new Date(endDate);
    const childObjId = new mongoose.Types.ObjectId(childId);

    const [studyData, taskData, assignmentData, pomodoroData, dailyActivity] =
      await Promise.all([
        StudySession.aggregate([
          {
            $match: {
              student:   childObjId,
              status:    'completed',
              startTime: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id:           null,
              totalMinutes:  { $sum: '$durationMinutes' },
              totalSessions: { $sum: 1 },
              totalXP:       { $sum: '$xpEarned' },
              avgFocusScore: { $avg: '$focusScore' },
            },
          },
        ]),

        Task.aggregate([
          {
            $match: {
              student:   childObjId,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id:      '$status',
              count:    { $sum: 1 },
              xpEarned: { $sum: '$xpEarned' },
            },
          },
        ]),

        Assignment.aggregate([
          { $unwind: '$submissions' },
          {
            $match: {
              'submissions.student':     childObjId,
              'submissions.submittedAt': { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id:         null,
              avgGrade:    { $avg: '$submissions.grade' },
              submitted:   { $sum: 1 },
              lateCount:   { $sum: { $cond: ['$submissions.isLate', 1, 0] } },
              passCount:   { $sum: { $cond: [{ $gte: ['$submissions.grade', 40] }, 1, 0] } },
              gradedCount: {
                $sum: { $cond: [{ $eq: ['$submissions.status', 'graded'] }, 1, 0] },
              },
            },
          },
        ]),

        PomodoroSession.aggregate([
          {
            $match: {
              student:   childObjId,
              status:    'completed',
              startTime: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id:            null,
              totalSessions:  { $sum: 1 },
              totalCycles:    { $sum: '$completedCycles' },
              totalWorkMins:  { $sum: '$totalWorkMinutes' },
            },
          },
        ]),

        StudySession.aggregate([
          {
            $match: {
              student:   childObjId,
              status:    'completed',
              startTime: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id:          { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
              totalMinutes: { $sum: '$durationMinutes' },
              sessions:     { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // ── Build snapshot ─────────────────────────────────────────────────────
    const study         = studyData[0]      || {};
    const asgn          = assignmentData[0] || {};
    const pom           = pomodoroData[0]   || {};
    const taskMap       = {};
    taskData.forEach((t) => { taskMap[t._id] = t.count; });
    const totalTasks    = taskData.reduce((a, t) => a + t.count, 0);
    const completedT    = taskMap['completed'] || 0;
    const days          = Math.max(1, Math.round((end - start) / 86400000));
    const activeDays    = dailyActivity.length;

    // ── Auto highlights and concerns ─────────────────────────────────────
    const highlights = [];
    const concerns   = [];

    if ((study.totalMinutes || 0) > 0) {
      highlights.push(
        `Studied for ${study.totalMinutes} minutes across ${study.totalSessions} sessions.`
      );
    }
    if (completedT > 0) {
      highlights.push(`Completed ${completedT} task(s).`);
    }
    if (asgn.avgGrade >= 75) {
      highlights.push(`Strong assignment average: ${Math.round(asgn.avgGrade)}%.`);
    }
    if ((pom.totalCycles || 0) > 0) {
      highlights.push(`Completed ${pom.totalCycles} Pomodoro cycle(s).`);
    }

    if (activeDays < days * 0.3) {
      concerns.push(`Only studied on ${activeDays} out of ${days} days.`);
    }
    if ((taskMap['overdue'] || 0) > 0) {
      concerns.push(`${taskMap['overdue']} overdue task(s) detected.`);
    }
    if (asgn.lateCount > 0) {
      concerns.push(`${asgn.lateCount} late assignment submission(s).`);
    }
    if (asgn.avgGrade !== null && asgn.avgGrade < 40) {
      concerns.push(`Assignment average below passing: ${Math.round(asgn.avgGrade)}%.`);
    }

    const topSubjects = await StudySession.aggregate([
      {
        $match: {
          student:   childObjId,
          status:    'completed',
          startTime: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$subject', minutes: { $sum: '$durationMinutes' } } },
      { $sort: { minutes: -1 } },
      { $limit: 5 },
    ]);

    const report = await ParentReport.create({
      parent:     req.user._id,
      child:      childId,
      reportType,
      period:     { startDate: start, endDate: end },
      snapshot: {
        study: {
          totalMinutes:    study.totalMinutes    || 0,
          totalSessions:   study.totalSessions   || 0,
          avgDailyMinutes: Math.round((study.totalMinutes || 0) / days),
          avgFocusScore:   study.avgFocusScore
            ? Math.round(study.avgFocusScore)
            : null,
          topSubjects:     topSubjects.map((s) => ({
            subject: s._id,
            minutes: s.minutes,
          })),
          activeDays,
          longestStreak: 0, // calculated separately if needed
        },
        tasks: {
          total:          totalTasks,
          completed:      completedT,
          overdue:        taskMap['overdue'] || 0,
          completionRate: totalTasks
            ? Math.round((completedT / totalTasks) * 100)
            : 0,
          xpEarned: taskData.reduce((a, t) => a + t.xpEarned, 0),
        },
        assignments: {
          submitted:  asgn.submitted  || 0,
          avgGrade:   asgn.avgGrade   ? Math.round(asgn.avgGrade) : null,
          lateCount:  asgn.lateCount  || 0,
          passCount:  asgn.passCount  || 0,
        },
        pomodoro: {
          totalSessions: pom.totalSessions || 0,
          totalCycles:   pom.totalCycles   || 0,
          totalWorkMins: pom.totalWorkMins || 0,
        },
        highlights,
        concerns,
        dailyActivity: dailyActivity.map((d) => ({
          date:     d._id,
          minutes:  d.totalMinutes,
          sessions: d.sessions,
        })),
      },
      isAutoGenerated: false,
    });

    res.status(201).json({
      success: true,
      message: 'Report generated successfully.',
      report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get All Reports for a Child ──────────────────────────────────────────────
export const getReports = async (req, res) => {
  try {
    const { childId }                  = req.params;
    const { page = 1, limit = 10, reportType } = req.query;

    const link = await getActiveLink(req.user._id, childId);
    if (!link) {
      return res.status(403).json({ success: false, message: 'No active link found.' });
    }

    const filter = { parent: req.user._id, child: childId };
    if (reportType) filter.reportType = reportType;

    const total   = await ParentReport.countDocuments(filter);
    const reports = await ParentReport.find(filter)
      .sort({ generatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-snapshot.dailyActivity'); // exclude heavy field in list

    res.status(200).json({
      success: true,
      reports,
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

// ─── Get Single Report ────────────────────────────────────────────────────────
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await ParentReport.findOne({
      _id:    reportId,
      parent: req.user._id,
    })
      .populate('child',  'name email avatar')
      .populate('parent', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Mark as read
    if (!report.isRead) {
      report.isRead  = true;
      report.readAt  = new Date();
      await report.save({ validateBeforeSave: false });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Report ────────────────────────────────────────────────────────────
export const deleteReport = async (req, res) => {
  try {
    const report = await ParentReport.findOneAndDelete({
      _id:    req.params.reportId,
      parent: req.user._id,
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.status(200).json({ success: true, message: 'Report deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Multi-Child Overview (dashboard) ─────────────────────────────────────
export const getMultiChildOverview = async (req, res) => {
  try {
    const links = await ParentChildLink.find({
      parent: req.user._id,
      status: 'accepted',
    }).populate('child', 'name email avatar lastSeen');

    if (links.length === 0) {
      return res.status(200).json({
        success:  true,
        children: [],
        message:  'No linked children found.',
      });
    }

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const childrenData = await Promise.all(
      links.map(async (link) => {
        const childObjId = link.child._id;

        const [studyStats, taskStats, latestReport] = await Promise.all([
          StudySession.aggregate([
            {
              $match: {
                student:   childObjId,
                status:    'completed',
                startTime: { $gte: since },
              },
            },
            {
              $group: {
                _id:          null,
                totalMinutes: { $sum: '$durationMinutes' },
                sessions:     { $sum: 1 },
                lastStudied:  { $max: '$startTime' },
              },
            },
          ]),
          Task.aggregate([
            { $match: { student: childObjId } },
            {
              $group: {
                _id:   '$status',
                count: { $sum: 1 },
              },
            },
          ]),
          ParentReport.findOne({ parent: req.user._id, child: childObjId })
            .sort({ generatedAt: -1 })
            .select('generatedAt reportType snapshot.study.totalMinutes'),
        ]);

        const taskMap = {};
        taskStats.forEach((t) => { taskMap[t._id] = t.count; });

        const study       = studyStats[0] || {};
        const lastStudied = study.lastStudied || null;
        const daysSince   = lastStudied
          ? Math.floor((new Date() - lastStudied) / 86400000)
          : null;

        return {
          child:          link.child,
          linkedSince:    link.acceptedAt,
          weeklyStudyMins:study.totalMinutes || 0,
          weeklySessions: study.sessions     || 0,
          lastStudied,
          daysSinceStudy: daysSince,
          tasks: {
            overdue:    taskMap['overdue']     || 0,
            inProgress: taskMap['in_progress'] || 0,
            completed:  taskMap['completed']   || 0,
          },
          latestReport: latestReport
            ? { id: latestReport._id, generatedAt: latestReport.generatedAt }
            : null,
          alertFlag: !lastStudied || daysSince > link.alerts.inactivityDays,
        };
      })
    );

    res.status(200).json({
      success:  true,
      children: childrenData,
      total:    childrenData.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};