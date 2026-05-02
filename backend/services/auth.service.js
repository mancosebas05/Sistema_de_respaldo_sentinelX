const jwt = require('jsonwebtoken');
const User = require('../repositories/User.model');
const { Session, ActivityLog, Notification } = require('../repositories/models');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Service: Autenticación y gestión de sesiones
 * Responsabilidad única: login, logout, refresh, generación de tokens
 */
class AuthService {
  
  /**
   * Generar JWT de acceso
   */
  generateAccessToken(userId, rol) {
    return jwt.sign(
      { id: userId, rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
  }

  /**
   * Login de usuario con manejo de intentos fallidos y bloqueo
   */
  async login({ email, password, ip, userAgent }) {
    // 1. Buscar usuario con campos sensibles
    const user = await User.findOne({ email })
      .select('+password +intentosFallidos +bloqueadoHasta +estado');

    // 2. Registrar intento en log (sin revelar si existe el usuario)
    const logBase = { ipOrigen: ip, userAgent, modulo: 'auth' };

    // 3. Verificar existencia
    if (!user) {
      await this._logActivity({
        accion: 'LOGIN_FAILED',
        descripcion: `Intento de login fallido para email: ${email} (usuario no encontrado)`,
        resultado: 'failed',
        usuarioEmail: email,
        ...logBase,
      });
      throw new AppError('Credenciales incorrectas', 401);
    }

    // 4. Verificar si está bloqueado
    if (user.isLocked()) {
      const minutosRestantes = Math.ceil((user.bloqueadoHasta - Date.now()) / 60000);
      await this._logActivity({
        usuario: user._id,
        usuarioEmail: user.email,
        accion: 'LOGIN_FAILED',
        descripcion: `Intento de acceso a cuenta bloqueada. Minutos restantes: ${minutosRestantes}`,
        resultado: 'failed',
        ...logBase,
      });
      throw new AppError(`Cuenta bloqueada. Intente en ${minutosRestantes} minutos o contacte al administrador.`, 423);
    }

    // 5. Verificar estado de la cuenta
    if (user.estado === 'inactivo') {
      throw new AppError('Cuenta inactiva. Contacte al administrador.', 403);
    }

    // 6. Verificar contraseña
    const passwordValida = await user.comparePassword(password);
    if (!passwordValida) {
      await user.registrarIntentoFallido();
      
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3;
      const intentosRestantes = maxAttempts - user.intentosFallidos;
      
      // Si se bloqueó, notificar al admin
      if (user.estado === 'bloqueado') {
        await this._notificarBloqueo(user, ip);
        await this._logActivity({
          usuario: user._id, usuarioEmail: user.email,
          accion: 'ACCOUNT_LOCKED',
          descripcion: `Cuenta bloqueada por ${maxAttempts} intentos fallidos desde IP: ${ip}`,
          resultado: 'warning', ...logBase,
        });
      }

      await this._logActivity({
        usuario: user._id, usuarioEmail: user.email,
        accion: 'LOGIN_FAILED',
        descripcion: `Contraseña incorrecta. Intentos restantes: ${Math.max(0, intentosRestantes)}`,
        resultado: 'failed', ...logBase,
      });

      throw new AppError(
        intentosRestantes > 0
          ? `Credenciales incorrectas. ${intentosRestantes} intento(s) restantes.`
          : 'Cuenta bloqueada por seguridad. Contacte al administrador.',
        401
      );
    }

    // 7. Login exitoso - resetear intentos
    await user.resetearIntentos();
    user.ultimaIP = ip;
    await User.findByIdAndUpdate(user._id, { ultimoAcceso: new Date(), ultimaIP: ip });

    // 8. Generar token
    const token = this.generateAccessToken(user._id, user.rol);

    // 9. Crear sesión en BD
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);
    
    await Session.create({
      usuario: user._id,
      token,
      ip,
      userAgent,
      activa: true,
      expiresAt,
    });

    // 10. Registrar log de acceso exitoso
    await this._logActivity({
      usuario: user._id, usuarioEmail: user.email,
      accion: 'LOGIN',
      descripcion: `Inicio de sesión exitoso desde IP: ${ip}`,
      resultado: 'success', ...logBase,
    });

    logger.info(`Login exitoso: ${user.email} desde ${ip}`);

    return {
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        ultimoAcceso: user.ultimoAcceso,
      },
    };
  }

  /**
   * Logout - invalidar sesión
   */
  async logout(token, userId) {
    await Session.findOneAndUpdate({ token }, { activa: false });
    
    const user = await User.findById(userId);
    await this._logActivity({
      usuario: userId,
      usuarioEmail: user?.email,
      accion: 'LOGOUT',
      descripcion: 'Cierre de sesión',
      resultado: 'success',
      modulo: 'auth',
    });
  }

  /**
   * Registrar actividad en log de auditoría
   */
  async _logActivity(data) {
    try {
      await ActivityLog.create(data);
    } catch (err) {
      logger.error('Error guardando log de actividad:', err.message);
    }
  }

  /**
   * Notificar al admin cuando una cuenta es bloqueada
   */
  async _notificarBloqueo(user, ip) {
    try {
      const admins = await User.find({ rol: 'admin', estado: 'activo' });
      const notificaciones = admins.map(admin => ({
        destinatario: admin._id,
        tipo: 'critico',
        titulo: '🔒 Cuenta bloqueada por seguridad',
        mensaje: `La cuenta ${user.email} fue bloqueada tras múltiples intentos fallidos desde IP: ${ip}`,
        referenciaModulo: 'users',
        referenciaId: user._id,
      }));
      
      if (notificaciones.length > 0) {
        await Notification.insertMany(notificaciones);
      }
    } catch (err) {
      logger.error('Error creando notificación de bloqueo:', err.message);
    }
  }
}

module.exports = new AuthService();
