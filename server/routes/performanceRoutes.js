import express from 'express';
import {
  getClassPerformance,
  getStudentPerformance,
  getAssignmentLeaderboard,
  getAtRiskStudents,
  getAssignmentReport,
} from '../controllers/performanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('teacher'));

router.get('/class/:roomId',                    getClassPerformance);
router.get('/student/:studentId',               getStudentPerformance);
router.get('/class/:roomId/leaderboard',        getAssignmentLeaderboard);
router.get('/class/:roomId/at-risk',            getAtRiskStudents);
router.get('/assignment/:id/report',            getAssignmentReport);

export default router;
