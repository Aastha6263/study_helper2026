import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector }        from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from './socket';
import {
  addNotification,
  markAllRead,
} from '../features/notifications/notificationSlice';
import {
  addTask,
  updateTaskInList,
} from '../features/tasks/taskSlice';
import {
  setOnlineUsers,
  updatePresence,
  setRoomParticipants,
  addRoomMessage,
} from '../features/rooms/roomSlice';
import { current } from '@reduxjs/toolkit';

const useSocket = () => {
  const dispatch   = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const socketRef  = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);

  // ── Connect on mount, disconnect on unmount ───────────────────────────────
  useEffect(() => {
    if (!token || !user) return;

    const s = connectSocket(token);
    socketRef.current = s;
    setSocketInstance(s);

    // ── Connection lifecycle ────────────────────────────────────────────────
    s.on('connect', () => {
      console.log('[Socket] connected:', s.id);
    });

    s.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
    });

    s.on('connect_error', (err) => {
      console.error('[Socket] connection error:', err.message);
    });

    // ── Presence ─────────────────────────────────────────────────────────
    s.on('presence:update', (data) => {
      dispatch(updatePresence(data));
    });

    // ── Notifications ─────────────────────────────────────────────────────
    s.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
    });

    s.on('notification:read_all_ack', () => {
      dispatch(markAllRead());
    });

    // ── Tasks ─────────────────────────────────────────────────────────────
    s.on('task:new', ({ task, assignedBy }) => {
      dispatch(addTask(task));
      dispatch(addNotification({
        type:      'task_assigned',
        title:     'New Task',
        message:   `${assignedBy.name} assigned you a new task: "${task.title}"`,
        link:      `/tasks/${task._id}`,
        priority:  task.priority,
        createdAt: new Date().toISOString(),
      }));
    });

    s.on('task:status_updated', ({ task, updatedBy }) => {
      dispatch(updateTaskInList(task));
    });

    s.on('task:xp_earned', ({ taskId, xpEarned, message }) => {
      dispatch(addNotification({
        type:      'xp_earned',
        title:     'XP Earned!',
        message,
        priority:  'low',
        createdAt: new Date().toISOString(),
        meta:      { taskId, xpEarned },
      }));
    });

    // ── Room events ───────────────────────────────────────────────────────
    s.on('room:participants', ({ roomId, participants }) => {
      dispatch(setRoomParticipants({ roomId, participants }));
    });

    s.on('room:user_joined', (data) => {
      dispatch(addRoomMessage({
        roomId:  data.roomId,
        type:    'system',
        message: `${data.name} joined the room.`,
        data,
      }));
    });

    s.on('room:user_left', (data) => {
      dispatch(addRoomMessage({
        roomId:  data.roomId,
        type:    'system',
        message: `${data.name} left the room.`,
        data,
      }));
    });

    s.on('room:announcement', (data) => {
      dispatch(addNotification({
        type:      'announcement',
        title:     'Class Announcement',
        message:   data.message,
        priority:  'medium',
        createdAt: new Date().toISOString(),
        meta:      { roomId: data.roomId, author: data.author },
      }));
    });

    // ── Assignments ───────────────────────────────────────────────────────
    s.on('assignment:new', ({ assignment, createdBy }) => {
      dispatch(addNotification({
        type:      'assignment_created',
        title:     'New Assignment',
        message:   `${createdBy.name} posted "${assignment.title}"`,
        link:      `/assignments/${assignment._id}`,
        priority:  assignment.priority,
        createdAt: new Date().toISOString(),
      }));
    });

    s.on('assignment:grade_received', ({ assignmentId, grade, feedback, gradedBy }) => {
      dispatch(addNotification({
        type:      'assignment_graded',
        title:     'Assignment Graded',
        message:   `${gradedBy.name} graded your submission: ${grade}/100`,
        link:      `/assignments/${assignmentId}`,
        priority:  'medium',
        createdAt: new Date().toISOString(),
        meta:      { assignmentId, grade, feedback },
      }));
    });

    s.on('assignment:submission_received', ({ assignmentId, submittedBy }) => {
      dispatch(addNotification({
        type:      'assignment_submitted',
        title:     'New Submission',
        message:   `${submittedBy.name} submitted an assignment.`,
        link:      `/assignments/${assignmentId}`,
        priority:  'low',
        createdAt: new Date().toISOString(),
      }));
    });

    // ── Study session events ──────────────────────────────────────────────
    s.on('study:member_started', (data) => {
      dispatch(addRoomMessage({
        roomId:  data.roomId,
        type:    'study_start',
        message: `${data.name} started studying ${data.subject}.`,
        data,
      }));
    });

    s.on('study:member_ended', (data) => {
      dispatch(addRoomMessage({
        roomId:  data.roomId,
        type:    'study_end',
        message: `${data.name} finished a ${data.durationMinutes}-minute session (+${data.xpEarned} XP).`,
        data,
      }));
    });

    return () => {
      disconnectSocket();
    };
  }, [token, user, dispatch]);

  // ── Emit helpers (memoised) ───────────────────────────────────────────────
  const joinRoom = useCallback((roomId) => {
    getSocket()?.emit('room:join', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId) => {
    getSocket()?.emit('room:leave', { roomId });
  }, []);

  const emitTyping = useCallback((roomId, isTyping) => {
    getSocket()?.emit('room:typing', { roomId, isTyping });
  }, []);

  const emitTaskAssigned = useCallback((studentIds, task, roomId) => {
    getSocket()?.emit('task:assigned', { studentIds, task, roomId });
  }, []);

  const emitTaskStatusUpdated = useCallback((task, roomId) => {
    getSocket()?.emit('task:status_updated', { task, roomId });
  }, []);

  const emitAssignmentCreated = useCallback((roomId, assignment, studentIds) => {
    getSocket()?.emit('assignment:created', { roomId, assignment, studentIds });
  }, []);

  const emitAssignmentSubmitted = useCallback((assignmentId, teacherId, roomId) => {
    getSocket()?.emit('assignment:submitted', { assignmentId, teacherId, roomId });
  }, []);

  const emitAssignmentGraded = useCallback((studentId, assignmentId, grade, feedback) => {
    getSocket()?.emit('assignment:graded', { studentId, assignmentId, grade, feedback });
  }, []);

  const emitStudyStarted = useCallback((roomId, subject, sessionType) => {
    getSocket()?.emit('study:session_started', { roomId, subject, sessionType });
  }, []);

  const emitStudyEnded = useCallback((roomId, durationMinutes, xpEarned) => {
    getSocket()?.emit('study:session_ended', { roomId, durationMinutes, xpEarned });
  }, []);

  const emitPomodoroPhase = useCallback((roomId, phase, cycleNumber) => {
    getSocket()?.emit('study:pomodoro_phase', { roomId, phase, cycleNumber });
  }, []);

  const emitParentChildStudying = useCallback((parentId, subject) => {
    getSocket()?.emit('parent:child_studying', { parentId, subject });
  }, []);

  const markNotificationsRead = useCallback(() => {
    getSocket()?.emit('notification:read_all');
  }, []);

  return {
    socket:                  socketInstance,
    joinRoom,
    leaveRoom,
    emitTyping,
    emitTaskAssigned,
    emitTaskStatusUpdated,
    emitAssignmentCreated,
    emitAssignmentSubmitted,
    emitAssignmentGraded,
    emitStudyStarted,
    emitStudyEnded,
    emitPomodoroPhase,
    emitParentChildStudying,
    markNotificationsRead,
  };
};

export default useSocket;