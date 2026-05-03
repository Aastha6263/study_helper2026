import express from 'express';
import {
  // Linking
  sendLinkRequest,
  respondToLinkRequest,
  getMyLinkRequests,
  getMyChildren,
  revokeLink,
  updateLinkSettings,
  // Child data
  getChildProfile,
  getChildStudySessions,
  getChildTasks,
  getChildAssignments,
  // Analytics
  getChildAnalytics,
  getWeeklyComparison,
  // Reports
  generateReport,
  getReports,
  getReportById,
  deleteReport,
  getMultiChildOverview,
} from '../controllers/parentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// ── Linking (parent-initiated) ─────────────────────────────────────────────
router.post('/link',
  authorize('parent'), sendLinkRequest);

router.get('/children',
  authorize('parent'), getMyChildren);

router.delete('/link/:linkId',
  authorize('parent'), revokeLink);

router.put('/link/:linkId/settings',
  authorize('parent'), updateLinkSettings);

// ── Linking (child-initiated response) ────────────────────────────────────
router.get('/link-requests',
  authorize('student'), getMyLinkRequests);

router.patch('/link/:linkId/respond',
  authorize('student'), respondToLinkRequest);

// ── Multi-child dashboard ──────────────────────────────────────────────────
router.get('/overview',
  authorize('parent'), getMultiChildOverview);

// ── Child data ─────────────────────────────────────────────────────────────
router.get('/child/:childId/profile',
  authorize('parent'), getChildProfile);

router.get('/child/:childId/study-sessions',
  authorize('parent'), getChildStudySessions);

router.get('/child/:childId/tasks',
  authorize('parent'), getChildTasks);

router.get('/child/:childId/assignments',
  authorize('parent'), getChildAssignments);

// ── Analytics ──────────────────────────────────────────────────────────────
router.get('/child/:childId/analytics',
  authorize('parent'), getChildAnalytics);

router.get('/child/:childId/weekly-comparison',
  authorize('parent'), getWeeklyComparison);

// ── Reports ────────────────────────────────────────────────────────────────
router.post('/child/:childId/reports',
  authorize('parent'), generateReport);

router.get('/child/:childId/reports',
  authorize('parent'), getReports);

router.get('/reports/:reportId',
  authorize('parent'), getReportById);

router.delete('/reports/:reportId',
  authorize('parent'), deleteReport);

export default router;