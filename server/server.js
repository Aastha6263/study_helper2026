import express       from 'express';
import http          from 'http';
import { Server }    from 'socket.io';
import dotenv        from 'dotenv';
import cors          from 'cors';
import helmet        from 'helmet';
import morgan        from 'morgan';
import cookieParser  from 'cookie-parser';

import connectDB                  from './config/db.js';
import { initFirebase }           from './config/firebase.js';
import { verifyMailer }           from './config/nodemailer.js';
import { registerSocketHandlers } from './socket/socketHandler.js';
import { registerCronJobs }       from './services/cronService.js';
import { setNotificationIo }      from './services/notificationService.js';

import authRoutes          from './routes/authRoutes.js';
import studyRoutes         from './routes/studyRoutes.js';
import noteRoutes          from './routes/noteRoutes.js';
import taskRoutes          from './routes/taskRoutes.js';
import roomRoutes          from './routes/roomRoutes.js';
import assignmentRoutes    from './routes/assignmentRoutes.js';
import performanceRoutes   from './routes/performanceRoutes.js';
import parentRoutes        from './routes/parentRoutes.js';
import notificationRoutes  from './routes/notificationRoutes.js';
import { errorHandler, notFound } from './middleware/errorMIddleware.js';

dotenv.config();
connectDB();

// ── Third-party services ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  initFirebase();
  verifyMailer();
  registerCronJobs(io);
}

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin:      process.env.CLIENT_URL,
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
});

registerSocketHandlers(io);
setNotificationIo(io);
registerCronJobs(io);

// ── Express middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/study',         studyRoutes);
app.use('/api/notes',         noteRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/rooms',         roomRoutes);
app.use('/api/assignments',   assignmentRoutes);
app.use('/api/performance',   performanceRoutes);
app.use('/api/parent',        parentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() })
);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`[Server] running on port ${PORT} — ${process.env.NODE_ENV}`)
);
