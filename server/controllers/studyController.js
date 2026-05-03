import StudySession from '../models/StudySession.js';
import PomodoroSession from '../models/PomodoroSession.js';

// ─── Start Study Session ──────────────────────────────────────────────────────
export const startSession = async (req, res) => {
  try {
    const { subject, sessionType, roomId, pomodoroConfig, tags, notes } = req.body;

    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }

    // Check if student already has an active session
    const existing = await StudySession.findOne({
      student: req.user._id,
      status: 'active',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active study session. Please end it first.',
        session: existing,
      });
    }

    const sessionData = {
      student:     req.user._id,
      subject,
      sessionType: sessionType || 'free',
      startTime:   new Date(),
      room:        roomId || null,
      tags:        tags || [],
      notes:       notes || '',
    };

    if (sessionType === 'pomodoro' && pomodoroConfig) {
      sessionData.pomodoroConfig = {
        workMinutes:            pomodoroConfig.workMinutes || 25,
        shortBreak:             pomodoroConfig.shortBreak  || 5,
        longBreak:              pomodoroConfig.longBreak   || 15,
        cyclesBeforeLongBreak:  pomodoroConfig.cyclesBeforeLongBreak || 4,
        completedCycles:        0,
      };
    }

    const session = await StudySession.create(sessionData);

    res.status(201).json({
      success: true,
      message: 'Study session started.',
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Pause Session ────────────────────────────────────────────────────────────
export const pauseSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      _id:     req.params.id,
      student: req.user._id,
      status:  'active',
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found.',
      });
    }

    session.status   = 'paused';
    session.pausedAt = new Date();
    await session.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Session paused.', session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Resume Session ───────────────────────────────────────────────────────────
export const resumeSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      _id:     req.params.id,
      student: req.user._id,
      status:  'paused',
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Paused session not found.',
      });
    }

    // Accumulate paused duration
    if (session.pausedAt) {
      session.totalPausedMs += new Date() - session.pausedAt;
    }

    session.status   = 'active';
    session.pausedAt = null;
    await session.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Session resumed.', session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── End Session ──────────────────────────────────────────────────────────────
export const endSession = async (req, res) => {
  try {
    const { focusScore, notes } = req.body;

    const session = await StudySession.findOne({
      _id:     req.params.id,
      student: req.user._id,
      status:  { $in: ['active', 'paused'] },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already ended.',
      });
    }

    session.status  = 'completed';
    session.endTime = new Date();

    if (focusScore !== undefined) {
      session.focusScore = Math.min(100, Math.max(0, focusScore));
    }
    if (notes) session.notes = notes;

    // If it was paused when ended, add final pause duration
    if (session.pausedAt) {
      session.totalPausedMs += new Date() - session.pausedAt;
      session.pausedAt = null;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: `Session completed! You earned ${session.xpEarned} XP.`,
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Abandon Session ──────────────────────────────────────────────────────────
export const abandonSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      _id:     req.params.id,
      student: req.user._id,
      status:  { $in: ['active', 'paused'] },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.status  = 'abandoned';
    session.endTime = new Date();
    await session.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Session abandoned.', session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Active Session ───────────────────────────────────────────────────────
export const getActiveSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      student: req.user._id,
      status:  { $in: ['active', 'paused'] },
    }).populate('room', 'name subject');

    res.status(200).json({ success: true, session: session || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Session History ──────────────────────────────────────────────────────
export const getSessionHistory = async (req, res) => {
  try {
    const {
      page  = 1,
      limit = 10,
      subject,
      sessionType,
      startDate,
      endDate,
    } = req.query;

    const filter = { student: req.user._id, status: 'completed' };
    if (subject)     filter.subject     = new RegExp(subject, 'i');
    if (sessionType) filter.sessionType = sessionType;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate)   filter.startTime.$lte = new Date(endDate);
    }

    const total    = await StudySession.countDocuments(filter);
    const sessions = await StudySession.find(filter)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('room', 'name subject');

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        total,
        page:       Number(page),
        pages:      Math.ceil(total / limit),
        limit:      Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Study Analytics ──────────────────────────────────────────────────────
export const getStudyAnalytics = async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const since = new Date();
    since.setDate(since.getDate() - Number(period));

    const [totalStats, subjectBreakdown, dailyStats, weeklyXP] =
      await Promise.all([
        // Overall totals
        StudySession.aggregate([
          {
            $match: {
              student: req.user._id,
              status:  'completed',
              startTime: { $gte: since },
            },
          },
          {
            $group: {
              _id:              null,
              totalMinutes:     { $sum: '$durationMinutes' },
              totalSessions:    { $sum: 1 },
              totalXP:          { $sum: '$xpEarned' },
              avgFocusScore:    { $avg: '$focusScore' },
              avgDuration:      { $avg: '$durationMinutes' },
            },
          },
        ]),

        // Per-subject breakdown
        StudySession.aggregate([
          {
            $match: {
              student: req.user._id,
              status:  'completed',
              startTime: { $gte: since },
            },
          },
          {
            $group: {
              _id:           '$subject',
              totalMinutes:  { $sum: '$durationMinutes' },
              sessionCount:  { $sum: 1 },
            },
          },
          { $sort: { totalMinutes: -1 } },
          { $limit: 10 },
        ]),

        // Daily minutes (last N days)
        StudySession.aggregate([
          {
            $match: {
              student: req.user._id,
              status:  'completed',
              startTime: { $gte: since },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
              },
              totalMinutes:  { $sum: '$durationMinutes' },
              sessionCount:  { $sum: 1 },
              xpEarned:      { $sum: '$xpEarned' },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Total XP all time
        StudySession.aggregate([
          {
            $match: { student: req.user._id, status: 'completed' },
          },
          {
            $group: {
              _id:      null,
              totalXP:  { $sum: '$xpEarned' },
            },
          },
        ]),
      ]);

    res.status(200).json({
      success: true,
      analytics: {
        period:           Number(period),
        summary:          totalStats[0]  || { totalMinutes: 0, totalSessions: 0, totalXP: 0 },
        subjectBreakdown: subjectBreakdown,
        dailyStats:       dailyStats,
        allTimeXP:        weeklyXP[0]?.totalXP || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Pomodoro: Start ──────────────────────────────────────────────────────────
export const startPomodoro = async (req, res) => {
  try {
    const {
      subject,
      taskId,
      studySessionId,
      workMinutes           = 25,
      shortBreakMinutes     = 5,
      longBreakMinutes      = 15,
      cyclesBeforeLongBreak = 4,
    } = req.body;

    // Only one active pomodoro at a time
    const existing = await PomodoroSession.findOne({
      student: req.user._id,
      status:  'active',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active Pomodoro session.',
        session: existing,
      });
    }

    const pomodoro = await PomodoroSession.create({
      student:      req.user._id,
      subject:      subject || '',
      task:         taskId         || null,
      studySession: studySessionId || null,
      config: {
        workMinutes,
        shortBreakMinutes,
        longBreakMinutes,
        cyclesBeforeLongBreak,
      },
      startTime: new Date(),
      cycles: [
        {
          cycleNumber: 1,
          phase:       'work',
          startTime:   new Date(),
          completed:   false,
          skipped:     false,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Pomodoro session started. Focus time!',
      pomodoro,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Pomodoro: Complete a Cycle ───────────────────────────────────────────────
export const completePomodoroPhase = async (req, res) => {
  try {
    const { skipped = false } = req.body;

    const pomodoro = await PomodoroSession.findOne({
      _id:    req.params.id,
      student: req.user._id,
      status:  'active',
    });

    if (!pomodoro) {
      return res.status(404).json({
        success: false,
        message: 'Active Pomodoro session not found.',
      });
    }

    const now          = new Date();
    const cfg          = pomodoro.config;
    const currentCycle = pomodoro.cycles[pomodoro.cycles.length - 1];

    // Mark current phase as done
    currentCycle.endTime   = now;
    currentCycle.completed = !skipped;
    currentCycle.skipped   = skipped;

    // Accumulate work / break time
    if (currentCycle.phase === 'work' && !skipped) {
      pomodoro.totalWorkMinutes  += cfg.workMinutes;
      pomodoro.completedCycles   += 1;
    } else if (currentCycle.phase !== 'work') {
      const breakMins =
        currentCycle.phase === 'long_break'
          ? cfg.longBreakMinutes
          : cfg.shortBreakMinutes;
      pomodoro.totalBreakMinutes += breakMins;
    }

    // Determine next phase
    let nextPhase;
    if (currentCycle.phase === 'work') {
      const isLongBreak =
        pomodoro.completedCycles % cfg.cyclesBeforeLongBreak === 0;
      nextPhase = isLongBreak ? 'long_break' : 'short_break';
    } else {
      nextPhase = 'work';
    }

    // Push next cycle
    pomodoro.cycles.push({
      cycleNumber: pomodoro.cycles.length + 1,
      phase:       nextPhase,
      startTime:   now,
      completed:   false,
      skipped:     false,
    });

    await pomodoro.save();

    res.status(200).json({
      success: true,
      message: `Phase complete. Next: ${nextPhase.replace('_', ' ')}.`,
      pomodoro,
      nextPhase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Pomodoro: End ────────────────────────────────────────────────────────────
export const endPomodoro = async (req, res) => {
  try {
    const pomodoro = await PomodoroSession.findOne({
      _id:     req.params.id,
      student: req.user._id,
      status:  'active',
    });

    if (!pomodoro) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    pomodoro.status  = 'completed';
    pomodoro.endTime = new Date();
    pomodoro.xpEarned = pomodoro.completedCycles * 15 + pomodoro.totalWorkMinutes;
    await pomodoro.save();

    res.status(200).json({
      success: true,
      message: `Pomodoro complete! ${pomodoro.completedCycles} cycles done. +${pomodoro.xpEarned} XP`,
      pomodoro,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Active Pomodoro ──────────────────────────────────────────────────────
export const getActivePomodoro = async (req, res) => {
  try {
    const pomodoro = await PomodoroSession.findOne({
      student: req.user._id,
      status:  'active',
    }).populate('task', 'title subject');

    res.status(200).json({ success: true, pomodoro: pomodoro || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Pomodoro History ─────────────────────────────────────────────────────
export const getPomodoroHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const total    = await PomodoroSession.countDocuments({
      student: req.user._id,
      status:  'completed',
    });
    const sessions = await PomodoroSession.find({
      student: req.user._id,
      status:  'completed',
    })
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('task', 'title');

    res.status(200).json({
      success: true,
      sessions,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};