const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const { Backup, ActivityLog, Notification } = require('../repositories/models');
const Policy = require('../repositories/Policy.model');
const User = require('../repositories/User.model');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Motor de Respaldo - Core del sistema
 * Responsable de ejecutar, comprimir, hashear y registrar respaldos
 */
class BackupEngine {

  /**
   * Ejecutar un respaldo basado en una política
   * @param {string} policyId - ID de la política
   * @param {string} triggeredBy - 'automatico' | 'manual'
   * @param {string} userId - ID del usuario (para manual)
   */
  async executeBackup(policyId, triggeredBy = 'automatico', userId = null) {
    const policy = await Policy.findById(policyId).populate('activos');
    
    if (!policy) throw new AppError('Política no encontrada', 404);
    if (policy.estado !== 'activa') {
      logger.warn(`Política ${policyId} no está activa. Respaldo omitido.`);
      return null;
    }

    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `backup_${policy.nombre.replace(/\s/g, '_')}_${timestamp}.zip`;
    
    // Directorio de almacenamiento
    const storageDir = path.resolve(policy.rutaAlmacenamiento || process.env.BACKUP_STORAGE_PATH || './storage/backups');
    const policyDir = path.join(storageDir, policyId);
    const backupPath = path.join(policyDir, nombreArchivo);
    
    await fs.ensureDir(policyDir);

    // Crear registro en BD (estado: en_progreso)
    const backupRecord = await Backup.create({
      identificador: backupId,
      politica: policyId,
      activos: policy.activos.map(a => a._id),
      tipoCopia: policy.tipoCopia,
      estado: 'en_progreso',
      fechaInicio: new Date(),
      rutaAlmacenamiento: backupPath,
      disparadoPor: triggeredBy,
      ejecutadoPor: userId,
      fechaVencimiento: this._calcularVencimiento(policy.diasRetencion),
    });

    logger.info(`🗂️  Iniciando respaldo [${backupId}] | Política: ${policy.nombre} | Tipo: ${policy.tipoCopia}`);

    try {
      // Ejecutar compresión y captura
      const resultado = await this._compressAssets(policy.activos, backupPath, policy.tipoCopia);
      
      // Calcular hash SHA-256 para validación de integridad
      const hashSHA256 = await this._calculateSHA256(backupPath);
      
      const duracion = Math.round((Date.now() - backupRecord.fechaInicio.getTime()) / 1000);
      const stats = await fs.stat(backupPath);

      // Actualizar registro como exitoso
      await Backup.findByIdAndUpdate(backupRecord._id, {
        estado: 'exitoso',
        fechaFin: new Date(),
        duracionSegundos: duracion,
        tamanoBytes: stats.size,
        hashSHA256,
        integridadVerificada: true,
        fechaVerificacion: new Date(),
      });

      // Actualizar estadísticas de la política
      await Policy.findByIdAndUpdate(policyId, {
        $inc: { totalEjecuciones: 1 },
        ultimaEjecucion: new Date(),
      });

      // Log de auditoría
      await this._logActivity({
        usuario: userId,
        accion: 'BACKUP_SUCCESS',
        modulo: 'backups',
        descripcion: `Respaldo exitoso: ${nombreArchivo} | Tamaño: ${this._formatBytes(stats.size)} | Hash: ${hashSHA256.substring(0, 16)}...`,
        resultado: 'success',
        metadata: { backupId, policyId, tamanoBytes: stats.size, duracionSegundos: duracion },
      });

      logger.info(`✅ Respaldo completado [${backupId}] | Tamaño: ${this._formatBytes(stats.size)} | Duración: ${duracion}s`);

      // Notificar éxito si está configurado
      if (policy.notificarExito) {
        await this._notificarEjecucion(policyId, 'success', `Respaldo exitoso: ${nombreArchivo}`);
      }

      // Ejecutar limpieza por retención
      await this._aplicarRetencion(policyId, policy.diasRetencion);

      return { backupId: backupRecord._id, identificador: backupId, estado: 'exitoso', hashSHA256 };

    } catch (error) {
      // Marcar como fallido
      await Backup.findByIdAndUpdate(backupRecord._id, {
        estado: 'fallido',
        fechaFin: new Date(),
        mensajeError: error.message,
      });

      // Log de fallo
      await this._logActivity({
        usuario: userId,
        accion: 'BACKUP_FAILED',
        modulo: 'backups',
        descripcion: `Error en respaldo de política ${policy.nombre}: ${error.message}`,
        resultado: 'failed',
        metadata: { policyId, error: error.message },
      });

      // Notificar fallo al admin/TI
      if (policy.notificarFallos) {
        await this._notificarEjecucion(policyId, 'error', `❌ Fallo en respaldo: ${policy.nombre} - ${error.message}`);
      }

      logger.error(`❌ Error en respaldo [${backupId}]: ${error.message}`);
      throw error;
    }
  }

  /**
   * Comprimir activos de información en un archivo ZIP
   */
  _compressAssets(activos, outputPath, tipoCopia) {
    return new Promise(async (resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve({ bytesTotal: archive.pointer() }));
      archive.on('error', reject);
      archive.pipe(output);

      // Agregar cada activo al archivo
      for (const activo of activos) {
        try {
          const rutaActivo = path.resolve(activo.ruta);
          
          if (!await fs.pathExists(rutaActivo)) {
            logger.warn(`⚠️  Activo no encontrado en ruta: ${rutaActivo}`);
            continue;
          }

          const stat = await fs.stat(rutaActivo);
          
          if (stat.isDirectory()) {
            archive.directory(rutaActivo, activo.nombre || path.basename(rutaActivo));
          } else {
            archive.file(rutaActivo, { name: activo.nombre || path.basename(rutaActivo) });
          }
        } catch (err) {
          logger.warn(`Error procesando activo ${activo.nombre}: ${err.message}`);
        }
      }

      // Si no hay activos reales, crear un archivo de metadatos de prueba
      if (activos.length === 0 || process.env.NODE_ENV === 'development') {
        const metadata = JSON.stringify({
          timestamp: new Date().toISOString(),
          tipoCopia,
          activos: activos.map(a => ({ nombre: a.nombre, ruta: a.ruta, tipo: a.tipo })),
          generadoPor: 'SentinelX v1.0',
        }, null, 2);
        archive.append(metadata, { name: 'backup-metadata.json' });
      }

      archive.finalize();
    });
  }

  /**
   * Calcular hash SHA-256 del archivo de respaldo (validación de integridad)
   */
  _calculateSHA256(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Verificar integridad de un respaldo comparando hash SHA-256
   */
  async verifyIntegrity(backupId) {
    const backup = await Backup.findById(backupId);
    if (!backup) throw new AppError('Respaldo no encontrado', 404);
    if (!backup.hashSHA256) throw new AppError('Respaldo no tiene hash de integridad', 400);

    if (!await fs.pathExists(backup.rutaAlmacenamiento)) {
      await Backup.findByIdAndUpdate(backupId, { estado: 'corrupto' });
      throw new AppError('Archivo de respaldo no encontrado en almacenamiento', 404);
    }

    const hashActual = await this._calculateSHA256(backup.rutaAlmacenamiento);
    const integro = hashActual === backup.hashSHA256;

    await Backup.findByIdAndUpdate(backupId, {
      integridadVerificada: integro,
      fechaVerificacion: new Date(),
      ...(integro ? {} : { estado: 'corrupto' }),
    });

    await this._logActivity({
      accion: 'INTEGRITY_CHECK',
      modulo: 'backups',
      descripcion: `Verificación SHA-256 del respaldo ${backup.identificador}: ${integro ? 'ÍNTEGRO' : '⚠️ CORRUPTO'}`,
      resultado: integro ? 'success' : 'failed',
      metadata: { backupId, hashOriginal: backup.hashSHA256, hashActual },
    });

    return { integro, hashOriginal: backup.hashSHA256, hashActual };
  }

  /**
   * Eliminar respaldos vencidos según política de retención
   */
  async _aplicarRetencion(policyId, diasRetencion) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

    const backupsVencidos = await Backup.find({
      politica: policyId,
      fechaVencimiento: { $lt: new Date() },
      eliminado: false,
      estado: { $ne: 'en_progreso' },
    });

    for (const backup of backupsVencidos) {
      try {
        if (backup.rutaAlmacenamiento && await fs.pathExists(backup.rutaAlmacenamiento)) {
          await fs.remove(backup.rutaAlmacenamiento);
        }
        await Backup.findByIdAndUpdate(backup._id, { eliminado: true, estado: 'eliminado' });
        logger.info(`🗑️  Respaldo vencido eliminado: ${backup.identificador}`);
      } catch (err) {
        logger.error(`Error eliminando respaldo vencido ${backup.identificador}: ${err.message}`);
      }
    }
  }

  /**
   * Calcular fecha de vencimiento según días de retención
   */
  _calcularVencimiento(diasRetencion) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasRetencion);
    return fecha;
  }

  /**
   * Formatear bytes a unidad legible
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  async _logActivity(data) {
    try { await ActivityLog.create(data); } 
    catch (err) { logger.error('Error en log:', err.message); }
  }

  async _notificarEjecucion(policyId, tipo, mensaje) {
    try {
      const admins = await User.find({ rol: { $in: ['admin', 'ti'] }, estado: 'activo' });
      const policy = await Policy.findById(policyId);
      const notificaciones = admins.map(u => ({
        destinatario: u._id,
        tipo,
        titulo: tipo === 'error' ? '⚠️ Fallo en Respaldo' : '✅ Respaldo Completado',
        mensaje,
        referenciaModulo: 'backups',
        referenciaId: policyId,
      }));
      if (notificaciones.length > 0) {
        await Notification.insertMany(notificaciones);
      }
    } catch (err) {
      logger.error('Error enviando notificación:', err.message);
    }
  }
}

module.exports = new BackupEngine();
