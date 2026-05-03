import transporter            from '../config/nodemailer.js';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  overdueTasksTemplate,
  taskAssignedTemplate,
  assignmentCreatedTemplate,
  assignmentGradedTemplate,
  weeklyDigestTemplate,
  monthlyReportTemplate,
  inactivityAlertTemplate,
  welcomeTemplate,
}                             from './emailTemplates.js';

const FROM = `"StudySync" <${process.env.EMAIL_USER}>`;

// ── Generic send wrapper ──────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[Mailer] sent "${subject}" → ${to} | id: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] failed "${subject}" → ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ── Email verification ────────────────────────────────────────────────────────
export const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  return sendMail({
    to:      user.email,
    subject: 'Verify your StudySync email address',
    html:    emailVerificationTemplate({ name: user.name, verifyUrl }),
  });
};

// ── Password reset ────────────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  return sendMail({
    to:      user.email,
    subject: 'Reset your StudySync password',
    html:    passwordResetTemplate({ name: user.name, resetUrl }),
  });
};

// ── Welcome ───────────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (user) => {
  return sendMail({
    to:      user.email,
    subject: 'Welcome to StudySync 🎉',
    html:    welcomeTemplate({ name: user.name, role: user.role }),
  });
};

// ── Overdue task reminder ─────────────────────────────────────────────────────
export const sendOverdueTasksEmail = async (user, tasks) => {
  return sendMail({
    to:      user.email,
    subject: `⏰ You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} — StudySync`,
    html:    overdueTasksTemplate({ name: user.name, tasks }),
  });
};

// ── Task assigned ─────────────────────────────────────────────────────────────
export const sendTaskAssignedEmail = async ({ student, teacher, task, room }) => {
  return sendMail({
    to:      student.email,
    subject: `📋 New task assigned: "${task.title}"`,
    html:    taskAssignedTemplate({
      studentName: student.name,
      teacherName: teacher.name,
      task,
      roomName:    room?.name || null,
    }),
  });
};

// ── Assignment created ────────────────────────────────────────────────────────
export const sendAssignmentCreatedEmail = async ({ student, teacher, assignment, room }) => {
  return sendMail({
    to:      student.email,
    subject: `📝 New assignment: "${assignment.title}" — due ${new Date(assignment.dueDate).toLocaleDateString()}`,
    html:    assignmentCreatedTemplate({
      studentName: student.name,
      teacherName: teacher.name,
      assignment,
      roomName:    room?.name || '',
    }),
  });
};

// ── Assignment graded ─────────────────────────────────────────────────────────
export const sendAssignmentGradedEmail = async ({ student, teacher, assignment, grade, feedback }) => {
  return sendMail({
    to:      student.email,
    subject: `🎓 Your assignment "${assignment.title}" has been graded`,
    html:    assignmentGradedTemplate({
      studentName: student.name,
      teacherName: teacher.name,
      assignment,
      grade,
      feedback,
    }),
  });
};

// ── Weekly digest ─────────────────────────────────────────────────────────────
export const sendWeeklyDigestEmail = async ({ user, stats, topSubjects, highlights, concerns }) => {
  const now   = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  return sendMail({
    to:      user.email,
    subject: `📊 Your StudySync weekly recap — ${month}`,
    html:    weeklyDigestTemplate({
      name: user.name,
      stats,
      topSubjects,
      highlights,
      concerns,
    }),
  });
};

// ── Monthly report (to parent) ────────────────────────────────────────────────
export const sendMonthlyReportEmail = async ({ parent, child, month, year, snapshot }) => {
  return sendMail({
    to:      parent.email,
    subject: `📚 ${child.name}'s ${month} ${year} Study Report — StudySync`,
    html:    monthlyReportTemplate({
      parentName: parent.name,
      childName:  child.name,
      month,
      year,
      snapshot: { ...snapshot, childId: child._id },
    }),
  });
};

// ── Inactivity alert (to parent) ──────────────────────────────────────────────
export const sendInactivityAlertEmail = async ({ parent, child, daysSince }) => {
  return sendMail({
    to:      parent.email,
    subject: `😟 ${child.name} hasn't studied in ${daysSince} days — StudySync`,
    html:    inactivityAlertTemplate({
      parentName: parent.name,
      childName:  child.name,
      daysSince,
      childId:    child._id,
    }),
  });
};

// ── Bulk send (for assignment notifications) ──────────────────────────────────
export const sendBulkEmails = async (emailJobs) => {
  const results = await Promise.allSettled(emailJobs.map(sendMail));
  const sent    = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failed  = results.length - sent;
  console.log(`[Mailer] bulk: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};