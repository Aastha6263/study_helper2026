import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL}/api/tasks`;

// ── Async thunks ──────────────────────────────────────────────────────────────
export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(API, {
        params,
        withCredentials: true,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (taskData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(API, taskData, { withCredentials: true });
      return data.task;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateStatus',
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      const { data } = await axios.patch(
        `${API}/${taskId}/status`,
        { status },
        { withCredentials: true }
      );
      return data.task;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (taskId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API}/${taskId}`, { withCredentials: true });
      return taskId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchTaskAnalytics = createAsyncThunk(
  'tasks/analytics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/analytics`, { withCredentials: true });
      return data.analytics;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items:      [],
    analytics:  null,
    pagination: null,
    loading:    false,
    error:      null,
  },
  reducers: {
    // Used by socket to inject incoming task in real time
    addTask: (state, action) => {
      const exists = state.items.find((t) => t._id === action.payload._id);
      if (!exists) state.items.unshift(action.payload);
    },
    updateTaskInList: (state, action) => {
      const idx = state.items.findIndex((t) => t._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeTaskFromList: (state, action) => {
      state.items = state.items.filter((t) => t._id !== action.payload);
    },
    clearTaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading    = false;
        state.items      = action.payload.tasks;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

      // createTask
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // updateTaskStatus
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })

      // deleteTask
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      })

      // analytics
      .addCase(fetchTaskAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const {
  addTask,
  updateTaskInList,
  removeTaskFromList,
  clearTaskError,
} = taskSlice.actions;

export default taskSlice.reducer;