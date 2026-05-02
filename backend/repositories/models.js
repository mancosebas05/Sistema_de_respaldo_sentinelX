const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════
// MODELO: Activo de Información
// ═══════════════════════════════════════════════════════════
const assetSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del activo es requerido'],
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['archivo', 'carpeta', 'base_datos', 'sistema'],
    required: true,
  },
  ruta: {
    type: String,
    required: [true, 'La ruta del activo es requerida'],
    trim: true,
  },
  criticidad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media',
  },
  descripcion: { type: String, trim: true },
  tamanoEstimadoMB: { type: Number, default: 0 },
  politica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

assetSchema.index({ tipo: 1, criticidad: 1 });

// ═══════════════════════════════════════════════════════════
// MODELO: Respaldo (Backup)
// ═══════════════════════════════════════════════════════════
const backupSchema = new mongoose.Schema({
  identificador: {
    type: String,
    unique: true,
    required: true,
  },
  politica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
  },
  activos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
  }],
  tipoCopia: {
    type: String,
    enum: ['completa', 'incremental', 'diferencial'],
    required: true,
  },
  estado: {
    type: String,
    enum: ['en_progreso', 'exitoso', 'fallido', 'corrupto'],
    default: 'en_progreso',
  },
  fechaInicio: { type: Date, default: Date.now },
  fechaFin: { type: Date },
  duracionSegundos: { type: Number },
  tamanoBytes: { type: Number, default: 0 },
  rutaAlmacenamiento: { type: String },
  // Integridad SHA-256
  hashSHA256: { type: String },
  integridadVerificada: { type: Boolean, default: false },
  fechaVerificacion: { type: Date },
  // Expiración (retención)
  fechaVencimiento: { type: Date },
  eliminado: { type: Boolean, default: false },
  // Error si falló
  mensajeError: { type: String },
  // Disparado por
  disparadoPor: {
    type: String,
    enum: ['automatico', 'manual'],
    default: 'automatico',
  },
  ejecutadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

backupSchema.index({ politica: 1, estado: 1 });
backupSchema.index({ fechaVencimiento: 1 });
backupSchema.index({ identificador: 1 });

// ═══════════════════════════════════════════════════════════
// MODELO: Restauración
// ═══════════════════════════════════════════════════════════
const restoreSchema = new mongoose.Schema({
  respaldo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backup',
    required: true,
  },
  solicitadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tipoRestauracion: {
    type: String,
    enum: ['total', 'selectiva'],
    required: true,
  },
  archivosRestaurados: [{ type: String }],
  destinoRestauracion: {
    type: String,
    enum: ['ubicacion_original', 'ubicacion_alternativa'],
    default: 'ubicacion_original',
  },
  rutaDestino: { type: String },
  estado: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'exitoso', 'fallido'],
    default: 'pendiente',
  },
  integridadVerificada: { type: Boolean, default: false },
  fechaInicio: { type: Date },
  fechaFin: { type: Date },
  duracionSegundos: { type: Number },
  mensajeError: { type: String },
  notas: { type: String },
}, { timestamps: true });

restoreSchema.index({ solicitadoPor: 1, estado: 1 });

// ═══════════════════════════════════════════════════════════
// MODELO: Registro de Actividad (Audit Log) - INMUTABLE
// ═══════════════════════════════════════════════════════════
const activityLogSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  usuarioEmail: { type: String }, // Guardar email directo para inmutabilidad
  accion: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED',
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
      'POLICY_CREATE', 'POLICY_UPDATE', 'POLICY_DELETE', 'POLICY_ACTIVATE', 'POLICY_DEACTIVATE',
      'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_DELETE',
      'BACKUP_START', 'BACKUP_SUCCESS', 'BACKUP_FAILED', 'BACKUP_DELETE',
      'RESTORE_REQUEST', 'RESTORE_SUCCESS', 'RESTORE_FAILED',
      'INTEGRITY_CHECK', 'INTEGRITY_FAILED',
      'REPORT_EXPORT', 'CONFIG_UPDATE',
    ],
  },
  modulo: {
    type: String,
    enum: ['auth', 'users', 'policies', 'assets', 'backups', 'restore', 'reports', 'config', 'scheduler'],
    required: true,
  },
  descripcion: { type: String, required: true },
  ipOrigen: { type: String },
  userAgent: { type: String },
  resultado: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success',
  },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Datos adicionales del evento
}, {
  timestamps: true,
  // Los logs son inmutables - no permitir actualizaciones
});

// Solo índices de lectura - no permitir borrado
activityLogSchema.index({ usuario: 1, createdAt: -1 });
activityLogSchema.index({ accion: 1, createdAt: -1 });
activityLogSchema.index({ modulo: 1 });
activityLogSchema.index({ resultado: 1 });

// ═══════════════════════════════════════════════════════════
// MODELO: Notificación
// ═══════════════════════════════════════════════════════════
const notificationSchema = new mongoose.Schema({
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tipo: {
    type: String,
    enum: ['error', 'warning', 'success', 'info', 'critico'],
    required: true,
  },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  leida: { type: Boolean, default: false },
  fechaLectura: { type: Date },
  // Referencia al evento que generó la notificación
  referenciaModulo: { type: String },
  referenciaId: { type: mongoose.Schema.Types.ObjectId },
  // Enviada por email
  enviadaEmail: { type: Boolean, default: false },
  fechaEnvioEmail: { type: Date },
}, { timestamps: true });

notificationSchema.index({ destinatario: 1, leida: 1 });
notificationSchema.index({ tipo: 1, createdAt: -1 });

// ═══════════════════════════════════════════════════════════
// MODELO: Sesión de Usuario
// ═══════════════════════════════════════════════════════════
const sessionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  activa: { type: Boolean, default: true },
  expiresAt: {
    type: Date,
    required: true,
  },
  ultimaActividad: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

sessionSchema.index({ usuario: 1, activa: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL automático

module.exports = {
  Asset: mongoose.model('Asset', assetSchema),
  Backup: mongoose.model('Backup', backupSchema),
  Restore: mongoose.model('Restore', restoreSchema),
  ActivityLog: mongoose.model('ActivityLog', activityLogSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Session: mongoose.model('Session', sessionSchema),
};
