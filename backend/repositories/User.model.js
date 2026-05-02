const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'Nombre no puede exceder 100 caracteres'],
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener mínimo 8 caracteres'],
    select: false, // No incluir en queries por defecto
  },
  rol: {
    type: String,
    enum: ['admin', 'ti', 'operativo', 'directivo'],
    default: 'operativo',
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'bloqueado'],
    default: 'activo',
  },
  // Seguridad: control de intentos fallidos
  intentosFallidos: {
    type: Number,
    default: 0,
    select: false,
  },
  bloqueadoHasta: {
    type: Date,
    select: false,
  },
  // Sesión y acceso
  ultimoAcceso: {
    type: Date,
  },
  ultimaIP: {
    type: String,
  },
  // Metadata
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  avatarUrl: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Índices ──────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ rol: 1 });
userSchema.index({ estado: 1 });

// ─── Virtual: nombre completo + rol (display) ─────────────
userSchema.virtual('displayInfo').get(function () {
  return `${this.nombre} (${this.rol})`;
});

// ─── Middleware: Hash de contraseña antes de guardar ──────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// ─── Método: Comparar contraseña ──────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Método: Verificar si cuenta está bloqueada ───────────
userSchema.methods.isLocked = function () {
  if (this.estado === 'bloqueado' && this.bloqueadoHasta) {
    return this.bloqueadoHasta > Date.now();
  }
  return false;
};

// ─── Método: Registrar intento fallido ────────────────────
userSchema.methods.registrarIntentoFallido = async function () {
  this.intentosFallidos += 1;
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3;
  
  if (this.intentosFallidos >= maxAttempts) {
    const lockMinutes = parseInt(process.env.LOCK_TIME_MINUTES) || 30;
    this.estado = 'bloqueado';
    this.bloqueadoHasta = new Date(Date.now() + lockMinutes * 60 * 1000);
  }
  
  await this.save({ validateBeforeSave: false });
};

// ─── Método: Resetear intentos fallidos ───────────────────
userSchema.methods.resetearIntentos = async function () {
  this.intentosFallidos = 0;
  this.estado = 'activo';
  this.bloqueadoHasta = undefined;
  this.ultimoAcceso = new Date();
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
