export const APP_NAME = 'StudySync';

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT:  'parent',
};

export const TASK_STATUS = {
  TODO:        'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  OVERDUE:     'overdue',
  CANCELLED:   'cancelled',
};

export const TASK_PRIORITY = {
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
  URGENT: 'urgent',
};

export const SESSION_TYPE = {
  FREE:     'free',
  POMODORO: 'pomodoro',
  GROUP:    'group',
};

export const NOTE_COLORS = [
  { value: 'default', label: 'Default', bg: 'bg-white',        border: 'border-slate-200' },
  { value: 'yellow',  label: 'Yellow',  bg: 'bg-yellow-50',    border: 'border-yellow-200' },
  { value: 'blue',    label: 'Blue',    bg: 'bg-blue-50',      border: 'border-blue-200' },
  { value: 'green',   label: 'Green',   bg: 'bg-green-50',     border: 'border-green-200' },
  { value: 'pink',    label: 'Pink',    bg: 'bg-pink-50',      border: 'border-pink-200' },
  { value: 'purple',  label: 'Purple',  bg: 'bg-purple-50',    border: 'border-purple-200' },
  { value: 'orange',  label: 'Orange',  bg: 'bg-orange-50',    border: 'border-orange-200' },
];

export const ROOM_COLORS = [
  { value: 'blue',   label: 'Blue',   from: 'from-blue-500',   to: 'to-blue-600'   },
  { value: 'green',  label: 'Green',  from: 'from-green-500',  to: 'to-green-600'  },
  { value: 'purple', label: 'Purple', from: 'from-purple-500', to: 'to-purple-600' },
  { value: 'orange', label: 'Orange', from: 'from-orange-500', to: 'to-orange-600' },
  { value: 'pink',   label: 'Pink',   from: 'from-pink-500',   to: 'to-pink-600'   },
  { value: 'teal',   label: 'Teal',   from: 'from-teal-500',   to: 'to-teal-600'   },
  { value: 'red',    label: 'Red',    from: 'from-red-500',    to: 'to-red-600'    },
];

export const POMODORO_DEFAULTS = {
  workMinutes:           25,
  shortBreakMinutes:     5,
  longBreakMinutes:      15,
  cyclesBeforeLongBreak: 4,
};

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED:        'task_assigned',
  TASK_OVERDUE:         'task_overdue',
  TASK_UPCOMING:        'task_upcoming',
  ASSIGNMENT_CREATED:   'assignment_created',
  ASSIGNMENT_GRADED:    'assignment_graded',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  ROOM_ANNOUNCEMENT:    'room_announcement',
  PARENT_LINK_REQUEST:  'parent_link_request',
  MONTHLY_REPORT:       'monthly_report',
  XP_EARNED:            'xp_earned',
  LEVEL_UP:             'level_up',
  STUDY_STREAK:         'study_streak',
  SYSTEM:               'system',
};

export const PRIORITY_COLORS = {
  low:    'priority-low',
  medium: 'priority-medium',
  high:   'priority-high',
  urgent: 'priority-urgent',
};

export const STATUS_COLORS = {
  todo:        'status-todo',
  in_progress: 'status-in_progress',
  completed:   'status-completed',
  overdue:     'status-overdue',
  cancelled:   'status-cancelled',
};

export const ANALYTICS_PERIODS = [
  { label: 'Last 7 days',  value: '7'  },
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

export const SIDEBAR_LINKS = {
  student: [
    // Core
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },

    // Study
    { path: '/pomodoro', label: 'Pomodoro', icon: 'TrendingUp' },
    { path: '/focus-mode', label: 'Focus Mode', icon: 'TrendingUp' },

    // Productivity
    { path: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
    { path: '/notes', label: 'Notes', icon: 'FileText' },
    { path: '/flashcards', label: 'Flashcards', icon: 'ClipboardList' },

    // AI
    { path: '/ai', label: 'AI Assistant', icon: 'FileBarChart' },
    { path: '/ai-planner', label: 'Smart Planner', icon: 'BarChart2' },

    // Analytics
    { path: '/analytics', label: 'Analytics', icon: 'BarChart2' },
  

    // Social
    { path: '/study-room', label: 'Study Rooms', icon: 'Users' },


    // Gamification
    { path: '/leaderboard', label: 'Leaderboard', icon: 'TrendingUp' },
    { path: '/badges', label: 'Badges', icon: 'FileText' },

    // Smart features
    { path: '/focus-score', label: 'Focus Score', icon: 'BarChart2' },
    { path: '/distraction', label: 'Distraction Tracker', icon: 'BarChart2' },

    // Utility
    { path: '/files', label: 'File Sharing', icon: 'FileText' },
    { path: '/quizes', label: 'Quizzes', icon: 'ClipboardList' },
    { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  ],

  teacher: [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },

    { path: '/classrooms', label: 'Classrooms', icon: 'Users' },
    { path: '/assignments', label: 'Assignments', icon: 'ClipboardList' },
    { path: '/submissions', label: 'Submissions', icon: 'FileText' },

    { path: '/students', label: 'Students', icon: 'Users' },

    { path: '/performance', label: 'Performance', icon: 'BarChart2' },
    { path: '/at-risk', label: 'At Risk', icon: 'TrendingUp' },

    { path: '/attendance', label: 'Attendance', icon: 'CheckSquare' },

    { path: '/announcements', label: 'Announcements', icon: 'Bell' },

    { path: '/study-room', label: 'Study Rooms', icon: 'Users' },
    { path: '/video-room', label: 'Video Rooms', icon: 'Users' },
    
    { path: '/quizes', label: 'Quize', icon: 'ClipboardList' },

    { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  ],

  parent: [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },

    { path: '/child-progress', label: 'Child Progress', icon: 'BarChart2' },
    { path: '/study-time', label: 'Study Time', icon: 'TrendingUp' },

    { path: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
    { path: '/assignments', label: 'Assignments', icon: 'ClipboardList' },

    { path: '/reports', label: 'Monthly Reports', icon: 'FileBarChart' },

    { path: '/alerts', label: 'Alerts', icon: 'Bell' },

    { path: '/comparison', label: 'Class Comparison', icon: 'BarChart2' },

    { path: '/teacher-connect', label: 'Message Teacher', icon: 'Users' },

    { path: '/notifications', label: 'Notifications', icon: 'Bell' },
  ],
};