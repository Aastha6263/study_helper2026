import axios from 'axios';

/* ================= API BASE ================= */
const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

/* ================= AXIOS INSTANCE ================= */
const api = axios.create({
  baseURL: API_URL,

  // IMPORTANT:
  // Disabled to avoid CORS issues unless secure cookies are required
  withCredentials: false,

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 15000,
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      'studysync_token'
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(
        'studysync_token'
      );

      localStorage.removeItem('user');

      if (
        !window.location.pathname.includes(
          '/login'
        )
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/* ════════════════════════════════════════════════════════
   AUTH API
══════════════════════════════════════════════════════════ */
export const authAPI = {
  register: (data) =>
    api.post('/auth/register', data),

  login: (data) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  verifyEmail: (token) =>
    api.get(`/auth/verify-email/${token}`),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', {
      email,
    }),

  resetPassword: (token, password) =>
    api.put(
      `/auth/reset-password/${token}`,
      { password }
    ),

  updateProfile: (data) =>
    api.put('/auth/update-profile', data),

  changePassword: (data) =>
    api.put('/auth/change-password', data),
};

/* ════════════════════════════════════════════════════════
   NOTIFICATION API
══════════════════════════════════════════════════════════ */
export const notificationAPI = {
  getAll: (params) =>
    api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),

  delete: (id) =>
    api.delete(`/notifications/${id}`),

  deleteAll: () =>
    api.delete('/notifications'),
};
/* ════════════════════════════════════════════════════════
   STUDY API
══════════════════════════════════════════════════════════ */
export const studyAPI = {
  startSession: (data) =>
    api.post('/study/sessions/start', data),

  pauseSession: (id) =>
    api.patch(`/study/sessions/${id}/pause`),

  resumeSession: (id) =>
    api.patch(`/study/sessions/${id}/resume`),

  endSession: (id, data) =>
    api.patch(`/study/sessions/${id}/end`, data),

  abandonSession: (id) =>
    api.patch(`/study/sessions/${id}/abandon`),

  getActive: () =>
    api.get('/study/sessions/active'),

  getHistory: (params) =>
    api.get('/study/sessions/history', {
      params,
    }),

  getAnalytics: (params) =>
    api.get('/study/sessions/analytics', {
      params,
    }),

  startPomodoro: (data) =>
    api.post('/study/pomodoro/start', data),

  completePhase: (id, data) =>
    api.patch(`/study/pomodoro/${id}/phase`, data),

  endPomodoro: (id) =>
    api.patch(`/study/pomodoro/${id}/end`),

  getActivePomodoro: () =>
    api.get('/study/pomodoro/active'),

  getPomodoroHistory: (params) =>
    api.get('/study/pomodoro/history', {
      params,
    }),
};

/* ════════════════════════════════════════════════════════
   TASK API
══════════════════════════════════════════════════════════ */
// export const taskAPI = {
//   getAll: (params) =>
//     api.get('/tasks', { params }),

//   getById: (id) =>
//     api.get(`/tasks/${id}`),

//   create: (data) =>
//     api.post('/tasks', data),

//   update: (id, data) =>
//     api.put(`/tasks/${id}`, data),

//   delete: (id) =>
//     api.delete(`/tasks/${id}`),

//   updateStatus: (id, status) =>
//     api.patch(`/tasks/${id}/status`, {
//       status,
//     }),

//   addSubTask: (id, title) =>
//     api.post(`/tasks/${id}/subtasks`, {
//       title,
//     }),

//   toggleSubTask: (id, subId) =>
//     api.patch(
//       `/tasks/${id}/subtasks/${subId}/toggle`
//     ),

//   deleteSubTask: (id, subId) =>
//     api.delete(
//       `/tasks/${id}/subtasks/${subId}`
//     ),

//   getAnalytics: () =>
//     api.get('/tasks/analytics'),
// };
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getAnalytics: () => api.get('/tasks/analytics'),
  create: (taskData) => api.post('/tasks', taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/tasks/${id}/status`, { status }),
};

export const noteAPI = {
  getAll: (params) => api.get('/notes', { params }),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  togglePin: (id) => api.patch(`/notes/${id}/pin`),
  toggleFavorite: (id) => api.patch(`/notes/${id}/favorite`),
  getSubjects: () => api.get('/notes/subjects'),
  addSubject: (name) => api.post('/notes/subjects', { name }),
};

/* ================= EXPORT DEFAULT ================= */
export default api;