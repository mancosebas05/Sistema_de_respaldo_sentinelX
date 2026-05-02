const { Backup } = require('../repositories/models');
const backupEngine = require('../services/backup.engine');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, estado, policyId } = req.query;
    const query = { eliminado: false };
    if (estado) query.estado = estado;
    if (policyId) query.politica = policyId;

    const total = await Backup.countDocuments(query);
    const backups = await Backup.find(query)
      .populate('politica', 'nombre tipoCopia')
      .populate('ejecutadoPor', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, data: { backups, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const backup = await Backup.findById(req.params.id)
      .populate('politica', 'nombre')
      .populate('activos', 'nombre ruta tipo')
      .populate('ejecutadoPor', 'nombre email');
    if (!backup) throw new AppError('Respaldo no encontrado', 404);
    res.json({ success: true, data: backup });
  } catch (error) { next(error); }
};

const executeManual = async (req, res, next) => {
  try {
    const { policyId } = req.body;
    if (!policyId) throw new AppError('ID de política requerido', 400);

    const result = await backupEngine.executeBackup(policyId, 'manual', req.user._id);
    res.status(202).json({ success: true, message: 'Respaldo iniciado', data: result });
  } catch (error) { next(error); }
};

const verifyIntegrity = async (req, res, next) => {
  try {
    const result = await backupEngine.verifyIntegrity(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const deleteBackup = async (req, res, next) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) throw new AppError('Respaldo no encontrado', 404);
    await Backup.findByIdAndUpdate(req.params.id, { eliminado: true });
    res.json({ success: true, message: 'Respaldo eliminado' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, executeManual, verifyIntegrity, deleteBackup };
