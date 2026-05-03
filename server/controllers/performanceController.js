import StudySession   from '../models/StudySession.js';
import Task           from '../models/Task.js';
import Assignment     from '../models/Assignment.js';
import PomodoroSession from '../models/PomodoroSession.js';
import Room           from '../models/Room.js';
import User           from '../models/User.js';
import mongoose       from 'mongoose';
import { verifyTeacherRoom } from './assignmentController.js';

// ─── Helper: verify teacher has access to student via a shared room ───────────
const verifyTeacherStudentAccess = async (teacherId, studentId) => {
  const room = await Room.findOne({
    $or: [{ teacher: teacherId }, { coTeachers: teacherId }],
    'students.student': studentId,
    'students.isActive': true,
  });
  return !!room;
};

// ─── Get Class-Wide Performance Overview ──────────────────────────────────────
export const getClassPerformance = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { period = '30' } = req.query;

    const room = await Room.findOne({
      _id:     roomId,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    }).populate('students.student', 'name email avatar lastSeen');

    if (!room) {
      return res.status(403).json({ success: false, message: 'Class not found or access denied.' });
    }

    const since       = new Date();
    since.setDate(since.getDate() - Number(period));

    const activeStudentIds = room.students
      .filter((s) => s.isActive)
      .map((s) => s.student._id);

    const [
      studyStats,
      taskStats,
      assignmentStats,
      topStudents,
    ] = await Promise.all([
      // Avg study time per student
      StudySession.aggregate([
        {
          $match: {
            student:   { $in: activeStudentIds },
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:           '$student',
            totalMinutes:  { $sum: '$durationMinutes' },
            sessionCount:  { $sum: 1 },
            totalXP:       { $sum: '$xpEarned' },
            avgFocusScore: { $avg: '$focusScore' },
          },
        },
      ]),

      // Task completion rates
      Task.aggregate([
        {
          $match: {
            student:    { $in: activeStudentIds },
            assignedBy: req.user._id,
          },
        },
        {
          $group: {
            _id:       '$student',
            total:     { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            overdue: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
            },
          },
        },
      ]),

      // Assignment submission + grade stats
      Assignment.aggregate([
        { $match: { room: new mongoose.Types.ObjectId(roomId) } },
        { $unwind: '$submissions' },
        {
          $group: {
            _id:      '$submissions.student',
            avgGrade: { $avg: '$submissions.grade' },
            submitted:{ $sum: 1 },
            graded:   {
              $sum: { $cond: [{ $eq: ['$submissions.status', 'graded'] }, 1, 0] },
            },
            onTime: {
              $sum: { $cond: [{ $eq: ['$submissions.isLate', false] }, 1, 0] },
            },
          },
        },
      ]),

      // Top 5 students by XP
      StudySession.aggregate([
        {
          $match: {
            student: { $in: activeStudentIds },
            status:  'completed',
          },
        },
        {
          $group: {
            _id:     '$student',
            totalXP: { $sum: '$xpEarned' },
          },
        },
        { $sort: { totalXP: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from:         'users',
            localField:   '_id',
            foreignField: '_id',
            as:           'student',
          },
        },
        { $unwind: '$student' },
        {
          $project: {
            'student.name':   1,
            'student.avatar': 1,
            'student.email':  1,
            totalXP:          1,
          },
        },
      ]),
    ]);

    // Merge all stats per student
    const studyMap      = new Map(studyStats.map((s) => [s._id.toString(), s]));
    const taskMap       = new Map(taskStats.map((s) => [s._id.toString(), s]));
    const assignmentMap = new Map(assignmentStats.map((s) => [s._id.toString(), s]));

    const studentPerformance = room.students
      .filter((s) => s.isActive)
      .map((s) => {
        const sid   = s.student._id.toString();
        const study = studyMap.get(sid)      || {};
        const task  = taskMap.get(sid)       || {};
        const asgn  = assignmentMap.get(sid) || {};

        const completionRate = task.total
          ? Math.round((task.completed / task.total) * 100)
          : 0;

        return {
          student:        s.student,
          joinedAt:       s.joinedAt,
          study: {
            totalMinutes:  study.totalMinutes  || 0,
            sessionCount:  study.sessionCount  || 0,
            totalXP:       study.totalXP       || 0,
            avgFocusScore: study.avgFocusScore
              ? Math.round(study.avgFocusScore)
              : null,
          },
          tasks: {
            total:          task.total      || 0,
            completed:      task.completed  || 0,
            overdue:        task.overdue    || 0,
            completionRate,
          },
          assignments: {
            submitted: asgn.submitted || 0,
            graded:    asgn.graded    || 0,
            onTime:    asgn.onTime    || 0,
            avgGrade:  asgn.avgGrade
              ? Math.round(asgn.avgGrade)
              : null,
          },
          // Simple engagement score 0-100
          engagementScore: Math.round(
            (completionRate * 0.4) +
            (Math.min((study.totalMinutes || 0) / (Number(period) * 30), 1) * 40) +
            (asgn.avgGrade ? (asgn.avgGrade / 100) * 20 : 0)
          ),
        };
      });

    // Class averages
    const classAvgStudyMins = studentPerformance.length
      ? Math.round(
          studentPerformance.reduce((a, s) => a + s.study.totalMinutes, 0) /
          studentPerformance.length
        )
      : 0;

    const classAvgCompletion = studentPerformance.length
      ? Math.round(
          studentPerformance.reduce((a, s) => a + s.tasks.completionRate, 0) /
          studentPerformance.length
        )
      : 0;

    const classAvgGrade = (() => {
      const graded = studentPerformance.filter(
        (s) => s.assignments.avgGrade !== null
      );
      return graded.length
        ? Math.round(
            graded.reduce((a, s) => a + s.assignments.avgGrade, 0) / graded.length
          )
        : null;
    })();

    res.status(200).json({
      success: true,
      room: {
        _id:          room._id,
        name:         room.name,
        subject:      room.subject,
        totalStudents:room.stats.totalStudents,
      },
      period:       Number(period),
      classAverages:{
        studyMinutes:    classAvgStudyMins,
        completionRate:  classAvgCompletion,
        avgGrade:        classAvgGrade,
      },
      topStudents,
      students:     studentPerformance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Individual Student Performance ───────────────────────────────────────
export const getStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = '30', roomId } = req.query;

    // Verify teacher has access to this student
    const hasAccess = await verifyTeacherStudentAccess(req.user._id, studentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student\'s data.',
      });
    }

    const since     = new Date();
    since.setDate(since.getDate() - Number(period));
    const studentObjId = new mongoose.Types.ObjectId(studentId);

    const [
      student,
      studySummary,
      dailyStudy,
      subjectBreakdown,
      taskSummary,
      recentTasks,
      assignmentSummary,
      pomodoroStats,
    ] = await Promise.all([
      User.findById(studentId).select('name email avatar lastSeen createdAt'),

      StudySession.aggregate([
        {
          $match: {
            student:   studentObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:           null,
            totalMinutes:  { $sum: '$durationMinutes' },
            totalSessions: { $sum: 1 },
            totalXP:       { $sum: '$xpEarned' },
            avgFocusScore: { $avg: '$focusScore' },
            avgDuration:   { $avg: '$durationMinutes' },
          },
        },
      ]),

      StudySession.aggregate([
        {
          $match: {
            student:   studentObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:          { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            totalMinutes: { $sum: '$durationMinutes' },
            sessionCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      StudySession.aggregate([
        {
          $match: {
            student:   studentObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:          '$subject',
            totalMinutes: { $sum: '$durationMinutes' },
            sessions:     { $sum: 1 },
          },
        },
        { $sort: { totalMinutes: -1 } },
      ]),

      Task.aggregate([
        {
          $match: {
            student:    studentObjId,
            assignedBy: req.user._id,
            ...(roomId ? { room: new mongoose.Types.ObjectId(roomId) } : {}),
          },
        },
        {
          $group: {
            _id:        '$status',
            count:      { $sum: 1 },
            totalXP:    { $sum: '$xpEarned' },
          },
        },
      ]),

      Task.find({
        student:    studentObjId,
        assignedBy: req.user._id,
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('title status priority dueDate completedAt xpEarned subject'),

      Assignment.aggregate([
        {
          $match: {
            ...(roomId ? { room: new mongoose.Types.ObjectId(roomId) } : {}),
            'submissions.student': studentObjId,
          },
        },
        { $unwind: '$submissions' },
        { $match: { 'submissions.student': studentObjId } },
        {
          $group: {
            _id:         null,
            avgGrade:    { $avg: '$submissions.grade' },
            totalSubmit: { $sum: 1 },
            lateCount:   {
              $sum: { $cond: ['$submissions.isLate', 1, 0] },
            },
            gradedCount: {
              $sum: { $cond: [{ $eq: ['$submissions.status', 'graded'] }, 1, 0] },
            },
          },
        },
      ]),

      PomodoroSession.aggregate([
        {
          $match: {
            student:   studentObjId,
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:             null,
            totalSessions:   { $sum: 1 },
            totalWorkMins:   { $sum: '$totalWorkMinutes' },
            totalCycles:     { $sum: '$completedCycles' },
          },
        },
      ]),
    ]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Task status map
    const taskStatusMap = {};
    taskSummary.forEach((t) => { taskStatusMap[t._id] = t.count; });
    const totalTasks     = taskSummary.reduce((a, t) => a + t.count, 0);
    const completedTasks = taskStatusMap['completed'] || 0;
    const totalTaskXP    = taskSummary.reduce((a, t) => a + t.totalXP, 0);

    res.status(200).json({
      success: true,
      student,
      period:  Number(period),
      study: {
        summary: studySummary[0] || {
          totalMinutes: 0, totalSessions: 0,
          totalXP: 0, avgFocusScore: null,
        },
        dailyActivity:    dailyStudy,
        subjectBreakdown,
      },
      tasks: {
        summary: {
          total:          totalTasks,
          completed:      completedTasks,
          overdue:        taskStatusMap['overdue']     || 0,
          inProgress:     taskStatusMap['in_progress'] || 0,
          todo:           taskStatusMap['todo']        || 0,
          completionRate: totalTasks
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0,
          totalXPEarned:  totalTaskXP,
        },
        recent: recentTasks,
      },
      assignments: assignmentSummary[0] || {
        avgGrade: null, totalSubmit: 0,
        lateCount: 0, gradedCount: 0,
      },
      pomodoro: pomodoroStats[0] || {
        totalSessions: 0, totalWorkMins: 0, totalCycles: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Assignment Leaderboard ────────────────────────────────────────────────
export const getAssignmentLeaderboard = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({
      _id:     roomId,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    });

    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const leaderboard = await Assignment.aggregate([
      { $match: { room: new mongoose.Types.ObjectId(roomId) } },
      { $unwind: '$submissions' },
      { $match: { 'submissions.status': 'graded' } },
      {
        $group: {
          _id:       '$submissions.student',
          avgGrade:  { $avg: '$submissions.grade' },
          submitted: { $sum: 1 },
          onTime: {
            $sum: { $cond: [{ $eq: ['$submissions.isLate', false] }, 1, 0] },
          },
        },
      },
      { $sort: { avgGrade: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'student',
        },
      },
      { $unwind: '$student' },
      {
        $project: {
          'student.name':   1,
          'student.avatar': 1,
          avgGrade:         { $round: ['$avgGrade', 1] },
          submitted:        1,
          onTime:           1,
        },
      },
    ]);

    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get At-Risk Students ─────────────────────────────────────────────────────
export const getAtRiskStudents = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { period = '14' } = req.query;

    const room = await Room.findOne({
      _id:     roomId,
      $or: [{ teacher: req.user._id }, { coTeachers: req.user._id }],
    }).populate('students.student', 'name email avatar lastSeen');

    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const since          = new Date();
    since.setDate(since.getDate() - Number(period));
    const activeStudents = room.students.filter((s) => s.isActive);
    const studentIds     = activeStudents.map((s) => s.student._id);

    const [studyActivity, overdueByStudent] = await Promise.all([
      StudySession.aggregate([
        {
          $match: {
            student:   { $in: studentIds },
            status:    'completed',
            startTime: { $gte: since },
          },
        },
        {
          $group: {
            _id:          '$student',
            totalMinutes: { $sum: '$durationMinutes' },
            lastStudied:  { $max: '$startTime' },
          },
        },
      ]),

      Task.aggregate([
        {
          $match: {
            student:    { $in: studentIds },
            assignedBy: req.user._id,
            status:     'overdue',
          },
        },
        {
          $group: {
            _id:         '$student',
            overdueCount:{ $sum: 1 },
          },
        },
      ]),
    ]);

    const studyMap   = new Map(studyActivity.map((s) => [s._id.toString(), s]));
    const overdueMap = new Map(overdueByStudent.map((s) => [s._id.toString(), s]));

    const atRisk = activeStudents
      .map((s) => {
        const sid     = s.student._id.toString();
        const study   = studyMap.get(sid)   || {};
        const overdue = overdueMap.get(sid) || {};

        const reasons = [];
        if (!study.totalMinutes || study.totalMinutes < 30) {
          reasons.push('Low study time');
        }
        if (study.lastStudied) {
          const daysSince = Math.floor(
            (new Date() - study.lastStudied) / 86400000
          );
          if (daysSince > 3) reasons.push(`Inactive for ${daysSince} days`);
        } else {
          reasons.push('No study sessions recorded');
        }
        if (overdue.overdueCount > 0) {
          reasons.push(`${overdue.overdueCount} overdue task(s)`);
        }

        return {
          student:       s.student,
          totalMinutes:  study.totalMinutes  || 0,
          lastStudied:   study.lastStudied   || null,
          overdueCount:  overdue.overdueCount|| 0,
          riskLevel:     reasons.length >= 3 ? 'high'
                       : reasons.length >= 2 ? 'medium'
                       : reasons.length >= 1 ? 'low'
                       : 'none',
          reasons,
        };
      })
      .filter((s) => s.riskLevel !== 'none')
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.riskLevel] - order[b.riskLevel];
      });

    res.status(200).json({
      success:  true,
      period:   Number(period),
      atRisk,
      summary: {
        high:   atRisk.filter((s) => s.riskLevel === 'high').length,
        medium: atRisk.filter((s) => s.riskLevel === 'medium').length,
        low:    atRisk.filter((s) => s.riskLevel === 'low').length,
        total:  atRisk.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Assignment Completion Report ─────────────────────────────────────────
export const getAssignmentReport = async (req, res) => {
  try {
    const { id } = req.params; // assignment id

    const assignment = await Assignment.findById(id)
      .populate('createdBy',          'name')
      .populate('submissions.student','name email avatar')
      .populate('submissions.gradedBy','name');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const room = await verifyTeacherRoom(assignment.room, req.user._id);
    if (!room) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Students who haven't submitted
    const submittedIds = assignment.submissions.map((s) =>
      s.student._id.toString()
    );

    const fullRoom = await Room.findById(assignment.room).populate(
      'students.student','name email avatar'
    );

    const notSubmitted = fullRoom.students
      .filter(
        (s) =>
          s.isActive && !submittedIds.includes(s.student._id.toString())
      )
      .map((s) => s.student);

    const gradeDistribution = {
      'A (90-100)': 0,
      'B (75-89)':  0,
      'C (60-74)':  0,
      'D (40-59)':  0,
      'F (<40)':    0,
    };

    assignment.submissions.forEach((s) => {
      if (s.grade === null) return;
      if (s.grade >= 90)      gradeDistribution['A (90-100)'] += 1;
      else if (s.grade >= 75) gradeDistribution['B (75-89)']  += 1;
      else if (s.grade >= 60) gradeDistribution['C (60-74)']  += 1;
      else if (s.grade >= 40) gradeDistribution['D (40-59)']  += 1;
      else                    gradeDistribution['F (<40)']     += 1;
    });

    res.status(200).json({
      success: true,
      assignment: {
        _id:         assignment._id,
        title:       assignment.title,
        dueDate:     assignment.dueDate,
        maxScore:    assignment.maxScore,
        passingScore:assignment.passingScore,
        createdBy:   assignment.createdBy,
        stats:       assignment.stats,
      },
      submissions:       assignment.submissions,
      notSubmitted,
      gradeDistribution,
      submissionRate: assignment.stats.totalAssigned
        ? Math.round(
            (assignment.stats.totalSubmitted / assignment.stats.totalAssigned) * 100
          )
        : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};