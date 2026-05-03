import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT from localStorage ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studysync_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('studysync_token');
      // Avoid redirect loops on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════
export const authAPI = {
  register:       (data)  => api.post('/api/auth/register', data),
  login:          (data)  => api.post('/api/auth/login', data),
  logout:         ()      => api.post('/api/auth/logout'),
  getMe:          ()      => api.get('/api/auth/me'),
  verifyEmail:    (token) => api.get(`/api/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword:  (token, password) =>
                             api.put(`/api/auth/reset-password/${token}`, { password }),
  updateProfile:  (data)  => api.put('/api/auth/update-profile', data),
  changePassword: (data)  => api.put('/api/auth/change-password', data),
};

// ══════════════════════════════════════════════════════════════════════════════
//  STUDY SESSIONS
// ══════════════════════════════════════════════════════════════════════════════
export const studyAPI = {
  startSession:   (data)  => api.post('/api/study/sessions/start', data),
  pauseSession:   (id)    => api.patch(`/api/study/sessions/${id}/pause`),
  resumeSession:  (id)    => api.patch(`/api/study/sessions/${id}/resume`),
  endSession:     (id, d) => api.patch(`/api/study/sessions/${id}/end`, d),
  abandonSession: (id)    => api.patch(`/api/study/sessions/${id}/abandon`),
  getActive:      ()      => api.get('/api/study/sessions/active'),
  getHistory:     (params)=> api.get('/api/study/sessions/history', { params }),
  getAnalytics:   (params)=> api.get('/api/study/sessions/analytics', { params }),
  // Pomodoro
  startPomodoro:  (data)  => api.post('/api/study/pomodoro/start', data),
  completePhase:  (id, d) => api.patch(`/api/study/pomodoro/${id}/phase`, d),
  endPomodoro:    (id)    => api.patch(`/api/study/pomodoro/${id}/end`),
  getActivePomodoro: ()   => api.get('/api/study/pomodoro/active'),
  getPomodoroHistory:(p)  => api.get('/api/study/pomodoro/history', { params: p }),
};

// ══════════════════════════════════════════════════════════════════════════════
//  TASKS
// ══════════════════════════════════════════════════════════════════════════════
export const taskAPI = {
  getAll:        (params)       => api.get('/api/tasks', { params }),
  getById:       (id)           => api.get(`/api/tasks/${id}`),
  create:        (data)         => api.post('/api/tasks', data),
  update:        (id, data)     => api.put(`/api/tasks/${id}`, data),
  delete:        (id)           => api.delete(`/api/tasks/${id}`),
  updateStatus:  (id, status)   => api.patch(`/api/tasks/${id}/status`, { status }),
  addSubTask:    (id, title)    => api.post(`/api/tasks/${id}/subtasks`, { title }),
  toggleSubTask: (id, subId)    => api.patch(`/api/tasks/${id}/subtasks/${subId}/toggle`),
  deleteSubTask: (id, subId)    => api.delete(`/api/tasks/${id}/subtasks/${subId}`),
  getAnalytics:  ()             => api.get('/api/tasks/analytics'),
};

// ══════════════════════════════════════════════════════════════════════════════
//  NOTES
// ══════════════════════════════════════════════════════════════════════════════
export const noteAPI = {
  getAll:         (params)    => api.get('/api/notes', { params }),
  getById:        (id)        => api.get(`/api/notes/${id}`),
  create:         (data)      => api.post('/api/notes', data),
  update:         (id, data)  => api.put(`/api/notes/${id}`, data),
  delete:         (id)        => api.delete(`/api/notes/${id}`),
  togglePin:      (id)        => api.patch(`/api/notes/${id}/pin`),
  share:          (id, userIds) => api.post(`/api/notes/${id}/share`, { userIds }),
  getSharedWithMe:()          => api.get('/api/notes/shared-with-me'),
};

// ══════════════════════════════════════════════════════════════════════════════
//  ROOMS
// ══════════════════════════════════════════════════════════════════════════════
export const roomAPI = {
  getAll:               (params)    => api.get('/api/rooms', { params }),
  getById:              (id)        => api.get(`/api/rooms/${id}`),
  create:               (data)      => api.post('/api/rooms', data),
  update:               (id, data)  => api.put(`/api/rooms/${id}`, data),
  delete:               (id)        => api.delete(`/api/rooms/${id}`),
  join:                 (code)      => api.post('/api/rooms/join', { inviteCode: code }),
  leave:                (id)        => api.post(`/api/rooms/${id}/leave`),
  addStudents:          (id, emails)=> api.post(`/api/rooms/${id}/students`, { emails }),
  removeStudent:        (id, sid)   => api.delete(`/api/rooms/${id}/students/${sid}`),
  regenerateCode:       (id)        => api.patch(`/api/rooms/${id}/invite-code`),
  postAnnouncement:     (id, data)  => api.post(`/api/rooms/${id}/announcements`, data),
  deleteAnnouncement:   (id, aid)   => api.delete(`/api/rooms/${id}/announcements/${aid}`),
  addResource:          (id, data)  => api.post(`/api/rooms/${id}/resources`, data),
};

// ══════════════════════════════════════════════════════════════════════════════
//  ASSIGNMENTS
// ══════════════════════════════════════════════════════════════════════════════
export const assignmentAPI = {
  create:          (data)          => api.post('/api/assignments', data),
  getByRoom:       (roomId, params)=> api.get(`/api/assignments/room/${roomId}`, { params }),
  getById:         (id)            => api.get(`/api/assignments/${id}`),
  update:          (id, data)      => api.put(`/api/assignments/${id}`, data),
  delete:          (id)            => api.delete(`/api/assignments/${id}`),
  submit:          (id, data)      => api.post(`/api/assignments/${id}/submit`, data),
  grade:           (id, subId, d)  => api.patch(`/api/assignments/${id}/submissions/${subId}/grade`, d),
  returnSub:       (id, subId, d)  => api.patch(`/api/assignments/${id}/submissions/${subId}/return`, d),
};

// ══════════════════════════════════════════════════════════════════════════════
//  PERFORMANCE (teacher)
// ══════════════════════════════════════════════════════════════════════════════
export const performanceAPI = {
  getClassPerf:    (roomId, params)=> api.get(`/api/performance/class/${roomId}`, { params }),
  getStudentPerf:  (sid, params)   => api.get(`/api/performance/student/${sid}`, { params }),
  getLeaderboard:  (roomId)        => api.get(`/api/performance/class/${roomId}/leaderboard`),
  getAtRisk:       (roomId, params)=> api.get(`/api/performance/class/${roomId}/at-risk`, { params }),
  getAssignReport: (id)            => api.get(`/api/performance/assignment/${id}/report`),
};

// ══════════════════════════════════════════════════════════════════════════════
//  PARENT
// ══════════════════════════════════════════════════════════════════════════════
export const parentAPI = {
  sendLink:          (data)          => api.post('/api/parent/link', data),
  getChildren:       ()              => api.get('/api/parent/children'),
  revokeLink:        (linkId)        => api.delete(`/api/parent/link/${linkId}`),
  updateLinkSettings:(linkId, data)  => api.put(`/api/parent/link/${linkId}/settings`, data),
  getOverview:       ()              => api.get('/api/parent/overview'),
  getLinkRequests:   ()              => api.get('/api/parent/link-requests'),
  respondToLink:     (id, action)    => api.patch(`/api/parent/link/${id}/respond`, { action }),
  getChildProfile:   (cid)          => api.get(`/api/parent/child/${cid}/profile`),
  getChildSessions:  (cid, params)  => api.get(`/api/parent/child/${cid}/study-sessions`, { params }),
  getChildTasks:     (cid, params)  => api.get(`/api/parent/child/${cid}/tasks`, { params }),
  getChildAssignments:(cid, params) => api.get(`/api/parent/child/${cid}/assignments`, { params }),
  getChildAnalytics: (cid, params)  => api.get(`/api/parent/child/${cid}/analytics`, { params }),
  getWeeklyComparison:(cid)         => api.get(`/api/parent/child/${cid}/weekly-comparison`),
  generateReport:    (cid, data)    => api.post(`/api/parent/child/${cid}/reports`, data),
  getReports:        (cid, params)  => api.get(`/api/parent/child/${cid}/reports`, { params }),
  getReportById:     (rid)          => api.get(`/api/parent/reports/${rid}`),
  deleteReport:      (rid)          => api.delete(`/api/parent/reports/${rid}`),
};

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
export const notificationAPI = {
  getAll:            (params)  => api.get('/api/notifications', { params }),
  getUnreadCount:    ()        => api.get('/api/notifications/unread-count'),
  getStats:          ()        => api.get('/api/notifications/stats'),
  markAsRead:        (id)      => api.patch(`/api/notifications/${id}/read`),
  markAllRead:       ()        => api.patch('/api/notifications/read-all'),
  delete:            (id)      => api.delete(`/api/notifications/${id}`),
  deleteAllRead:     ()        => api.delete('/api/notifications/read'),
  registerFcm:       (token)   => api.post('/api/notifications/fcm/register', { fcmToken: token }),
  removeFcm:         ()        => api.delete('/api/notifications/fcm/remove'),
  subscribe:         (topic)   => api.post('/api/notifications/fcm/subscribe', { topic }),
  unsubscribe:       (topic)   => api.post('/api/notifications/fcm/unsubscribe', { topic }),
  updatePrefs:       (prefs)   => api.put('/api/notifications/preferences', prefs),
};

export default api;