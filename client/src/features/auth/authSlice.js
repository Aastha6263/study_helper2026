import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  registerUser,
  loginUser as authLoginUser,
  logoutUser as authLogoutUser,
  getMe as authGetMe,
  updateUserProfile,
} from './authService';

/* ================= LOCAL STORAGE ================= */
let storedUser = null;
const storedToken = localStorage.getItem('studysync_token');

try {
  storedUser = JSON.parse(localStorage.getItem('user'));
} catch (error) {
  storedUser = null;
}

/* ================= INITIAL STATE ================= */
const initialState = {
  user: storedUser || null,
  token: storedToken || null,
  loading: false,
  error: null,
  hydrated: true,
};

/* ================= REGISTER ================= */
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      return await registerUser(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Registration failed'
      );
    }
  }
);

/* ================= LOGIN ================= */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      return await authLoginUser(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Login failed'
      );
    }
  }
);

/* ================= LOGOUT ================= */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      return await authLogoutUser();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Logout failed'
      );
    }
  }
);

/* ================= GET CURRENT USER ================= */
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, thunkAPI) => {
    try {
      return await authGetMe();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Authentication failed'
      );
    }
  }
);

/* ================= UPDATE PROFILE ================= */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, thunkAPI) => {
    try {
      return await updateUserProfile(profileData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Profile update failed'
      );
    }
  }
);

/* ================= SLICE ================= */
const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= REGISTER ================= */
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

   .addCase(register.fulfilled, (state, action) => {
  const token =
    action.payload.token ||
    action.payload.user?.token ||
    null;

  state.loading = false;
  state.user = action.payload.user;
  state.token = token;
  state.error = null;
  state.hydrated = true;

  localStorage.setItem(
    'user',
    JSON.stringify(action.payload.user)
  );

  if (token) {
    localStorage.setItem(
      'studysync_token',
      token
    );
  }
})
 

      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hydrated = true;
      })

      /* ================= LOGIN ================= */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        const token =
          action.payload.token ||
          action.payload.user?.token ||
          null;

        state.loading = false;
        state.user = action.payload.user;
        state.token = token;
        state.error = null;
        state.hydrated = true;

        localStorage.setItem(
          'user',
          JSON.stringify(action.payload.user)
        );

        if (token) {
          localStorage.setItem(
            'studysync_token',
            token
          );
        }
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hydrated = true;
      })

      /* ================= LOGOUT ================= */
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.hydrated = true;

        localStorage.removeItem('user');
        localStorage.removeItem('studysync_token');
      })

      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hydrated = true;
      })

      /* ================= GET CURRENT USER ================= */
      .addCase(getMe.pending, (state) => {
        state.hydrated = false;
      })

      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.error = null;
        state.hydrated = true;
      })

      .addCase(getMe.rejected, (state) => {
        state.error = null;
        state.hydrated = true;
        // Don't clear user/token on getMe failure
        // User might still be valid even if getMe endpoint fails
      })

      /* ================= UPDATE PROFILE ================= */
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        state.hydrated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })

      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hydrated = true;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;