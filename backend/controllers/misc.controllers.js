// ═══════════════════════════════════════════════════════════
// DASHBOARD CONTROLLER
// ═══════════════════════════════════════════════════════════
const { Backup, ActivityLog, Notification, Restore } = require('../repositories/models');
const Policy = require('../repositories/Policy.model');
const User = require('../repositories/User.model');
const { Asset } = require('../repositories/models');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalRespaldos, exitosos, fallidos, politicasActivas,
      totalUsuarios, respaldosRecientes, alertasRecientes,
      respaldosUltimos7, respaldosUltimos30,
    ] = await Promise.all([
      Backup.countDocuments({ eliminado: false }),
      Backup.countDocuments({ estado: 'exitoso', eliminado: false }),
      Backup.countDocuments({ estado: 'fallido', eliminado: false }),
      Policy.countDocuments({ estado: 'activa' }),
      User.countDocuments({ estado: 'activo' }),
      Backup.find({ eliminado: false }).sort({ createdAt: -1 }).limit(10)
        .populate('politica', 'nombre tipoCopia'),
      ActivityLog.find({ resultado: 'failed' }).sort({ createdAt: -1 }).limit(5),
      Backup.countDocuments({ estado: 'exitoso', createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Backup.countDocuments({ estado: 'exitoso', createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    ]);

    // Calcular almacenamiento total
    const storageResult = await Backup.aggregate([
      { $match: { estado: 'exitoso', eliminado: false } },
      { $group: { _id: null, totalBytes: { $sum: '$tamanoBytes' } } },
    ]);
    const totalBytes = storageResult[0]?.totalBytes || 0;

    const tasaExito = totalRespaldos > 0 ? ((exitosos / totalRespaldos) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        stats: { totalRespaldos, exitosos, fallidos, politicasActivas, totalUsuarios, tasaExito },
        almacenamiento: { totalBytes, totalGB: (totalBytes / (1024 ** 3)).toFixed(2) },
        respaldosRecientes,
        alertasRecientes,
        tendencia: { ultimos7Dias: respaldosUltimos7, ultimos30Dias: respaldosUltimos30 },
      },
    });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// LOG CONTROLLER
// ═══════════════════════════════════════════════════════════
const getLogs = async (req, res, next) => {
  try {
    const { modulo, accion, resultado, page = 1, limit = 50, desde, hasta } = req.query;
    const query = {};
    if (modulo) query.modulo = modulo;
    if (accion) query.accion = accion;
    if (resultado) query.resultado = resultado;
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta);
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, data: { logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// ASSET CONTROLLER
// ═══════════════════════════════════════════════════════════
const getAssets = async (req, res, next) => {
  try {
    const assets = await Asset.find({ activo: true })
      .populate('creadoPor', 'nombre email')
      .populate('politica', 'nombre')
      .sort({ criticidad: 1, nombre: 1 });
    res.json({ success: true, data: assets });
  } catch (error) { next(error); }
};

const createAsset = async (req, res, next) => {
  try {
    const { nombre, tipo, ruta, criticidad, descripcion, tamanoEstimadoMB, politica } = req.body;
    const asset = await Asset.create({ nombre, tipo, ruta, criticidad, descripcion, tamanoEstimadoMB, politica, creadoPor: req.user._id });

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'ASSET_CREATE', modulo: 'assets',
      descripcion: `Activo creado: ${nombre} (${tipo}) en ${ruta}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.status(201).json({ success: true, message: 'Activo creado', data: asset });
  } catch (error) { next(error); }
};

const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!asset) { const AppError = require('../utils/AppError'); throw new AppError('Activo no encontrado', 404); }

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'ASSET_UPDATE', modulo: 'assets',
      descripcion: `Activo actualizado: ${asset.nombre}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, data: asset });
  } catch (error) { next(error); }
};

const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!asset) { const AppError = require('../utils/AppError'); throw new AppError('Activo no encontrado', 404); }

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'ASSET_DELETE', modulo: 'assets',
      descripcion: `Activo eliminado: ${asset.nombre}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.json({ success: true, message: 'Activo eliminado' });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// RESTORE CONTROLLER
// ═══════════════════════════════════════════════════════════
const restoreEngine = require('../services/restore.engine');

const initiateRestore = async (req, res, next) => {
  try {
    const { backupId, tipo, archivosRestaurados, rutaDestino } = req.body;
    const AppError = require('../utils/AppError');
    if (!backupId) throw new AppError('ID de respaldo requerido', 400);

    const result = await restoreEngine.initiateRestore({
      backupId, userId: req.user._id, tipo: tipo || 'total', archivosRestaurados, rutaDestino,
    });
    res.status(202).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getRestoreHistory = async (req, res, next) => {
  try {
    const filters = req.user.rol === 'admin' || req.user.rol === 'ti' ? {} : { userId: req.user._id };
    const result = await restoreEngine.getHistory(filters, parseInt(req.query.page || 1), parseInt(req.query.limit || 20));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ═══════════════════════════════════════════════════════════
const getNotifications = async (req, res, next) => {
  try {
    const query = { destinatario: req.user._id };
    const { leida, limit = 20 } = req.query;
    if (leida !== undefined) query.leida = leida === 'true';

    const notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
    const noLeidas = await Notification.countDocuments({ destinatario: req.user._id, leida: false });
    res.json({ success: true, data: { notificaciones: notifs, noLeidas } });
  } catch (error) { next(error); }
};

const markRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ destinatario: req.user._id, leida: false }, { leida: true, fechaLectura: new Date() });
    res.json({ success: true, message: 'Notificaciones marcadas como leídas' });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// REPORT CONTROLLER
// ═══════════════════════════════════════════════════════════
const ExcelJS = require('exceljs');

const exportReport = async (req, res, next) => {
  try {
    const { tipo = 'backups', formato = 'excel', desde, hasta } = req.query;
    const dateFilter = {};
    if (desde) dateFilter.$gte = new Date(desde);
    if (hasta) dateFilter.$lte = new Date(hasta);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SentinelX';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte SentinelX');

    // Estilo del header
    sheet.addRow(['SENTINELX - Reporte de ' + tipo.toUpperCase()]);
    sheet.addRow(['Generado:', new Date().toLocaleString('es-CO')]);
    sheet.addRow([]);

    if (tipo === 'backups') {
      const query = { eliminado: false };
      if (Object.keys(dateFilter).length > 0) query.createdAt = dateFilter;
      const backups = await Backup.find(query).populate('politica', 'nombre tipoCopia');

      sheet.columns = [
        { header: 'Identificador', key: 'id', width: 40 },
        { header: 'Política', key: 'politica', width: 30 },
        { header: 'Tipo', key: 'tipo', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Tamaño (MB)', key: 'tamano', width: 15 },
        { header: 'Fecha', key: 'fecha', width: 25 },
        { header: 'Hash SHA-256', key: 'hash', width: 70 },
        { header: 'Íntegro', key: 'integro', width: 10 },
      ];

      backups.forEach(b => sheet.addRow({
        id: b.identificador,
        politica: b.politica?.nombre || 'N/A',
        tipo: b.tipoCopia,
        estado: b.estado,
        tamano: ((b.tamanoBytes || 0) / (1024 * 1024)).toFixed(2),
        fecha: b.createdAt?.toLocaleString('es-CO'),
        hash: b.hashSHA256 || 'No verificado',
        integro: b.integridadVerificada ? 'Sí' : 'No',
      }));
    } else if (tipo === 'logs') {
      const query = {};
      if (Object.keys(dateFilter).length > 0) query.createdAt = dateFilter;
      const logs = await ActivityLog.find(query).populate('usuario', 'nombre email').sort({ createdAt: -1 }).limit(1000);

      sheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 25 },
        { header: 'Usuario', key: 'usuario', width: 30 },
        { header: 'Acción', key: 'accion', width: 25 },
        { header: 'Módulo', key: 'modulo', width: 15 },
        { header: 'Descripción', key: 'desc', width: 60 },
        { header: 'IP', key: 'ip', width: 20 },
        { header: 'Resultado', key: 'resultado', width: 12 },
      ];

      logs.forEach(l => sheet.addRow({
        fecha: l.createdAt?.toLocaleString('es-CO'),
        usuario: l.usuario?.email || l.usuarioEmail || 'Sistema',
        accion: l.accion,
        modulo: l.modulo,
        desc: l.descripcion,
        ip: l.ipOrigen || '',
        resultado: l.resultado,
      }));
    }

    await ActivityLog.create({
      usuario: req.user._id, usuarioEmail: req.user.email,
      accion: 'REPORT_EXPORT', modulo: 'reports',
      descripcion: `Reporte exportado: ${tipo} en formato ${formato}`,
      resultado: 'success', ipOrigen: req.ip,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sentinelx_reporte_${tipo}_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};

module.exports = {
  getDashboard,
  getLogs,
  getAssets, createAsset, updateAsset, deleteAsset,
  initiateRestore, getRestoreHistory,
  getNotifications, markRead,
  exportReport,
};
