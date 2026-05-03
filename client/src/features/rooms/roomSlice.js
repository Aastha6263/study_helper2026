import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL}/api/rooms`;

export const fetchMyRooms = createAsyncThunk(
  'rooms/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(API, { withCredentials: true });
      return data.rooms;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchRoomById = createAsyncThunk(
  'rooms/fetchOne',
  async (roomId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/${roomId}`, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const joinRoom = createAsyncThunk(
  'rooms/join',
  async (inviteCode, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${API}/join`,
        { inviteCode },
        { withCredentials: true }
      );
      return data.room;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createRoom = createAsyncThunk(
  'rooms/create',
  async (roomData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(API, roomData, { withCredentials: true });
      return data.room;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const roomSlice = createSlice({
  name: 'rooms',
  initialState: {
    list:         [],
    activeRoom:   null,
    isTeacher:    false,
    // roomId → { participants: [], messages: [], typingUsers: [] }
    roomActivity: {},
    onlineUsers:  {},
    loading:      false,
    error:        null,
  },
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
    },

    setRoomParticipants: (state, action) => {
      const { roomId, participants } = action.payload;
      if (!state.roomActivity[roomId]) {
        state.roomActivity[roomId] = { participants: [], messages: [], typingUsers: [] };
      }
      state.roomActivity[roomId].participants = participants;
    },

    addRoomMessage: (state, action) => {
      const { roomId, ...rest } = action.payload;
      if (!state.roomActivity[roomId]) {
        state.roomActivity[roomId] = { participants: [], messages: [], typingUsers: [] };
      }
      state.roomActivity[roomId].messages.push({
        ...rest,
        id:        `msg_${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
      // Keep last 100 messages in memory
      if (state.roomActivity[roomId].messages.length > 100) {
        state.roomActivity[roomId].messages =
          state.roomActivity[roomId].messages.slice(-100);
      }
    },

    setTypingUser: (state, action) => {
      const { roomId, userId, name, isTyping } = action.payload;
      if (!state.roomActivity[roomId]) {
        state.roomActivity[roomId] = { participants: [], messages: [], typingUsers: [] };
      }
      const typing = state.roomActivity[roomId].typingUsers;
      if (isTyping) {
        if (!typing.find((u) => u.userId === userId)) {
          typing.push({ userId, name });
        }
      } else {
        state.roomActivity[roomId].typingUsers = typing.filter(
          (u) => u.userId !== userId
        );
      }
    },

    updatePresence: (state, action) => {
      const { userId, name, avatar, online } = action.payload;
      state.onlineUsers[userId] = { userId, name, avatar, online };
    },

    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },

    clearRoomActivity: (state, action) => {
      delete state.roomActivity[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRooms.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchMyRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload;
      })
      .addCase(fetchMyRooms.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.activeRoom = action.payload.room;
        state.isTeacher  = action.payload.isTeacher;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        const exists = state.list.find((r) => r._id === action.payload._id);
        if (!exists) state.list.push(action.payload);
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      });
  },
});

export const {
  setActiveRoom,
  setRoomParticipants,
  addRoomMessage,
  setTypingUser,
  updatePresence,
  setOnlineUsers,
  clearRoomActivity,
} = roomSlice.actions;

export default roomSlice.reducer;