const jwt = require('jsonwebtoken');
const User = require('../repositories/User.model');
const { Session } = require('../repositories/models');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Middleware de autenticación JWT
 * Verifica token, sesión activa y tiempo de inactividad
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticación requerido', 401);
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar firma del JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Token expirado. Inicie sesión nuevamente.', 401);
      }
      throw new AppError('Token inválido', 401);
    }

    // 3. Verificar sesión activa en BD
    const session = await Session.findOne({ token, activa: true });
    if (!session) {
      throw new AppError('Sesión no válida o expirada', 401);
    }

    // 4. Verificar timeout de inactividad (10 minutos)
    const inactivityLimit = (parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 10) * 60 * 1000;
    const now = Date.now();
    if (now - session.ultimaActividad.getTime() > inactivityLimit) {
      await Session.findByIdAndUpdate(session._id, { activa: false });
      throw new AppError('Sesión cerrada por inactividad. Inicie sesión nuevamente.', 401);
    }

    // 5. Actualizar última actividad
    await Session.findByIdAndUpdate(session._id, { ultimaActividad: new Date() });

    // 6. Cargar usuario
    const user = await User.findById(decoded.id).select('+estado +rol');
    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (user.estado !== 'activo') {
      throw new AppError('Cuenta inactiva o bloqueada. Contacte al administrador.', 403);
    }

    // 7. Adjuntar usuario y sesión a la request
    req.user = user;
    req.sessionId = session._id;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware RBAC - verificar permiso para recurso y acción
 */
const authorize = (resource, action) => {
  return (req, res, next) => {
    const { hasPermission } = require('../config/rbac');
    
    if (!req.user) {
      return next(new AppError('Autenticación requerida', 401));
    }

    if (!hasPermission(req.user.rol, resource, action)) {
      logger.warn(`Acceso denegado: usuario ${req.user.email} (${req.user.rol}) intentó ${action} en ${resource}`);
      return next(new AppError(`No tiene permisos para realizar esta acción`, 403));
    }

    next();
  };
};

/**
 * Middleware: solo para roles específicos
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return next(new AppError('No autorizado para esta operación', 403));
    }
    next();
  };
};

module.exports = { authenticate, authorize, requireRoles };
