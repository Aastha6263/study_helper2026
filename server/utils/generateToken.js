import jwt from 'jsonwebtoken';

// Generate JWT and set as HTTP-only cookie
export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  res.cookie('studysync_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};

// Generate a plain JWT (used for email verification links etc.)
export const generateToken = (payload, expiresIn = '1d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify a JWT
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};