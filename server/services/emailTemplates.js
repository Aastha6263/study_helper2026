// ── Base layout wrapper ───────────────────────────────────────────────────────
const baseLayout = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>StudySync</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   Helvetica, Arial, sans-serif;
      background-color: #0f0f1a;
      color: #e2e2ee;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    .card {
      background: #1c1c26;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #2a2a38;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span { color: #a5b4fc; }
    .header-sub {
      color: #c7d2fe;
      font-size: 13px;
      margin-top: 4px;
    }
    .body { padding: 32px; }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #f0f0f8;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      color: #9999b8;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .stat-card {
      background: #111117;
      border: 1px solid #2a2a38;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #818cf8;
    }
    .stat-label {
      font-size: 11px;
      color: #6b6b8a;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #6b6b8a;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 24px 0 12px;
      border-top: 1px solid #2a2a38;
      padding-top: 20px;
    }
    .highlight-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #c2c2d9;
    }
    .dot-green  { color: #4ade80; flex-shrink: 0; }
    .dot-red    { color: #f87171; flex-shrink: 0; }
    .dot-yellow { color: #fbbf24; flex-shrink: 0; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 8px;
      margin: 24px 0 8px;
    }
    .btn-center { text-align: center; margin: 24px 0; }
    .alert-box {
      background: #2a1515;
      border: 1px solid #7f1d1d;
      border-radius: 10px;
      padding: 16px;
      margin: 16px 0;
    }
    .alert-box .alert-title {
      font-size: 13px;
      font-weight: 700;
      color: #f87171;
      margin-bottom: 8px;
    }
    .alert-box .alert-text {
      font-size: 13px;
      color: #fca5a5;
      line-height: 1.6;
    }
    .success-box {
      background: #0d2b1c;
      border: 1px solid #14532d;
      border-radius: 10px;
      padding: 16px;
      margin: 16px 0;
    }
    .progress-bar-wrap {
      background: #111117;
      border-radius: 99px;
      height: 8px;
      overflow: hidden;
      margin-top: 6px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
    }
    .subject-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .subject-name { font-size: 13px; color: #c2c2d9; }
    .subject-mins { font-size: 12px; color: #6b6b8a; }
    .footer {
      text-align: center;
      padding: 24px 32px;
      font-size: 11px;
      color: #3d3d52;
      border-top: 1px solid #2a2a38;
    }
    .divider {
      border: none;
      border-top: 1px solid #2a2a38;
      margin: 20px 0;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
    }
    .badge-high   { background:#2a1515; color:#f87171; }
    .badge-medium { background:#2a2000; color:#fbbf24; }
    .badge-low    { background:#0d2b1c; color:#4ade80; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">Study<span>Sync</span></div>
        <div class="header-sub">Empowering every learner</div>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} StudySync. All rights reserved.<br/>
        You're receiving this because you have a StudySync account.<br/>
        <a href="${process.env.CLIENT_URL}/settings/notifications"
           style="color:#4f46e5;text-decoration:none;">Manage email preferences</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ── Email verification ────────────────────────────────────────────────────────
export const emailVerificationTemplate = ({ name, verifyUrl }) =>
  baseLayout(`
    <div class="greeting">Verify your email, ${name} 👋</div>
    <p class="text">
      Welcome to StudySync! Click the button below to verify your
      email address and activate your account.
    </p>
    <div class="btn-center">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>
    <p class="text" style="font-size:12px;text-align:center;">
      This link expires in 24 hours. If you didn't create an account,
      you can safely ignore this email.
    </p>
  `, 'Confirm your StudySync email address');

// ── Password reset ────────────────────────────────────────────────────────────
export const passwordResetTemplate = ({ name, resetUrl }) =>
  baseLayout(`
    <div class="greeting">Reset your password</div>
    <p class="text">Hi ${name},</p>
    <p class="text">
      We received a request to reset your StudySync password.
      Click below to choose a new one. This link expires in <strong style="color:#f0f0f8;">30 minutes</strong>.
    </p>
    <div class="btn-center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="alert-box">
      <div class="alert-title">⚠ Didn't request this?</div>
      <div class="alert-text">
        If you didn't request a password reset, ignore this email.
        Your password won't change unless you click the link above.
      </div>
    </div>
  `, 'Reset your StudySync password');

// ── Overdue task reminder ─────────────────────────────────────────────────────
export const overdueTasksTemplate = ({ name, tasks }) => {
  const taskRows = tasks.slice(0, 5).map((t) => `
    <div class="highlight-row">
      <span class="dot-red">●</span>
      <span>
        <strong style="color:#f0f0f8;">${t.title}</strong>
        ${t.subject ? `<span style="color:#6b6b8a;"> — ${t.subject}</span>` : ''}
        <br/>
        <span style="font-size:11px;color:#6b6b8a;">
          Due: ${new Date(t.dueDate).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })}
        </span>
      </span>
    </div>
  `).join('');

  const more = tasks.length > 5
    ? `<p class="text" style="margin-top:8px;">…and ${tasks.length - 5} more overdue task(s).</p>`
    : '';

  return baseLayout(`
    <div class="greeting">You have overdue tasks ⏰</div>
    <p class="text">Hi ${name},</p>
    <p class="text">
      You have <strong style="color:#f87171;">${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}</strong>.
      Get back on track — even completing one today counts!
    </p>
    <div class="section-title">Overdue Tasks</div>
    ${taskRows}
    ${more}
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/tasks" class="btn">View All Tasks</a>
    </div>
  `, `You have ${tasks.length} overdue tasks — let's catch up!`);
};

// ── Task assigned (student) ───────────────────────────────────────────────────
export const taskAssignedTemplate = ({ studentName, teacherName, task, roomName }) =>
  baseLayout(`
    <div class="greeting">New task assigned 📋</div>
    <p class="text">Hi ${studentName},</p>
    <p class="text">
      <strong style="color:#f0f0f8;">${teacherName}</strong> assigned you a new task
      ${roomName ? `in <strong style="color:#a5b4fc;">${roomName}</strong>` : ''}.
    </p>
    <div class="success-box">
      <div style="font-size:16px;font-weight:700;color:#4ade80;margin-bottom:8px;">
        ${task.title}
      </div>
      ${task.description ? `<p style="font-size:13px;color:#86efac;line-height:1.6;">${task.description}</p>` : ''}
      <div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap;">
        ${task.dueDate ? `
          <span style="font-size:12px;color:#6b6b8a;">
            📅 Due: <strong style="color:#c2c2d9;">
              ${new Date(task.dueDate).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </strong>
          </span>` : ''}
        ${task.priority ? `
          <span class="badge badge-${task.priority}">${task.priority.toUpperCase()}</span>
        ` : ''}
        ${task.xpReward ? `
          <span style="font-size:12px;color:#818cf8;">⭐ +${task.xpReward} XP on completion</span>
        ` : ''}
      </div>
    </div>
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/tasks" class="btn">View Task</a>
    </div>
  `, `New task from ${teacherName}: ${task.title}`);

// ── Assignment created ────────────────────────────────────────────────────────
export const assignmentCreatedTemplate = ({ studentName, teacherName, assignment, roomName }) =>
  baseLayout(`
    <div class="greeting">New assignment posted 📝</div>
    <p class="text">Hi ${studentName},</p>
    <p class="text">
      <strong style="color:#f0f0f8;">${teacherName}</strong> posted a new assignment
      in <strong style="color:#a5b4fc;">${roomName}</strong>.
    </p>
    <div class="success-box">
      <div style="font-size:16px;font-weight:700;color:#4ade80;margin-bottom:6px;">
        ${assignment.title}
      </div>
      ${assignment.description
        ? `<p style="font-size:13px;color:#86efac;line-height:1.6;">${assignment.description.slice(0,200)}${assignment.description.length > 200 ? '…' : ''}</p>`
        : ''}
      <div style="margin-top:12px;font-size:12px;color:#6b6b8a;">
        📅 Due: <strong style="color:#c2c2d9;">
          ${new Date(assignment.dueDate).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </strong>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        🏆 Max score: <strong style="color:#c2c2d9;">${assignment.maxScore}</strong>
      </div>
    </div>
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/assignments/${assignment._id}" class="btn">
        View Assignment
      </a>
    </div>
  `, `New assignment: ${assignment.title} — due ${new Date(assignment.dueDate).toLocaleDateString()}`);

// ── Assignment graded ─────────────────────────────────────────────────────────
export const assignmentGradedTemplate = ({ studentName, teacherName, assignment, grade, feedback }) => {
  const pct        = Math.round((grade / assignment.maxScore) * 100);
  const passed     = grade >= assignment.passingScore;
  const gradeColor = pct >= 75 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';

  return baseLayout(`
    <div class="greeting">Your assignment has been graded 🎓</div>
    <p class="text">Hi ${studentName},</p>
    <p class="text">
      <strong style="color:#f0f0f8;">${teacherName}</strong> graded your submission
      for <strong style="color:#a5b4fc;">${assignment.title}</strong>.
    </p>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value" style="color:${gradeColor};">${grade}/${assignment.maxScore}</div>
        <div class="stat-label">Your Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:${gradeColor};">${pct}%</div>
        <div class="stat-label">${passed ? '✓ Passed' : '✗ Below Passing'}</div>
      </div>
    </div>
    <div class="progress-bar-wrap" style="margin-bottom:20px;">
      <div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${gradeColor},${gradeColor}99);"></div>
    </div>
    ${feedback ? `
      <div class="section-title">Teacher Feedback</div>
      <div style="background:#111117;border:1px solid #2a2a38;border-radius:10px;padding:16px;font-size:13px;color:#c2c2d9;line-height:1.7;">
        ${feedback}
      </div>` : ''}
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/assignments/${assignment._id}" class="btn">
        View Full Result
      </a>
    </div>
  `, `Your grade for ${assignment.title}: ${grade}/${assignment.maxScore}`);
};

// ── Weekly digest (student) ───────────────────────────────────────────────────
export const weeklyDigestTemplate = ({ name, stats, topSubjects, highlights, concerns }) => {
  const subjectRows = (topSubjects || []).slice(0, 5).map((s) => {
    const maxMins = topSubjects[0]?.minutes || 1;
    const pct     = Math.round((s.minutes / maxMins) * 100);
    return `
      <div class="subject-row">
        <span class="subject-name">${s.subject}</span>
        <span class="subject-mins">${s.minutes} min</span>
      </div>
      <div class="progress-bar-wrap" style="margin-bottom:10px;">
        <div class="progress-bar-fill" style="width:${pct}%;"></div>
      </div>`;
  }).join('');

  const highlightRows = (highlights || []).map((h) => `
    <div class="highlight-row">
      <span class="dot-green">●</span><span>${h}</span>
    </div>`).join('');

  const concernRows = (concerns || []).map((c) => `
    <div class="highlight-row">
      <span class="dot-red">●</span><span>${c}</span>
    </div>`).join('');

  const hours = Math.floor((stats.totalMinutes || 0) / 60);
  const mins  = (stats.totalMinutes || 0) % 60;

  return baseLayout(`
    <div class="greeting">Your weekly study recap 📊</div>
    <p class="text">Hi ${name}, here's how your week went.</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${hours}h ${mins}m</div>
        <div class="stat-label">Study Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalSessions || 0}</div>
        <div class="stat-label">Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.completedTasks || 0}</div>
        <div class="stat-label">Tasks Done</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#818cf8;">${stats.totalXP || 0}</div>
        <div class="stat-label">XP Earned</div>
      </div>
    </div>

    ${topSubjects?.length ? `
      <div class="section-title">Top Subjects</div>
      ${subjectRows}` : ''}

    ${highlights?.length ? `
      <div class="section-title">Highlights ✨</div>
      ${highlightRows}` : ''}

    ${concerns?.length ? `
      <div class="section-title">Areas to Improve</div>
      ${concernRows}` : ''}

    <div class="btn-center" style="margin-top:24px;">
      <a href="${process.env.CLIENT_URL}/analytics" class="btn">View Full Analytics</a>
    </div>
  `, `Your StudySync weekly recap — ${stats.totalMinutes || 0} minutes studied`);
};

// ── Monthly report (parent) ───────────────────────────────────────────────────
export const monthlyReportTemplate = ({ parentName, childName, month, year, snapshot }) => {
  const {
    study, tasks, assignments, pomodoro,
    highlights, concerns, dailyActivity,
  } = snapshot;

  const hours   = Math.floor((study.totalMinutes || 0) / 60);
  const mins    = (study.totalMinutes || 0) % 60;
  const passRate = assignments.submitted > 0
    ? Math.round((assignments.passCount / assignments.submitted) * 100)
    : 0;

  const subjectRows = (study.topSubjects || []).slice(0, 5).map((s) => {
    const maxMins = study.topSubjects[0]?.minutes || 1;
    const pct     = Math.round((s.minutes / maxMins) * 100);
    return `
      <div class="subject-row">
        <span class="subject-name">${s.subject}</span>
        <span class="subject-mins">${s.minutes} min</span>
      </div>
      <div class="progress-bar-wrap" style="margin-bottom:10px;">
        <div class="progress-bar-fill" style="width:${pct}%;"></div>
      </div>`;
  }).join('');

  const highlightRows = (highlights || []).map((h) => `
    <div class="highlight-row"><span class="dot-green">●</span><span>${h}</span></div>
  `).join('');

  const concernRows = (concerns || []).map((c) => `
    <div class="highlight-row"><span class="dot-red">●</span><span>${c}</span></div>
  `).join('');

  return baseLayout(`
    <div class="greeting">${childName}'s Monthly Report 📚</div>
    <p class="text">
      Hi ${parentName}, here is <strong style="color:#f0f0f8;">${childName}</strong>'s
      study summary for <strong style="color:#a5b4fc;">${month} ${year}</strong>.
    </p>

    <div class="section-title">Study Overview</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${hours}h ${mins}m</div>
        <div class="stat-label">Total Study Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${study.totalSessions || 0}</div>
        <div class="stat-label">Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${study.activeDays || 0}</div>
        <div class="stat-label">Active Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${study.avgDailyMinutes || 0}m</div>
        <div class="stat-label">Daily Average</div>
      </div>
    </div>

    <div class="section-title">Task Performance</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value" style="color:#4ade80;">${tasks.completed || 0}</div>
        <div class="stat-label">Tasks Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#f87171;">${tasks.overdue || 0}</div>
        <div class="stat-label">Overdue</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${tasks.completionRate || 0}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#818cf8;">${tasks.xpEarned || 0}</div>
        <div class="stat-label">XP Earned</div>
      </div>
    </div>

    ${assignments.submitted > 0 ? `
      <div class="section-title">Assignments</div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${assignments.submitted}</div>
          <div class="stat-label">Submitted</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${assignments.avgGrade !== null ? assignments.avgGrade + '%' : 'N/A'}</div>
          <div class="stat-label">Average Grade</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${passRate}%</div>
          <div class="stat-label">Pass Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:#fbbf24;">${assignments.lateCount || 0}</div>
          <div class="stat-label">Late Submissions</div>
        </div>
      </div>` : ''}

    ${pomodoro.totalSessions > 0 ? `
      <div class="section-title">Pomodoro Sessions</div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${pomodoro.totalSessions}</div>
          <div class="stat-label">Sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${pomodoro.totalCycles}</div>
          <div class="stat-label">Cycles Completed</div>
        </div>
      </div>` : ''}

    ${study.topSubjects?.length ? `
      <div class="section-title">Subject Breakdown</div>
      ${subjectRows}` : ''}

    ${highlights?.length ? `
      <div class="section-title">Highlights ✨</div>
      ${highlightRows}` : ''}

    ${concerns?.length ? `
      <div class="section-title">Areas of Concern ⚠</div>
      ${concernRows}` : ''}

    <div class="btn-center" style="margin-top:28px;">
      <a href="${process.env.CLIENT_URL}/parent/child/${snapshot.childId}/analytics" class="btn">
        View Full Dashboard
      </a>
    </div>

    <p class="text" style="font-size:12px;text-align:center;margin-top:8px;">
      You can generate a detailed report anytime from your parent dashboard.
    </p>
  `, `${childName}'s ${month} ${year} study report`);
};

// ── Inactivity alert (parent) ─────────────────────────────────────────────────
export const inactivityAlertTemplate = ({ parentName, childName, daysSince, childId }) =>
  baseLayout(`
    <div class="greeting">${childName} hasn't studied recently 😟</div>
    <p class="text">Hi ${parentName},</p>
    <div class="alert-box">
      <div class="alert-title">Inactivity Alert</div>
      <div class="alert-text">
        ${childName} has not logged any study sessions in the last
        <strong>${daysSince} day${daysSince > 1 ? 's' : ''}</strong>.
        This may impact their learning progress.
      </div>
    </div>
    <p class="text">
      Consider checking in with them or reviewing their upcoming tasks
      and deadlines on your parent dashboard.
    </p>
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/parent/child/${childId}/analytics" class="btn">
        View ${childName}'s Dashboard
      </a>
    </div>
  `, `${childName} hasn't studied in ${daysSince} days`);

// ── Welcome email ─────────────────────────────────────────────────────────────
export const welcomeTemplate = ({ name, role }) => {
  const roleMessages = {
    student: 'Track your study sessions, manage tasks, join classes, and compete on leaderboards.',
    teacher: 'Create classes, assign tasks, track student performance, and send announcements.',
    parent:  'Link to your child\'s account to monitor their progress, receive reports, and set alerts.',
  };

  return baseLayout(`
    <div class="greeting">Welcome to StudySync, ${name}! 🎉</div>
    <p class="text">
      Your <strong style="color:#a5b4fc;">${role}</strong> account is ready.
      Here's what you can do:
    </p>
    <div class="success-box">
      <p style="font-size:14px;color:#86efac;line-height:1.7;">
        ${roleMessages[role] || 'Explore everything StudySync has to offer.'}
      </p>
    </div>
    <div class="btn-center">
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">
        Go to Dashboard
      </a>
    </div>
  `, `Welcome to StudySync — your learning journey starts here!`);
};