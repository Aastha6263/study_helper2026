import nodemailer from 'nodemailer';
import dotenv     from 'dotenv';
dotenv.config();

// ── Create reusable transporter ───────────────────────────────────────────────
const createTransporter = () => {
  // Gmail (production)
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool:              true,
      maxConnections:    5,
      rateDelta:         20000,
      rateLimit:         5,
    });
  }

  // Ethereal (development — fake SMTP, no real emails sent)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'test@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'testpassword',
    },
  });
};

export const transporter = createTransporter();

// ── Verify connection on startup ──────────────────────────────────────────────
export const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log('[Mailer] SMTP connection verified.');
  } catch (err) {
    console.error('[Mailer] SMTP connection failed:', err.message);
  }
};

export default transporter;