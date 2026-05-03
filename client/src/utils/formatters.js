import { format, formatDistanceToNow, isToday,
         isYesterday, parseISO }              from 'date-fns';

// ── Date / time ───────────────────────────────────────────────────────────────
export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '—';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, fmt);
  } catch { return '—'; }
};

export const formatDateTime = (date) =>
  formatDate(date, 'MMM d, yyyy • h:mm a');

export const formatRelative = (date) => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isToday(d))     return `Today ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return '—'; }
};

export const formatDueDate = (date) => {
  if (!date) return null;
  try {
    const d   = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diff= Math.ceil((d - now) / 86400000);

    if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: 'text-danger-600' };
    if (diff === 0)return { label: 'Due today',                  color: 'text-warning-600' };
    if (diff === 1)return { label: 'Due tomorrow',               color: 'text-warning-500' };
    if (diff <= 7) return { label: `Due in ${diff}d`,            color: 'text-slate-600'   };
    return           { label: formatDate(d, 'MMM d'),            color: 'text-slate-500'   };
  } catch { return null; }
};

// ── Duration ──────────────────────────────────────────────────────────────────
export const formatMinutes = (mins) => {
  if (!mins && mins !== 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatSeconds = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Numbers ───────────────────────────────────────────────────────────────────
export const formatNumber = (n) => {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat().format(n);
};

export const formatPercent = (n, decimals = 0) => {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(decimals)}%`;
};

export const formatXP = (xp) => {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k XP`;
  return `${xp} XP`;
};

// ── Text ──────────────────────────────────────────────────────────────────────
export const truncate = (str, len = 60) => {
  if (!str) return '';
  return str.length > len ? `${str.slice(0, len)}…` : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatRole = (role) => {
  const map = { student: 'Student', teacher: 'Teacher', parent: 'Parent' };
  return map[role] || capitalize(role);
};

export const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// ── Grade ─────────────────────────────────────────────────────────────────────
export const gradeColor = (grade) => {
  if (grade >= 90) return 'text-success-600';
  if (grade >= 75) return 'text-primary-600';
  if (grade >= 50) return 'text-warning-600';
  return 'text-danger-600';
};

export const gradeLetter = (grade) => {
  if (grade >= 90) return 'A';
  if (grade >= 75) return 'B';
  if (grade >= 60) return 'C';
  if (grade >= 40) return 'D';
  return 'F';
};

// ── Initials for avatar ───────────────────────────────────────────────────────
export const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');