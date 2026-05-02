const fs = require('fs-extra');
const path = require('path');
const { Backup, Restore, ActivityLog } = require('../repositories/models');
const backupEngine = require('./backup.engine');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Motor de Restauración
 * Responsable de verificar integridad y restaurar respaldos
 */
class RestoreEngine {

  /**
   * Iniciar proceso de restauración
   */
  async initiateRestore({ backupId, userId, tipo, archivosRestaurados, rutaDestino }) {
    // 1. Verificar que el respaldo existe y es válido
    const backup = await Backup.findById(backupId).populate('politica activos');
    if (!backup) throw new AppError('Respaldo no encontrado', 404);
    if (backup.estado === 'fallido' || backup.estado === 'corrupto') {
      throw new AppError('El respaldo está corrupto o fallido. No se puede restaurar.', 400);
    }
    if (!await fs.pathExists(backup.rutaAlmacenamiento)) {
      throw new AppError('El archivo de respaldo no existe en el almacenamiento', 404);
    }

    // 2. Crear registro de restauración
    const restoreRecord = await Restore.create({
      respaldo: backupId,
      solicitadoPor: userId,
      tipoRestauracion: tipo,
      archivosRestaurados: archivosRestaurados || [],
      rutaDestino: rutaDestino || backup.rutaAlmacenamiento,
      estado: 'pendiente',
    });

    // 3. Log de solicitud
    await ActivityLog.create({
      usuario: userId,
      accion: 'RESTORE_REQUEST',
      modulo: 'restore',
      descripcion: `Solicitud de restauración [${tipo}] del respaldo ${backup.identificador}`,
      resultado: 'success',
      metadata: { backupId, restoreId: restoreRecord._id, tipo },
    });

    // 4. Ejecutar restauración en background
    this._executeRestore(restoreRecord._id, backup, tipo, rutaDestino, userId)
      .catch(err => logger.error('Error en restauración asíncrona:', err.message));

    return { restoreId: restoreRecord._id, estado: 'iniciada', mensaje: 'Proceso de restauración iniciado' };
  }

  /**
   * Ejecutar la restauración efectiva
   */
  async _executeRestore(restoreId, backup, tipo, rutaDestino, userId) {
    await Restore.findByIdAndUpdate(restoreId, { estado: 'en_progreso', fechaInicio: new Date() });

    try {
      // 1. Verificar integridad SHA-256 antes de restaurar
      if (backup.hashSHA256) {
        const verificacion = await backupEngine.verifyIntegrity(backup._id);
        if (!verificacion.integro) {
          throw new Error('Verificación de integridad SHA-256 falló. El respaldo puede estar corrupto.');
        }
      }

      // 2. Preparar directorio destino
      const destino = rutaDestino || path.join(
        process.env.BACKUP_TEMP_PATH || './storage/temp',
        `restore_${Date.now()}`
      );
      await fs.ensureDir(destino);

      // 3. Descomprimir el respaldo
      await this._extractBackup(backup.rutaAlmacenamiento, destino);

      const duracion = Math.round((Date.now() - Date.now()) / 1000);

      // 4. Actualizar como exitoso
      await Restore.findByIdAndUpdate(restoreId, {
        estado: 'exitoso',
        fechaFin: new Date(),
        duracionSegundos: duracion || 1,
        integridadVerificada: true,
        rutaDestino: destino,
      });

      // 5. Log de éxito
      await ActivityLog.create({
        usuario: userId,
        accion: 'RESTORE_SUCCESS',
        modulo: 'restore',
        descripcion: `Restauración exitosa del respaldo ${backup.identificador} → ${destino}`,
        resultado: 'success',
        metadata: { backupId: backup._id, restoreId, destino },
      });

      logger.info(`✅ Restauración completada: ${backup.identificador} → ${destino}`);

    } catch (error) {
      await Restore.findByIdAndUpdate(restoreId, {
        estado: 'fallido',
        fechaFin: new Date(),
        mensajeError: error.message,
      });

      await ActivityLog.create({
        usuario: userId,
        accion: 'RESTORE_FAILED',
        modulo: 'restore',
        descripcion: `Error en restauración: ${error.message}`,
        resultado: 'failed',
        metadata: { backupId: backup._id, restoreId, error: error.message },
      });

      logger.error(`❌ Error en restauración: ${error.message}`);
    }
  }

  /**
   * Descomprimir archivo ZIP a directorio destino
   */
  _extractBackup(zipPath, destPath) {
    return new Promise((resolve, reject) => {
      // En producción se usaría unzipper o similar
      // Para el prototipo, simulamos la extracción copiando el archivo
      const AdmZip = (() => {
        try { return require('adm-zip'); } catch { return null; }
      })();

      if (AdmZip) {
        try {
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(destPath, true);
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        // Fallback: copiar archivo ZIP al destino
        fs.copy(zipPath, path.join(destPath, path.basename(zipPath)))
          .then(resolve).catch(reject);
      }
    });
  }

  /**
   * Obtener historial de restauraciones
   */
  async getHistory(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.userId) query.solicitadoPor = filters.userId;
    if (filters.estado) query.estado = filters.estado;

    const total = await Restore.countDocuments(query);
    const restores = await Restore.find(query)
      .populate('respaldo', 'identificador tipoCopia fechaInicio')
      .populate('solicitadoPor', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return { restores, total, page, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new RestoreEngine();
