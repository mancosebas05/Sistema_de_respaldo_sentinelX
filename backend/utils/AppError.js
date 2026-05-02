/**
 * Clase de error personalizada para la aplicación
 * Permite identificar errores operacionales vs errores de programación
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Error conocido y manejable
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
