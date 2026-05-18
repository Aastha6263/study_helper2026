import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfile,
} from '../controllers/authController.js';

import {
  registerRules,
  loginRules,
  validate,
} from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/* ================= REGISTER ================= */
router.post(
  '/register',
  registerRules,
  validate,
  registerUser
);

/* ================= LOGIN ================= */
router.post(
  '/login',
  loginRules,
  validate,
  loginUser
);

/* ================= LOGOUT ================= */
router.post(
  '/logout',
  logoutUser
);

/* ================= CURRENT USER ================= */
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

export default router;