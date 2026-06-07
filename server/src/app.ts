import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Load routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import groupRoutes from './routes/groupRoutes';
import callRoutes from './routes/callRoutes';
import adminRoutes from './routes/adminRoutes';

// Load middlewares
import { errorHandler } from './middleware/errorHandler';
import { mongoSanitize, xssSanitize } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';
import { setupSocket } from './socket';

// Initialize environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/connectsphere';

// Enable trust proxy for rate limiters behind reverse proxies (like Render or Vercel)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom simple cookie parser middleware
app.use((req: any, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts[1] ? parts[1].trim() : '';
      req.cookies[name] = decodeURIComponent(value);
    });
  }
  next();
});

// Security Sanitization
app.use(mongoSanitize);
app.use(xssSanitize);

// Rate Limiting
app.use('/api/', apiLimiter);

// Serve static uploaded files
const uploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);

// Default Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ConnectSphere API - Real-Time Communication Platform',
    developer: 'Mukesh Podugu',
    version: '1.0.0'
  });
});

// WebSockets Socket.IO Setup
setupSocket(io);

// Global Error Handler
app.use(errorHandler);

// Connect to Database and start server
const startServer = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGO_URI);
    console.log('[Database] MongoDB Connected successfully.');
  } catch (err: any) {
    console.warn('\n=============================================================');
    console.warn('[WARNING] MongoDB connection failed:', err.message);
    console.warn('Backend running in OFFLINE/DEMO mode (Mongoose models will fail without active DB).');
    console.warn('Set MONGO_URI in a server/.env file to connect to your cluster.');
    console.warn('=============================================================\n');
  }

  server.listen(PORT, () => {
    console.log(`[Server] ConnectSphere running on http://localhost:${PORT}`);
  });
};

startServer();
