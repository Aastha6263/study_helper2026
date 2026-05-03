import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items:       [],
    unreadCount: 0,
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        ...action.payload,
        id:        action.payload.id || `notif_${Date.now()}_${Math.random()}`,
        isRead:    false,
        createdAt: action.payload.createdAt || new Date().toISOString(),
      };
      // Prepend — newest first
      state.items.unshift(notification);
      state.unreadCount += 1;

      // Keep at most 50
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }
    },

    markAsRead: (state, action) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.isRead) {
        item.isRead     = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllRead: (state) => {
      state.items.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },

    removeNotification: (state, action) => {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        if (!state.items[idx].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items.splice(idx, 1);
      }
    },

    clearAll: (state) => {
      state.items       = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllRead,
  markAllAsRead=markAllRead,
  removeNotification,
  clearAll,
} = notificationSlice.actions;

export default notificationSlice.reducer;