import express from 'express';
import {
  startSession, pauseSession, resumeSession,
  endSession, abandonSession, getActiveSession,
  getSessionHistory, getStudyAnalytics,
  startPomodoro, completePomodoroPhase,
  endPomodoro, getActivePomodoro, getPomodoroHistory,
} from '../controllers/studyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

// Study sessions
router.post('/sessions/start',              startSession);
router.patch('/sessions/:id/pause',         pauseSession);
router.patch('/sessions/:id/resume',        resumeSession);
router.patch('/sessions/:id/end',           endSession);
router.patch('/sessions/:id/abandon',       abandonSession);
router.get('/sessions/active',              getActiveSession);
router.get('/sessions/history',             getSessionHistory);
router.get('/sessions/analytics',           getStudyAnalytics);

// Pomodoro
router.post('/pomodoro/start',              startPomodoro);
router.patch('/pomodoro/:id/phase',         completePomodoroPhase);
router.patch('/pomodoro/:id/end',           endPomodoro);
router.get('/pomodoro/active',              getActivePomodoro);
router.get('/pomodoro/history',             getPomodoroHistory);

export default router;