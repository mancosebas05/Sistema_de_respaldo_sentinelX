/**
 * SENTINELX - Server Entry Point
 * Sistema de Respaldo Automatizado y Centralizado
 * Arquitectura: 3 Capas (MVC) | SOLID | RBAC | JWT
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');
const { initScheduler } = require('./scheduler');

// ─── Importar Rutas ───────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const policyRoutes = require('./routes/policy.routes');
const assetRoutes = require('./routes/asset.routes');
const backupRoutes = require('./routes/backup.routes');
const restoreRoutes = require('./routes/restore.routes');
const notificationRoutes = require('./routes/notification.routes');
const logRoutes = require('./routes/log.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// ─── Conexión a Base de Datos ─────────────────────────────
connectDB();

// ─── Middlewares Globales de Seguridad ────────────────────
app.use(helmet());
app.use(mongoSanitize()); // Prevenir inyección MongoDB

// Rate Limiting global
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Demasiadas solicitudes. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate Limiting estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Demasiados intentos de autenticación.' },
});
app.use('/api/auth/', authLimiter);

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
    const allowed = ['http://localhost:3000', process.env.CORS_ORIGIN].filter(Boolean);
    if (isLocal || allowed.includes(origin)) return callback(null, true);
    callback(new Error('CORS no permitido: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging HTTP ─────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Rutas de la API ──────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/policies`, policyRoutes);
app.use(`${API_PREFIX}/assets`, assetRoutes);
app.use(`${API_PREFIX}/backups`, backupRoutes);
app.use(`${API_PREFIX}/restore`, restoreRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/logs`, logRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    system: 'SentinelX',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada` });
});

// ─── Manejador Global de Errores ──────────────────────────
app.use(errorHandler);

// ─── Iniciar Servidor ─────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🛡️  SentinelX API corriendo en puerto ${PORT} [${process.env.NODE_ENV}]`);
  
  // Inicializar Scheduler de tareas automáticas
  initScheduler();
  logger.info('⏱️  Scheduler de respaldos automáticos inicializado');
});

// ─── Manejo de errores no capturados ─────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = server;