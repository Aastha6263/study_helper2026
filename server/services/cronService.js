import cron            from 'node-cron';
import mongoose        from 'mongoose';
import User            from '../models/User.js';
import Task            from '../models/Task.js';
import StudySession    from '../models/StudySession.js';
import Assignment      from '../models/Assignment.js';
import PomodoroSession from '../models/PomodoroSession.js';
import ParentChildLink from '../models/ParentChildLink.js';
import ParentReport    from '../models/ParentReport.js';
import {
  sendOverdueTasksEmail,
  sendWeeklyDigestEmail,
  sendMonthlyReportEmail,
  sendInactivityAlertEmail,
} from './emailService.js';
import { emitNotification } from '../socket/socketHandler.js';

// io instance injected from server.js
let _io = null;
export const setIo = (io) => { _io = io; };

// ─── Helper: get date N days ago ──────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Helper: month name ───────────────────────────────────────────────────────
const monthName = (date) =>
  date.toLocaleString('default', { month: 'long' });

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 1 — Mark overdue tasks  (every hour)
// ══════════════════════════════════════════════════════════════════════════════
const markOverdueTasks = async () => {
  try {
    const result = await Task.updateMany(
      {
        status:  { $nin: ['completed', 'cancelled', 'overdue'] },
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Cron] markOverdue: ${result.modifiedCount} tasks marked overdue.`);
    }
  } catch (err) {
    console.error('[Cron] markOverdue error:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 2 — Overdue task reminders  (daily at 08:00)
// ══════════════════════════════════════════════════════════════════════════════
const sendOverdueReminders = async () => {
  console.log('[Cron] sendOverdueReminders: started');
  try {
    // Find students with overdue tasks whose reminder hasn't been sent today
    const overdueTasks = await Task.aggregate([
      {
        $match: {
          status:         'overdue',
          isReminderSent: false,
        },
      },
      {
        $group: {
          _id:   '$student',
          tasks: {
            $push: {
              _id:      '$_id',
              title:    '$title',
              subject:  '$subject',
              dueDate:  '$dueDate',
              priority: '$priority',
            },
          },
        },
      },
    ]);

    for (const entry of overdueTasks) {
      const student = await User.findById(entry._id).select('name email notificationPrefs');
      if (!student) continue;

      // Real-time socket notification
      if (_io) {
        emitNotification(_io, student._id.toString(), {
          type:     'overdue_tasks',
          title:    'Overdue Tasks',
          message:  `You have ${entry.tasks.length} overdue task(s). Get back on track!`,
          priority: 'high',
          meta:     { tasks: entry.tasks },
        });
      }

      // Email notification
      if (student.notificationPrefs?.email) {
        await sendOverdueTasksEmail(student, entry.tasks);
      }

      // Mark as reminded
      await Task.updateMany(
        { _id: { $in: entry.tasks.map((t) => t._id) } },
        { $set: { isReminderSent: true } }
      );
    }

    console.log(`[Cron] sendOverdueReminders: processed ${overdueTasks.length} students.`);
  } catch (err) {
    console.error('[Cron] sendOverdueReminders error:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 3 — Upcoming task reminder  (daily at 07:00)
//          Reminds students of tasks due in the next 24 h
// ══════════════════════════════════════════════════════════════════════════════
const sendUpcomingReminders = async () => {
  console.log('[Cron] sendUpcomingReminders: started');
  try {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const upcoming = await Task.find({
      status:      { $in: ['todo', 'in_progress'] },
      dueDate:     { $gte: new Date(), $lte: in24h },
      reminderAt:  { $lte: new Date() },
      isReminderSent: false,
    }).populate('student', 'name email notificationPrefs');

    for (const task of upcoming) {
      if (!task.student) continue;

      if (_io) {
        emitNotification(_io, task.student._id.toString(), {
          type:     'upcoming_task',
          title:    'Task Due Soon',
          message:  `"${task.title}" is due in less than 24 hours!`,
          link:     `/tasks/${task._id}`,
          priority: 'high',
          meta:     { taskId: task._id },
        });
      }

      task.isReminderSent = true;
      await task.save({ validateBeforeSave: false });
    }

    console.log(`[Cron] sendUpcomingReminders: ${upcoming.length} reminders sent.`);
  } catch (err) {
    console.error('[Cron] sendUpcomingReminders error:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 4 — Weekly digest email  (every Sunday at 18:00)
// ══════════════════════════════════════════════════════════════════════════════
const sendWeeklyDigests = async () => {
  console.log('[Cron] sendWeeklyDigests: started');
  try {
    const since     = daysAgo(7);
    const students  = await User.find({ role: 'student', isActive: true })
                                .select('name email notificationPrefs');

    for (const student of students) {
      if (!student.notificationPrefs?.email) continue;

      const studentId = new mongoose.Types.ObjectId(student._id);

      const [studyStats, taskStats, subjectBreakdown] = await Promise.all([
        StudySession.aggregate([
          {
            $match: {
              student:   studentId,
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
            },
          },
        ]),

        Task.aggregate([
          { $match: { student: studentId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        StudySession.aggregate([
          {
            $match: {
              student:   studentId,
              status:    'completed',
              startTime: { $gte: since },
            },
          },
          {
            $group: {
              _id:     '$subject',
              minutes: { $sum: '$durationMinutes' },
            },
          },
          { $sort: { minutes: -1 } },
          { $limit: 5 },
        ]),
      ]);

      const taskMap      = {};
      taskStats.forEach((t) => { taskMap[t._id] = t.count; });
      const summary      = studyStats[0] || { totalMinutes: 0, totalSessions: 0, totalXP: 0 };
      const completedT   = taskMap['completed'] || 0;
      const overdueT     = taskMap['overdue']   || 0;
      const totalT       = Object.values(taskMap).reduce((a, b) => a + b, 0);

      // Build highlights and concerns
      const highlights = [];
      const concerns   = [];

      if (summary.totalMinutes > 0) {
        highlights.push(`Studied for ${summary.totalMinutes} minutes this week.`);
      }
      if (completedT > 0) {
        highlights.push(`Completed ${completedT} task(s).`);
      }
      if (summary.totalXP > 0) {
        highlights.push(`Earned ${summary.totalXP} XP.`);
      }
      if (summary.totalMinutes === 0) {
        concerns.push('No study sessions recorded this week.');
      }
      if (overdueT > 0) {
        concerns.push(`${overdueT} overdue task(s) need attention.`);
      }
      if (totalT > 0 && completedT / totalT < 0.3) {
        concerns.push('Task completion rate is below 30% — try breaking tasks into smaller steps.');
      }

      await sendWeeklyDigestEmail({
        user:        student,
        stats:       { ...summary, completedTasks: completedT },
        topSubjects: subjectBreakdown.map((s) => ({ subject: s._id, minutes: s.minutes })),
        highlights,
        concerns,
      });
    }

    console.log(`[Cron] sendWeeklyDigests: sent to ${students.length} students.`);
  } catch (err) {
    console.error('[Cron] sendWeeklyDigests error:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 5 — Monthly report generator + email to parents  (1st of every month, 09:00)
// ══════════════════════════════════════════════════════════════════════════════
const generateAndSendMonthlyReports = async () => {
  console.log('[Cron] monthlyReports: started');
  try {
    const now        = new Date();
    const year       = now.getFullYear();
    const month      = monthName(now);

    // Period = previous calendar month
    const startDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // All active parent ↔ child links
    const links = await ParentChildLink.find({ status: 'accepted' })
      .populate('parent', 'name email notificationPrefs')
      .populate('child',  'name email _id');

    for (const link of links) {
      if (!link.parent || !link.child) continue;

      const childObjId = new mongoose.Types.ObjectId(link.child._id);

      const [studyData, taskData, assignmentData, pomodoroData, dailyActivity, subjectBreakdown] =
        await Promise.all([
          StudySession.aggregate([
            {
              $match: {
                student:   childObjId,
                status:    'completed',
                startTime: { $gte: startDate, $lte: endDate },
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
                createdAt: { $gte: startDate, $lte: endDate },
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
                'submissions.submittedAt': { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id:        null,
                avgGrade:   { $avg: '$submissions.grade' },
                submitted:  { $sum: 1 },
                lateCount:  { $sum: { $cond: ['$submissions.isLate', 1, 0] } },
                passCount:  { $sum: { $cond: [{ $gte: ['$submissions.grade', 40] }, 1, 0] } },
              },
            },
          ]),

          PomodoroSession.aggregate([
            {
              $match: {
                student:   childObjId,
                status:    'completed',
                startTime: { $gte: startDate, $lte: endDate },
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
                startTime: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id:      { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                minutes:  { $sum: '$durationMinutes' },
                sessions: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),

          StudySession.aggregate([
            {
              $match: {
                student:   childObjId,
                status:    'completed',
                startTime: { $gte: startDate, $lte: endDate },
              },
            },
            { $group: { _id: '$subject', minutes: { $sum: '$durationMinutes' } } },
            { $sort: { minutes: -1 } },
            { $limit: 5 },
          ]),
        ]);

      // ── Build snapshot ───────────────────────────────────────────────────
      const study    = studyData[0]    || {};
      const asgn     = assignmentData[0] || {};
      const pom      = pomodoroData[0] || {};
      const taskMap  = {};
      taskData.forEach((t) => { taskMap[t._id] = { count: t.count, xp: t.xpEarned }; });

      const totalTasks   = taskData.reduce((a, t) => a + t.count, 0);
      const completedT   = taskMap['completed']?.count || 0;
      const totalXP      = taskData.reduce((a, t) => a + t.xpEarned, 0);
      const days         = Math.round((endDate - startDate) / 86400000);
      const activeDays   = dailyActivity.length;

      // ── Auto highlights and concerns ─────────────────────────────────────
      const highlights = [];
      const concerns   = [];

      if ((study.totalMinutes || 0) > 0) {
        highlights.push(`Studied for ${study.totalMinutes} minutes across ${study.totalSessions} session(s).`);
      }
      if (completedT > 0) {
        highlights.push(`Completed ${completedT} task(s) this month.`);
      }
      if (asgn.avgGrade >= 75) {
        highlights.push(`Strong assignment average: ${Math.round(asgn.avgGrade)}%.`);
      }
      if ((pom.totalCycles || 0) >= 10) {
        highlights.push(`Completed ${pom.totalCycles} Pomodoro cycles — great focus!`);
      }
      if (activeDays >= 20) {
        highlights.push(`Studied on ${activeDays} days this month — excellent consistency!`);
      }

      if (activeDays < 5) {
        concerns.push(`Only studied on ${activeDays} out of ${days} days.`);
      }
      if ((taskMap['overdue']?.count || 0) > 2) {
        concerns.push(`${taskMap['overdue'].count} overdue tasks detected.`);
      }
      if (asgn.lateCount > 0) {
        concerns.push(`${asgn.lateCount} late submission(s).`);
      }
      if (asgn.avgGrade !== null && asgn.avgGrade !== undefined && asgn.avgGrade < 40) {
        concerns.push(`Assignment average is below passing: ${Math.round(asgn.avgGrade)}%.`);
      }
      if ((study.totalMinutes || 0) === 0) {
        concerns.push('No study sessions recorded this month.');
      }

      const snapshot = {
        study: {
          totalMinutes:    study.totalMinutes    || 0,
          totalSessions:   study.totalSessions   || 0,
          avgDailyMinutes: Math.round((study.totalMinutes || 0) / days),
          avgFocusScore:   study.avgFocusScore ? Math.round(study.avgFocusScore) : null,
          topSubjects:     subjectBreakdown.map((s) => ({ subject: s._id, minutes: s.minutes })),
          activeDays,
          longestStreak:   0,
        },
        tasks: {
          total:          totalTasks,
          completed:      completedT,
          overdue:        taskMap['overdue']?.count || 0,
          completionRate: totalTasks ? Math.round((completedT / totalTasks) * 100) : 0,
          xpEarned:       totalXP,
        },
        assignments: {
          submitted:  asgn.submitted  || 0,
          avgGrade:   asgn.avgGrade   ? Math.round(asgn.avgGrade) : null,
          lateCount:  asgn.lateCount  || 0,
          passCount:  asgn.passCount  || 0,
        },
        pomodoro: {
          totalSessions:  pom.totalSessions || 0,
          totalCycles:    pom.totalCycles   || 0,
          totalWorkMins:  pom.totalWorkMins || 0,
        },
        highlights,
        concerns,
        dailyActivity: dailyActivity.map((d) => ({
          date:     d._id,
          minutes:  d.minutes,
          sessions: d.sessions,
        })),
        childId: link.child._id,
      };

      // ── Save report to DB ────────────────────────────────────────────────
      await ParentReport.create({
        parent:          link.parent._id,
        child:           link.child._id,
        reportType:      'monthly',
        period:          { startDate, endDate },
        snapshot,
        isAutoGenerated: true,
      });

      // ── Send email to parent ─────────────────────────────────────────────
      if (link.parent.notificationPrefs?.email) {
        await sendMonthlyReportEmail({
          parent:   link.parent,
          child:    link.child,
          month,
          year,
          snapshot,
        });
      }

      // ── Real-time notification to parent ─────────────────────────────────
      if (_io) {
        emitNotification(_io, link.parent._id.toString(), {
          type:     'monthly_report',
          title:    'Monthly Report Ready',
          message:  `${link.child.name}'s ${month} ${year} report is available.`,
          link:     `/parent/reports`,
          priority: 'medium',
          meta:     { childId: link.child._id },
        });
      }

      console.log(`[Cron] monthlyReport generated: parent=${link.parent.email}, child=${link.child.name}`);
    }

    console.log(`[Cron] monthlyReports: done. Processed ${links.length} links.`);
  } catch (err) {
    console.error('[Cron] monthlyReports error:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 6 — Parent inactivity alerts  (daily at 09:30)
// ══════════════════════════════════════════════════════════════════════════════
const sendParentInactivityAlerts = async () => {
  console.log('[Cron] inactivityAlerts: started');
  try {
    const links = await ParentChildLink.find({ status: 'accepted' })
      .populate('parent', 'name email notificationPrefs')
      .populate('child',  'name email _id');

    for (const link of links) {
      if (!link.parent || !link.child) continue;

      const thresholdDays = link.alerts?.inactivityDays || 2;
      const since         = daysAgo(thresholdDays);

      const recentSession = await StudySession.findOne({
        student:   link.child._id,
        status:    'completed',
        startTime: { $gte: since },
      });

      if (recentSession) continue; // active — no alert needed

      // Find last session to compute exact days
      const lastSession = await StudySession.findOne({
        student: link.child._id,
        status:  'completed',
      }).sort({ startTime: -1 });

      const daysSince = lastSession
        ? Math.floor((new Date() - lastSession.startTime) / 86400000)
        : thresholdDays;

      // Socket notification
      if (_io) {
        emitNotification(_io, link.parent._id.toString(), {
          type:     'child_inactive',
          title:    'Inactivity Alert',
          message:  `${link.child.name} hasn't studied in ${daysSince} day(s).`,
          link:     `/parent/child/${link.child._id}/analytics`,
          priority: 'medium',
          meta:     { childId: link.child._id, daysSince },
        });
      }

      // Email
      if (link.parent.notificationPrefs?.email) {
        await sendInactivityAlertEmail({
          parent:     link.parent,
          child:      link.child,
          daysSince,
        });
      }
    }

    console.log('[Cron] inactivityAlerts: done.');
  } catch (err) {
    console.error('[Cron] inactivityAlerts error:', err.message);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  JOB 7 — Abandon stale study sessions  (every 30 minutes)
//          If a session has been "active" for > 4 hours, mark it abandoned
// ══════════════════════════════════════════════════════════════════════════════
const abandonStaleSessions = async () => {
  try {
    const staleThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const result = await StudySession.updateMany(
      {
        status:    'active',
        startTime: { $lt: staleThreshold },
      },
      {
        $set: {
          status:  'abandoned',
          endTime: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Cron] staleSessions: abandoned ${result.modifiedCount} stale sessions.`);
    }

    // Same for pomodoro
    await PomodoroSession.updateMany(
      {
        status:    'active',
        startTime: { $lt: staleThreshold },
      },
      { $set: { status: 'abandoned', endTime: new Date() } }
    );
  } catch (err) {
    console.error('[Cron] staleSessions error:', err.message);
  }
};

// ─── Register all cron jobs ───────────────────────────────────────────────────
export const registerCronJobs = () => {
  // Every hour: mark overdue tasks
  cron.schedule('0 * * * *', markOverdueTasks);

  // Every day at 8 AM: send overdue reminders
  cron.schedule('0 8 * * *', sendOverdueReminders);

  // Every day at 6 PM: send upcoming reminders
  cron.schedule('0 18 * * *', sendUpcomingReminders);

  // Every Monday at 9 AM: send weekly digests
  cron.schedule('0 9 * * 1', sendWeeklyDigests);

  // First day of month at 10 AM: send monthly reports
  cron.schedule('0 10 1 * *', generateAndSendMonthlyReports);

  // Every day at 7 PM: send parent inactivity alerts
  cron.schedule('0 19 * * *', sendParentInactivityAlerts);

  // Every 30 minutes: abandon stale sessions
  cron.schedule('*/30 * * * *', abandonStaleSessions);

  console.log('[Cron] All cron jobs registered.');
};

// ══════