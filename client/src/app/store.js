import { configureStore }   from '@reduxjs/toolkit';
import authReducer           from '../features/auth/authSlice';
import notificationReducer   from '../features/notifications/notificationSlice';
import taskReducer           from '../features/tasks/taskSlice';
import roomReducer           from '../features/rooms/roomSlice';

const store = configureStore({
  reducer: {
    auth:          authReducer,
    notifications: notificationReducer,
    tasks:         taskReducer,
    rooms:         roomReducer,
  },
});

export default store;