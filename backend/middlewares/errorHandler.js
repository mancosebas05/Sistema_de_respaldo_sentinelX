const logger = require('../config/logger');

/**
 * Manejador global de errores de Express
 * Centraliza el manejo y formateo de todos los errores de la aplicación
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // ─── Errores de Mongoose ────────────────────────────────
  // ID inválido
  if (err.name === 'CastError') {
    error.message = `Recurso no encontrado con ID: ${err.value}`;
    error.statusCode = 404;
  }

  // Duplicado (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `El valor '${err.keyValue[field]}' ya existe para el campo '${field}'`;
    error.statusCode = 400;
  }

  // Validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.message = messages.join('. ');
    error.statusCode = 400;
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token inválido';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expirado';
    error.statusCode = 401;
  }

  // Log del error
  if (error.statusCode >= 500) {
    logger.error(`[${error.statusCode}] ${error.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: err.stack,
    });
  } else {
    logger.warn(`[${error.statusCode}] ${error.message}`, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
