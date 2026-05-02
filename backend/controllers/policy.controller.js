const Policy = require('../repositories/Policy.model');
const { ActivityLog } = require('../repositories/models');
const { schedulePolicy, unschedulePolicy, buildCronExpression } = require('../scheduler');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 20 } = req.query;
    const query = {};
    if (estado) query.estado = estado;

    const total = await Policy.countDocuments(query);
    const policies = await Policy.find(query)
      .populate('creadoPor', 'nombre email')
      .populate('activos', 'nombre tipo criticidad')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, data: { policies, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('creadoPor', 'nombre email')
      .populate('activos');
    if (!policy) throw new AppError('Política no encontrada', 404);
    res.json({ success: true, data: policy });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { nombre, descripcion, frecuencia, tipoCopia, activos, diasRetencion, rutaAlmacenamiento, horaEjecucion, cifradoHabilitado, notificarFallos, notificarExito } = req.body;

    const cronExpression = buildCronExpression(frecuencia, horaEjecucion || '02:00');
    
    // Calcular próxima ejecución aproximada
    const proximaEjecucion = new Date();
    proximaEjecucion.setDate(proximaEjecucion.getDate() + 1);

    const policy = await Policy.create({
      nombre, descripcion, frecuencia, tipoCopia, activos, diasRetencion,
      rutaAlmacenamiento: rutaAlmacenamiento || process.env.BACKUP_STORAGE_PATH || './storage/backups',
      cronExpression, proximaEjecucion,
      cifradoHabilitado: cifradoHabilitado !== false,
      notificarFallos: notificarFallos !== false,
      notificarExito: notificarExito || false,
      creadoPor: req.user._id,
    });

    // Programar en el scheduler
    schedulePolicy(policy);

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'POLICY_CREATE', modulo: 'policies',
      descripcion: `Política creada: ${nombre} | Frecuencia: ${frecuencia} | Tipo: ${tipoCopia}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.status(201).json({ success: true, message: 'Política creada y programada', data: policy });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { frecuencia, horaEjecucion, ...rest } = req.body;
    const updateData = { ...rest, modificadoPor: req.user._id };

    if (frecuencia) {
      updateData.frecuencia = frecuencia;
      updateData.cronExpression = buildCronExpression(frecuencia, horaEjecucion || '02:00');
    }

    const policy = await Policy.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!policy) throw new AppError('Política no encontrada', 404);

    // Reprogramar en el scheduler
    const { reschedulePolicy } = require('../scheduler');
    await reschedulePolicy(req.params.id);

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'POLICY_UPDATE', modulo: 'policies',
      descripcion: `Política actualizada: ${policy.nombre}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: 'Política actualizada', data: policy });
  } catch (error) { next(error); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) throw new AppError('Política no encontrada', 404);

    const nuevoEstado = policy.estado === 'activa' ? 'inactiva' : 'activa';
    policy.estado = nuevoEstado;
    await policy.save();

    if (nuevoEstado === 'activa') {
      schedulePolicy(policy);
    } else {
      unschedulePolicy(policy._id);
    }

    const accion = nuevoEstado === 'activa' ? 'POLICY_ACTIVATE' : 'POLICY_DEACTIVATE';
    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion, modulo: 'policies',
      descripcion: `Política ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'}: ${policy.nombre}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: `Política ${nuevoEstado}`, data: { estado: nuevoEstado } });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) throw new AppError('Política no encontrada', 404);

    unschedulePolicy(req.params.id);

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'POLICY_DELETE', modulo: 'policies',
      descripcion: `Política eliminada: ${policy.nombre}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: 'Política eliminada' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, toggleStatus, remove };
