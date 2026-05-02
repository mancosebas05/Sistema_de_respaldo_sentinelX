const User = require('../repositories/User.model');
const { ActivityLog, Notification } = require('../repositories/models');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { rol, estado, page = 1, limit = 20 } = req.query;
    const query = {};
    if (rol) query.rol = rol;
    if (estado) query.estado = estado;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('creadoPor', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, data: { users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('creadoPor', 'nombre email');
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) throw new AppError('Nombre, email y contraseña son requeridos', 400);

    const user = await User.create({ nombre, email, password, rol, creadoPor: req.user._id });

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'USER_CREATE', modulo: 'users',
      descripcion: `Usuario creado: ${email} con rol ${rol}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.status(201).json({ success: true, message: 'Usuario creado', data: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    // No permitir actualizar contraseña por esta ruta
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) throw new AppError('Usuario no encontrado', 404);

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'USER_UPDATE', modulo: 'users',
      descripcion: `Usuario actualizado: ${user.email}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: 'Usuario actualizado', data: user });
  } catch (error) { next(error); }
};

const unlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+intentosFallidos +bloqueadoHasta');
    if (!user) throw new AppError('Usuario no encontrado', 404);

    user.intentosFallidos = 0;
    user.estado = 'activo';
    user.bloqueadoHasta = undefined;
    await user.save({ validateBeforeSave: false });

    // Notificar al usuario desbloqueado
    await Notification.create({
      destinatario: user._id,
      tipo: 'info',
      titulo: '✅ Cuenta desbloqueada',
      mensaje: `Tu cuenta ha sido desbloqueada por el administrador ${req.user.nombre}. Ya puedes iniciar sesión.`,
      referenciaModulo: 'users',
    });

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'ACCOUNT_UNLOCKED', modulo: 'users',
      descripcion: `Cuenta desbloqueada por administrador: ${user.email}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: `Cuenta de ${user.email} desbloqueada exitosamente` });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) throw new AppError('No puede eliminar su propia cuenta', 400);
    
    const user = await User.findByIdAndUpdate(req.params.id, { estado: 'inactivo' }, { new: true });
    if (!user) throw new AppError('Usuario no encontrado', 404);

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'USER_DELETE', modulo: 'users',
      descripcion: `Usuario desactivado: ${user.email}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: 'Usuario desactivado' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, unlock, remove };
