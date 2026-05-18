import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { noteAPI } from '../../services/api';

// Fetch Notes
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (params = {}, thunkAPI) => {
    try {
      const response = await noteAPI.getAll(params);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Create Note
export const createNote = createAsyncThunk(
  'notes/createNote',
  async (noteData, thunkAPI) => {
    try {
      const response = await noteAPI.create(noteData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Update Note
export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ noteId, noteData }, thunkAPI) => {
    try {
      const response = await noteAPI.update(noteId, noteData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete Note
export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (noteId, thunkAPI) => {
    try {
      await noteAPI.delete(noteId);
      return noteId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Toggle Pin
export const togglePin = createAsyncThunk(
  'notes/togglePin',
  async (noteId, thunkAPI) => {
    try {
      const response = await noteAPI.togglePin(noteId);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Toggle Favorite
export const toggleFavorite = createAsyncThunk(
  'notes/toggleFavorite',
  async (noteId, thunkAPI) => {
    try {
      const response = await noteAPI.toggleFavorite(noteId);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const noteSlice = createSlice({
  name: 'notes',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearNoteError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload)
          ? action.payload
          : action.payload.notes || [];
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createNote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // Update
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (note) => note._id === action.payload._id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (note) => note._id !== action.payload
        );
      })

      // Pin
      .addCase(togglePin.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (note) => note._id === action.payload._id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      // Favorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (note) => note._id === action.payload._id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { clearNoteError } = noteSlice.actions;

export default noteSlice.reducer;