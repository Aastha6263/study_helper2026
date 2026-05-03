import express from 'express';
import {
  createRoom, getMyRooms, getRoomById, updateRoom,
  deleteRoom, regenerateInviteCode, addStudents,
  removeStudent, joinRoom, leaveRoom,
  postAnnouncement, deleteAnnouncement, addResource,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Any authenticated user
router.get('/',              getMyRooms);
router.get('/:id',           getRoomById);
router.post('/join',         joinRoom);
router.post('/:id/leave',    leaveRoom);

// Teacher / co-teacher only
router.post('/',
  authorize('teacher'), createRoom);

router.put('/:id',
  authorize('teacher'), updateRoom);

router.delete('/:id',
  authorize('teacher'), deleteRoom);

router.patch('/:id/invite-code',
  authorize('teacher'), regenerateInviteCode);

router.post('/:id/students',
  authorize('teacher'), addStudents);

router.delete('/:id/students/:studentId',
  authorize('teacher'), removeStudent);

router.post('/:id/announcements',
  authorize('teacher'), postAnnouncement);

router.delete('/:id/announcements/:announcementId',
  authorize('teacher'), deleteAnnouncement);

router.post('/:id/resources',
  authorize('teacher'), addResource);

export default router;