import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

connectDB();

app.use(helmet());

app.use(
  cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use((req, res, next) => {
  console.log('==============================');
  console.log('REQUEST METHOD:', req.method);
  console.log('REQUEST URL:', req.originalUrl);
  console.log('REQUEST HEADERS:', req.headers);
  console.log('REQUEST BODY:', req.body);
  console.log('==============================');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});