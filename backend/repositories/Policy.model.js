const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la política es requerido'],
    trim: true,
    maxlength: [150, 'Nombre no puede exceder 150 caracteres'],
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'Descripción no puede exceder 500 caracteres'],
  },
  frecuencia: {
    type: String,
    enum: ['diaria', 'semanal', 'mensual', 'personalizada'],
    required: [true, 'La frecuencia es requerida'],
  },
  // Expresión cron para la programación
  cronExpression: {
    type: String,
    required: true,
    // Ejemplos: '0 2 * * *' (diaria 2am), '0 2 * * 0' (semanal dom), '0 2 1 * *' (mensual)
  },
  tipoCopia: {
    type: String,
    enum: ['completa', 'incremental', 'diferencial'],
    required: [true, 'El tipo de copia es requerido'],
  },
  // Activos de información incluidos
  activos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
  }],
  // Retención
  diasRetencion: {
    type: Number,
    required: true,
    min: [1, 'Mínimo 1 día de retención'],
    max: [3650, 'Máximo 10 años de retención'],
    default: 30,
  },
  // Almacenamiento destino
  rutaAlmacenamiento: {
    type: String,
    required: true,
    default: './storage/backups',
  },
  // Estado
  estado: {
    type: String,
    enum: ['activa', 'inactiva', 'pausada'],
    default: 'activa',
  },
  // Seguridad
  cifradoHabilitado: {
    type: Boolean,
    default: true,
  },
  // Notificaciones
  notificarFallos: {
    type: Boolean,
    default: true,
  },
  notificarExito: {
    type: Boolean,
    default: false,
  },
  // Estadísticas
  totalEjecuciones: {
    type: Number,
    default: 0,
  },
  ultimaEjecucion: {
    type: Date,
  },
  proximaEjecucion: {
    type: Date,
  },
  // Auditoría
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modificadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

policySchema.index({ estado: 1 });
policySchema.index({ creadoPor: 1 });
policySchema.index({ proximaEjecucion: 1 });

module.exports = mongoose.model('Policy', policySchema);
