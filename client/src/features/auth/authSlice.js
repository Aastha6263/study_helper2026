import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Render backend URL
const BASE = import.meta.env.VITE_API_URL || 'https://stydysync-2.onrender.com';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${BASE}/api/auth/login`,
        credentials,
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${BASE}/api/auth/register`,
        userData,
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(
        `${BASE}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('studysync_token');
      const { data } = await axios.get(`${BASE}/api/auth/me`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Session expired'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('studysync_token') || null,
    loading: false,
    error: null,
    hydrated: !localStorage.getItem('studysync_token'),
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('studysync_token', action.payload);
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.hydrated = true;
      localStorage.removeItem('studysync_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.hydrated = true;
        localStorage.setItem('studysync_token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hydrated = true;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.hydrated = true;
        localStorage.setItem('studysync_token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hydrated = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.hydrated = true;
        localStorage.removeItem('studysync_token');
      })
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.hydrated = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.hydrated = true;
        localStorage.removeItem('studysync_token');
      });
  },
});

export const { setToken, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
