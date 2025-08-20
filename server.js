const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const socketHandler = require('./src/services/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect DB
connectDB();

// Security & perf middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000'],
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: logger.stream }));

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// API routes
app.use('/api', routes);

// 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use(errorHandler);

// Sockets
socketHandler(io);

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("🚀 Backend API is running...");
});

const listEndpoints = require("express-list-endpoints");

// Print endpoints when server starts
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.table(listEndpoints(app));
});

module.exports = { app, io };
