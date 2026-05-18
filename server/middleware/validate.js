import { body, validationResult } from 'express-validator';

/* ================= REGISTER RULES ================= */
export const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .isIn(['student', 'teacher', 'parent'])
    .withMessage('Invalid role'),
];

/* ================= LOGIN RULES ================= */
export const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/* ================= VALIDATE ================= */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];

    return res.status(400).json({
      success: false,
      field: firstError.path,
      message: firstError.msg,
    });
  }

  next();
};