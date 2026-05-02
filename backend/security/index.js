const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Módulo de seguridad auxiliar
 * Funciones de cifrado, generación de tokens y utilidades de seguridad
 */

/**
 * Generar token seguro aleatorio (para reseteo de contraseña, etc.)
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generar hash SHA-256 de un string
 */
const hashString = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Generar par de tokens JWT (access + refresh)
 */
const generateTokenPair = (userId, rol) => {
  const accessToken = jwt.sign(
    { id: userId, rol, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Verificar fortaleza de contraseña
 */
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    isValid: checks.length && score >= 3,
    score,
    checks,
    level: score >= 5 ? 'fuerte' : score >= 3 ? 'media' : 'débil',
  };
};

/**
 * Sanitizar string para prevenir XSS básico
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Extraer IP real considerando proxies
 */
const getRealIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

module.exports = {
  generateSecureToken,
  hashString,
  generateTokenPair,
  checkPasswordStrength,
  sanitizeString,
  getRealIP,
};
