const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

/**
 * Controller: Autenticación
 * Recibe, valida y delega a AuthService
 */

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos', 400);
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await authService.login({ email, password, ip, userAgent });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token, req.user._id);
    res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol,
        estado: req.user.estado,
        ultimoAcceso: req.user.ultimoAcceso,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, logout, getProfile };
