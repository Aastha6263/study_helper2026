import Notification from '../models/Notification.js';
import User         from '../models/User.js';
import {
  sendPushNotification,
  sendMulticastPush,
}                   from '../config/firebase.js';
import {
  sendTaskAssignedEmail,
  sendAssignmentCreatedEmail,
  sendAssignmentGradedEmail,
}                   from './emailService.js';
import { emitNotification } from '../socket/socketHandler.js';

// ── Shared io reference ───────────────────────────────────────────────────────
let _io = null;
export const setNotificationIo = (io) => { _io = io; };

// ══════════════════════════════════════════════════════════════════════════════
//  CORE — create + deliver a notification
// ══════════════════════════════════════════════════════════════════════════════

/**
 * createNotification
 * Creates a Notification document and delivers it across
 * in-app (Socket.IO), email, and push (Firebase) channels
 * based on the recipient's preferences.
 */
export const createNotification = async ({
  recipientId,
  senderId  = null,
  type,
  title,
  message,
  link      = null,
  priority  = 'medium',
  meta      = {},
  channels  = { inApp: true, email: false, push: false },
  expiresIn = null, // hours
}) => {
  try {
    const recipient = await User.findById(recipientId)
      .select('name email notificationPrefs fcmToken');

    if (!recipient) {
      console.warn(`[NotifService] recipient not found: ${recipientId}`);
      return null;
    }

    // Respect per-user preferences
    const prefs        = recipient.notificationPrefs || {};
    const shouldEmail  = channels.email  && prefs.email;
    const shouldPush   = channels.push   && prefs.push  && !!recipient.fcmToken;
    const shouldInApp  = channels.inApp  && (prefs.inApp !== false);

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
      : null;

    // ── Persist to DB ────────────────────────────────────────────────────────
    const notification = await Notification.create({
      recipient: recipientId,
      sender:    senderId,
      type,
      title,
      message,
      link,
      priority,
      meta,
      expiresAt,
      channels: {
        inApp:  shouldInApp,
        email:  shouldEmail,
        push:   shouldPush,
      },
      deliveryStatus: {
        inApp: { sent: false },
        email: { sent: false },
        push:  { sent: false },
      },
    });

    // ── In-app (Socket.IO) ───────────────────────────────────────────────────
    if (shouldInApp && _io) {
      emitNotification(_io, recipientId.toString(), {
        id:        notification._id,
        type,
        title,
        message,
        link,
        priority,
        meta,
        createdAt: notification.createdAt,
      });
      notification.deliveryStatus.inApp = { sent: true, sentAt: new Date() };
    }

    // ── Push (Firebase) ──────────────────────────────────────────────────────
    if (shouldPush) {
      const pushResult = await sendPushNotification({
        fcmToken: recipient.fcmToken,
        title,
        body:     message,
        data:     { type, link: link || '', ...meta },
      });

      notification.deliveryStatus.push = {
        sent:   pushResult.success,
        sentAt: pushResult.success ? new Date() : null,
      };

      // Remove invalid FCM token
      if (pushResult.shouldDelete) {
        await User.findByIdAndUpdate(recipientId, { $unset: { fcmToken: '' } });
      }
    }

    // ── Save delivery status updates ─────────────────────────────────────────
    await notification.save({ validateBeforeSave: false });

    return notification;
  } catch (err) {
    console.error('[NotifService] createNotification error:', err.message);
    return null;
  }
};

// ── Bulk create for multiple recipients ───────────────────────────────────────
export const createBulkNotifications = async (recipientIds, payload) => {
  const results = await Promise.allSettled(
    recipientIds.map((id) => createNotification({ ...payload, recipientId: id }))
  );

  const created = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  const failed  = results.length - created;
  console.log(`[NotifService] bulk: ${created} created, ${failed} failed.`);
  return { created, failed };
};

// ══════════════════════════════════════════════════════════════════════════════
//  TYPED NOTIFICATION HELPERS
//  Each helper calls createNotification + any extra channel (email/push)
// ══════════════════════════════════════════════════════════════════════════════

// ── Task assigned ─────────────────────────────────────────────────────────────
export const notifyTaskAssigned = async ({ student, teacher, task, room }) => {
  const notif = await createNotification({
    recipientId: student._id,
    senderId:    teacher._id,
    type:        'task_assigned',
    title:       'New Task Assigned',
    message:     `${teacher.name} assigned you: "${task.title}"`,
    link:        `/tasks/${task._id}`,
    priority:    task.priority || 'medium',
    meta:        { taskId: task._id, roomId: room?._id },
    channels:    { inApp: true, email: true, push: true },
  });

  // Also send templated email
  await sendTaskAssignedEmail({ student, teacher, task, room });

  return notif;
};

// ── Task overdue ──────────────────────────────────────────────────────────────
export const notifyTaskOverdue = async ({ student, tasks }) => {
  return createNotification({
    recipientId: student._id,
    type:        'task_overdue',
    title:       'Overdue Tasks',
    message:     `You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}. Act now!`,
    link:        '/tasks?status=overdue',
    priority:    'high',
    meta:        { taskIds: tasks.map((t) => t._id) },
    channels:    { inApp: true, email: true, push: true },
  });
};

// ── Task upcoming ─────────────────────────────────────────────────────────────
export const notifyTaskUpcoming = async ({ student, task }) => {
  return createNotification({
    recipientId: student._id,
    type:        'task_upcoming',
    title:       'Task Due Soon',
    message:     `"${task.title}" is due in less than 24 hours!`,
    link:        `/tasks/${task._id}`,
    priority:    'high',
    meta:        { taskId: task._id },
    channels:    { inApp: true, email: false, push: true },
    expiresIn:   24,
  });
};

// ── Assignment created ────────────────────────────────────────────────────────
export const notifyAssignmentCreated = async ({ students, teacher, assignment, room }) => {
  const results = await createBulkNotifications(
    students.map((s) => s._id),
    {
      senderId: teacher._id,
      type:     'assignment_created',
      title:    'New Assignment',
      message:  `${teacher.name} posted "${assignment.title}" — due ${new Date(assignment.dueDate).toLocaleDateString()}`,
      link:     `/assignments/${assignment._id}`,
      priority: assignment.priority || 'medium',
      meta:     { assignmentId: assignment._id, roomId: room._id },
      channels: { inApp: true, email: true, push: true },
    }
  );

  // Send individual emails
  await Promise.allSettled(
    students.map((student) =>
      sendAssignmentCreatedEmail({ student, teacher, assignment, room })
    )
  );

  return results;
};

// ── Assignment submitted ──────────────────────────────────────────────────────
export const notifyAssignmentSubmitted = async ({ teacher, student, assignment }) => {
  return createNotification({
    recipientId: teacher._id,
    senderId:    student._id,
    type:        'assignment_submitted',
    title:       'New Submission',
    message:     `${student.name} submitted "${assignment.title}".`,
    link:        `/assignments/${assignment._id}`,
    priority:    'medium',
    meta:        { assignmentId: assignment._id, studentId: student._id },
    channels:    { inApp: true, email: false, push: true },
  });
};

// ── Assignment graded ─────────────────────────────────────────────────────────
export const notifyAssignmentGraded = async ({ student, teacher, assignment, grade, feedback }) => {
  const notif = await createNotification({
    recipientId: student._id,
    senderId:    teacher._id,
    type:        'assignment_graded',
    title:       'Assignment Graded',
    message:     `Your submission for "${assignment.title}" was graded: ${grade}/${assignment.maxScore}`,
    link:        `/assignments/${assignment._id}`,
    priority:    'medium',
    meta:        { assignmentId: assignment._id, grade, feedback },
    channels:    { inApp: true, email: true, push: true },
  });

  await sendAssignmentGradedEmail({ student, teacher, assignment, grade, feedback });

  return notif;
};

// ── Room announcement ─────────────────────────────────────────────────────────
export const notifyRoomAnnouncement = async ({ room, teacher, studentIds, message }) => {
  return createBulkNotifications(studentIds, {
    senderId: teacher._id,
    type:     'room_announcement',
    title:    `Announcement — ${room.name}`,
    message,
    link:     `/rooms/${room._id}`,
    priority: 'medium',
    meta:     { roomId: room._id },
    channels: { inApp: true, email: false, push: true },
  });
};

// ── Parent link request ───────────────────────────────────────────────────────
export const notifyParentLinkRequest = async ({ child, parent, linkId }) => {
  return createNotification({
    recipientId: child._id,
    senderId:    parent._id,
    type:        'parent_link_request',
    title:       'Parent Link Request',
    message:     `${parent.name} wants to link to your account to monitor your progress.`,
    link:        `/settings/links`,
    priority:    'high',
    meta:        { parentId: parent._id, linkId },
    channels:    { inApp: true, email: true, push: true },
  });
};

// ── Parent link accepted ──────────────────────────────────────────────────────
export const notifyParentLinkAccepted = async ({ parent, child, linkId }) => {
  return createNotification({
    recipientId: parent._id,
    senderId:    child._id,
    type:        'parent_link_accepted',
    title:       'Link Request Accepted',
    message:     `${child.name} accepted your link request. You can now view their progress.`,
    link:        `/parent/child/${child._id}/analytics`,
    priority:    'medium',
    meta:        { childId: child._id, linkId },
    channels:    { inApp: true, email: true, push: false },
  });
};

// ── XP / Level-up ────────────────────────────────────────────────────────────
export const notifyXpEarned = async ({ student, xpAmount, reason, taskId }) => {
  return createNotification({
    recipientId: student._id,
    type:        'xp_earned',
    title:       'XP Earned!',
    message:     `+${xpAmount} XP — ${reason}`,
    link:        taskId ? `/tasks/${taskId}` : '/dashboard',
    priority:    'low',
    meta:        { xpAmount, reason, taskId },
    channels:    { inApp: true, email: false, push: false },
    expiresIn:   72,
  });
};

export const notifyLevelUp = async ({ student, newLevel, stageName }) => {
  return createNotification({
    recipientId: student._id,
    type:        'level_up',
    title:       '🎉 Level Up!',
    message:     `You reached Level ${newLevel} — ${stageName}! Keep going!`,
    link:        '/dashboard',
    priority:    'low',
    meta:        { newLevel, stageName },
    channels:    { inApp: true, email: false, push: true },
    expiresIn:   168, // 7 days
  });
};

// ── Study streak ──────────────────────────────────────────────────────────────
export const notifyStreak = async ({ student, streakDays }) => {
  const milestones = [3, 7, 14, 30, 60, 90, 100, 365];
  if (!milestones.includes(streakDays)) return null;

  return createNotification({
    recipientId: student._id,
    type:        'study_streak',
    title:       `🔥 ${streakDays}-Day Streak!`,
    message:     `You've studied ${streakDays} days in a row. Amazing consistency!`,
    link:        '/analytics',
    priority:    'low',
    meta:        { streakDays },
    channels:    { inApp: true, email: false, push: true },
    expiresIn:   72,
  });
};

// ── Monthly report ready (to parent) ─────────────────────────────────────────
export const notifyMonthlyReport = async ({ parent, child, reportId }) => {
  return createNotification({
    recipientId: parent._id,
    type:        'monthly_report',
    title:       'Monthly Report Ready',
    message:     `${child.name}'s monthly study report is available.`,
    link:        `/parent/reports/${reportId}`,
    priority:    'medium',
    meta:        { childId: child._id, reportId },
    channels:    { inApp: true, email: false, push: true },
  });
};

// ── System notification (admin broadcast) ─────────────────────────────────────
export const notifySystem = async ({ recipientId, title, message, link }) => {
  return createNotification({
    recipientId,
    type:     'system',
    title,
    message,
    link:     link || '/dashboard',
    priority: 'low',
    channels: { inApp: true, email: false, push: false },
    expiresIn:168,
  });
};