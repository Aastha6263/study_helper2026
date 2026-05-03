import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── In-memory maps ────────────────────────────────────────────────────────────
// userId  → Set of socketIds  (one user, multiple tabs)
// roomId  → Set of userIds    (who is in a study room)
export const onlineUsers  = new Map();
export const activeRooms  = new Map();

// ─── Auth middleware for socket ───────────────────────────────────────────────
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: no token provided.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: user not found.'));
    }

    socket.user = user;   // attach user to every socket
    next();
  } catch (err) {
    next(new Error('Authentication error: invalid token.'));
  }
};

// ─── Register all socket event handlers ──────────────────────────────────────
export const registerSocketHandlers = (io) => {

  // ── Global auth middleware ────────────────────────────────────────────────
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const role   = socket.user.role;

    console.log(`[Socket] connected  — user: ${socket.user.name} (${role}) | sid: ${socket.id}`);

    // ── Track online presence ──────────────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join a personal room so we can target this user from anywhere
    socket.join(`user:${userId}`);

    // Broadcast presence update to everyone
    io.emit('presence:update', {
      userId,
      name:   socket.user.name,
      avatar: socket.user.avatar,
      online: true,
    });

    // ════════════════════════════════════════════════════════════════════════
    //  STUDY ROOMS
    // ════════════════════════════════════════════════════════════════════════

    // ── Join study room ────────────────────────────────────────────────────
    socket.on('room:join', ({ roomId }) => {
      if (!roomId) return;

      socket.join(`room:${roomId}`);

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add(userId);

      // Tell everyone in the room someone arrived
      io.to(`room:${roomId}`).emit('room:user_joined', {
        userId,
        name:    socket.user.name,
        avatar:  socket.user.avatar,
        role,
        roomId,
        joinedAt: new Date(),
      });

      // Send current room participants back to the joiner
      const participants = [...(activeRooms.get(roomId) || [])];
      socket.emit('room:participants', { roomId, participants });

      console.log(`[Socket] ${socket.user.name} joined room:${roomId}`);
    });

    // ── Leave study room ───────────────────────────────────────────────────
    socket.on('room:leave', ({ roomId }) => {
      if (!roomId) return;
      handleLeaveRoom(io, socket, roomId, userId);
    });

    // ── Typing indicator inside room chat ──────────────────────────────────
    socket.on('room:typing', ({ roomId, isTyping }) => {
      socket.to(`room:${roomId}`).emit('room:typing', {
        userId,
        name:     socket.user.name,
        isTyping,
        roomId,
      });
    });

    // ── Broadcast announcement to room ─────────────────────────────────────
    socket.on('room:announcement', ({ roomId, message }) => {
      if (role !== 'teacher') {
        return socket.emit('error', { message: 'Only teachers can post announcements.' });
      }
      io.to(`room:${roomId}`).emit('room:announcement', {
        roomId,
        message,
        author: {
          _id:    userId,
          name:   socket.user.name,
          avatar: socket.user.avatar,
        },
        createdAt: new Date(),
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    //  TASKS
    // ════════════════════════════════════════════════════════════════════════

    // ── New task assigned (teacher → student) ──────────────────────────────
    socket.on('task:assigned', ({ studentIds, task, roomId }) => {
      if (!Array.isArray(studentIds) || !task) return;

      studentIds.forEach((sid) => {
        io.to(`user:${sid}`).emit('task:new', {
          task,
          assignedBy: {
            _id:    userId,
            name:   socket.user.name,
            avatar: socket.user.avatar,
          },
          roomId,
          createdAt: new Date(),
        });

        // Also send a notification to the student
        io.to(`user:${sid}`).emit('notification:new', {
          type:      'task_assigned',
          title:     'New Task Assigned',
          message:   `${socket.user.name} assigned you: "${task.title}"`,
          link:      `/tasks/${task._id}`,
          priority:  task.priority || 'medium',
          createdAt: new Date(),
          meta:      { taskId: task._id, roomId },
        });
      });

      console.log(`[Socket] task:assigned → ${studentIds.length} students`);
    });

    // ── Task status updated (student) ──────────────────────────────────────
    socket.on('task:status_updated', ({ task, roomId }) => {
      if (!task) return;

      // Notify assigned teacher if task is from a room
      if (roomId) {
        socket.to(`room:${roomId}`).emit('task:status_updated', {
          task,
          updatedBy: {
            _id:    userId,
            name:   socket.user.name,
            avatar: socket.user.avatar,
          },
          updatedAt: new Date(),
        });
      }

      // Notify parent if student completes a task
      if (task.status === 'completed') {
        socket.emit('task:xp_earned', {
          taskId:    task._id,
          xpEarned:  task.xpReward || 10,
          message:   `+${task.xpReward || 10} XP earned for completing "${task.title}"!`,
        });
      }
    });

    // ── Task overdue alert ─────────────────────────────────────────────────
    // Called by cron job via emitToUser helper
    socket.on('task:overdue_alert', ({ tasks }) => {
      socket.emit('notification:new', {
        type:      'overdue_tasks',
        title:     'Overdue Tasks',
        message:   `You have ${tasks.length} overdue task(s). Get back on track!`,
        priority:  'high',
        createdAt: new Date(),
        meta:      { tasks },
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    //  NOTIFICATIONS
    // ════════════════════════════════════════════════════════════════════════

    // ── Generic notification from server ──────────────────────────────────
    // (Usually emitted server-side via emitToUser, not from client)
    socket.on('notification:read', ({ notificationId }) => {
      // Client confirms a notification was read
      socket.emit('notification:read_ack', { notificationId });
    });

    socket.on('notification:read_all', () => {
      socket.emit('notification:read_all_ack', { userId });
    });

    // ════════════════════════════════════════════════════════════════════════
    //  STUDY SESSIONS
    // ════════════════════════════════════════════════════════════════════════

    // ── Broadcast study session start to room ──────────────────────────────
    socket.on('study:session_started', ({ roomId, subject, sessionType }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('study:member_started', {
        userId,
        name:        socket.user.name,
        avatar:      socket.user.avatar,
        subject,
        sessionType,
        startedAt:   new Date(),
      });
    });

    // ── Broadcast session end ──────────────────────────────────────────────
    socket.on('study:session_ended', ({ roomId, durationMinutes, xpEarned }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('study:member_ended', {
        userId,
        name:            socket.user.name,
        durationMinutes,
        xpEarned,
        endedAt:         new Date(),
      });
    });

    // ── Pomodoro phase broadcast ───────────────────────────────────────────
    socket.on('study:pomodoro_phase', ({ roomId, phase, cycleNumber }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('study:pomodoro_phase', {
        userId,
        name:        socket.user.name,
        phase,
        cycleNumber,
        timestamp:   new Date(),
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    //  ASSIGNMENTS
    // ════════════════════════════════════════════════════════════════════════

    // ── New assignment created (teacher → room) ────────────────────────────
    socket.on('assignment:created', ({ roomId, assignment, studentIds }) => {
      if (!roomId || !assignment) return;

      // Broadcast to whole room
      io.to(`room:${roomId}`).emit('assignment:new', {
        assignment,
        createdBy: {
          _id:    userId,
          name:   socket.user.name,
          avatar: socket.user.avatar,
        },
        createdAt: new Date(),
      });

      // Individual notifications for each student
      if (Array.isArray(studentIds)) {
        studentIds.forEach((sid) => {
          io.to(`user:${sid}`).emit('notification:new', {
            type:      'assignment_created',
            title:     'New Assignment',
            message:   `${socket.user.name} posted: "${assignment.title}" — due ${new Date(assignment.dueDate).toLocaleDateString()}`,
            link:      `/assignments/${assignment._id}`,
            priority:  assignment.priority || 'medium',
            createdAt: new Date(),
            meta:      { assignmentId: assignment._id, roomId },
          });
        });
      }
    });

    // ── Assignment submitted (student → teacher) ───────────────────────────
    socket.on('assignment:submitted', ({ assignmentId, teacherId, roomId }) => {
      io.to(`user:${teacherId}`).emit('assignment:submission_received', {
        assignmentId,
        submittedBy: {
          _id:    userId,
          name:   socket.user.name,
          avatar: socket.user.avatar,
        },
        roomId,
        submittedAt: new Date(),
      });

      io.to(`user:${teacherId}`).emit('notification:new', {
        type:      'assignment_submitted',
        title:     'New Submission',
        message:   `${socket.user.name} submitted an assignment.`,
        link:      `/assignments/${assignmentId}`,
        priority:  'medium',
        createdAt: new Date(),
        meta:      { assignmentId, roomId },
      });
    });

    // ── Assignment graded (teacher → student) ─────────────────────────────
    socket.on('assignment:graded', ({ studentId, assignmentId, grade, feedback }) => {
      io.to(`user:${studentId}`).emit('assignment:grade_received', {
        assignmentId,
        grade,
        feedback,
        gradedBy: {
          _id:    userId,
          name:   socket.user.name,
          avatar: socket.user.avatar,
        },
        gradedAt: new Date(),
      });

      io.to(`user:${studentId}`).emit('notification:new', {
        type:      'assignment_graded',
        title:     'Assignment Graded',
        message:   `Your submission was graded: ${grade}/100`,
        link:      `/assignments/${assignmentId}`,
        priority:  'low',
        createdAt: new Date(),
        meta:      { assignmentId, grade },
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    //  PARENT ALERTS
    // ════════════════════════════════════════════════════════════════════════

    // ── Alert parent when child starts studying ────────────────────────────
    socket.on('parent:child_studying', ({ parentId, subject }) => {
      if (!parentId) return;
      io.to(`user:${parentId}`).emit('notification:new', {
        type:      'child_studying',
        title:     'Study Session Started',
        message:   `${socket.user.name} started studying ${subject}.`,
        priority:  'low',
        createdAt: new Date(),
        meta:      { childId: userId, subject },
      });
    });

    // ── Alert parent of overdue tasks ─────────────────────────────────────
    // (also fired by cron — see cronService)
    socket.on('parent:overdue_alert', ({ parentId, overdueCount }) => {
      if (!parentId) return;
      io.to(`user:${parentId}`).emit('notification:new', {
        type:      'child_overdue_tasks',
        title:     'Child Has Overdue Tasks',
        message:   `${socket.user.name} has ${overdueCount} overdue task(s).`,
        priority:  'high',
        createdAt: new Date(),
        meta:      { childId: userId, overdueCount },
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    //  DISCONNECT
    // ════════════════════════════════════════════════════════════════════════

    socket.on('disconnect', () => {
      console.log(`[Socket] disconnected — user: ${socket.user.name} | sid: ${socket.id}`);

      // Remove this socket from user's set
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // Truly offline — all tabs closed
          onlineUsers.delete(userId);

          // Remove from all active rooms
          activeRooms.forEach((members, roomId) => {
            if (members.has(userId)) {
              members.delete(userId);
              io.to(`room:${roomId}`).emit('room:user_left', {
                userId,
                name:   socket.user.name,
                avatar: socket.user.avatar,
                roomId,
                leftAt: new Date(),
              });
            }
          });

          // Broadcast offline presence
          io.emit('presence:update', {
            userId,
            name:   socket.user.name,
            online: false,
          });
        }
      }
    });

    socket.on('error', (err) => {
      console.error(`[Socket] error from ${socket.user?.name}:`, err.message);
    });
  });
};

// ─── Helpers: emit to a specific user from anywhere in server ─────────────────
export const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (io, roomId, event, data) => {
  io.to(`room:${roomId}`).emit(event, data);
};

export const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', {
    ...notification,
    createdAt: new Date(),
  });
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

// ─── Helper: clean room leave logic (reused on disconnect) ───────────────────
const handleLeaveRoom = (io, socket, roomId, userId) => {
  socket.leave(`room:${roomId}`);

  const members = activeRooms.get(roomId);
  if (members) {
    members.delete(userId);
    if (members.size === 0) activeRooms.delete(roomId);
  }

  io.to(`room:${roomId}`).emit('room:user_left', {
    userId,
    name:   socket.user.name,
    avatar: socket.user.avatar,
    roomId,
    leftAt: new Date(),
  });

  console.log(`[Socket] ${socket.user.name} left room:${roomId}`);
};