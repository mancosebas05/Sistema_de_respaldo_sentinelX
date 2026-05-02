const Joi = require('joi');

// ─── Validación de Login ──────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener mínimo 6 caracteres',
    'any.required': 'La contraseña es requerida',
  }),
});

// ─── Validación de Usuario ────────────────────────────────
const createUserSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'La contraseña debe tener mínimo 8 caracteres',
  }),
  rol: Joi.string().valid('admin', 'ti', 'operativo', 'directivo').default('operativo'),
});

// ─── Validación de Política ───────────────────────────────
const createPolicySchema = Joi.object({
  nombre: Joi.string().min(3).max(150).required(),
  descripcion: Joi.string().max(500).optional().allow(''),
  frecuencia: Joi.string().valid('diaria', 'semanal', 'mensual', 'personalizada').required(),
  tipoCopia: Joi.string().valid('completa', 'incremental', 'diferencial').required(),
  activos: Joi.array().items(Joi.string()).optional(),
  diasRetencion: Joi.number().integer().min(1).max(3650).default(30),
  horaEjecucion: Joi.string().pattern(/^\d{2}:\d{2}$/).default('02:00'),
  rutaAlmacenamiento: Joi.string().optional().allow(''),
  cifradoHabilitado: Joi.boolean().default(true),
  notificarFallos: Joi.boolean().default(true),
  notificarExito: Joi.boolean().default(false),
});

// ─── Validación de Activo ─────────────────────────────────
const createAssetSchema = Joi.object({
  nombre: Joi.string().min(2).max(150).required(),
  tipo: Joi.string().valid('archivo', 'carpeta', 'base_datos', 'sistema').required(),
  ruta: Joi.string().min(2).required(),
  criticidad: Joi.string().valid('alta', 'media', 'baja').default('media'),
  descripcion: Joi.string().max(500).optional().allow(''),
  tamanoEstimadoMB: Joi.number().min(0).optional(),
  politica: Joi.string().optional().allow('', null),
});

// ─── Middleware validador genérico ────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join('. ');
    return res.status(400).json({ success: false, message: messages });
  }
  req.body = value;
  next();
};

module.exports = {
  validateLogin: validate(loginSchema),
  validateCreateUser: validate(createUserSchema),
  validateCreatePolicy: validate(createPolicySchema),
  validateCreateAsset: validate(createAssetSchema),
};
