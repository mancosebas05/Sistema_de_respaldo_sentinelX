const cron = require('node-cron');
const Policy = require('../repositories/Policy.model');
const backupEngine = require('../services/backup.engine');
const logger = require('../config/logger');

// Mapa de trabajos activos: policyId -> tarea cron
const activeJobs = new Map();

/**
 * Scheduler de Respaldos Automáticos
 * Basado en node-cron, ejecuta políticas según su expresión cron configurada
 */

/**
 * Inicializar el scheduler al arrancar el servidor
 * Carga todas las políticas activas y programa sus tareas
 */
const initScheduler = async () => {
  try {
    logger.info('⏱️  Inicializando Scheduler de Respaldos...');
    
    const policies = await Policy.find({ estado: 'activa' });
    logger.info(`📋 Cargando ${policies.length} política(s) activa(s)`);

    for (const policy of policies) {
      schedulePolicy(policy);
    }

    // Tarea de mantenimiento: limpiar sesiones y logs viejos (diario 1am)
    cron.schedule('0 1 * * *', async () => {
      logger.info('🧹 Ejecutando mantenimiento nocturno...');
      await _maintenanceTask();
    });

    // Verificación de integridad aleatoria (semanal - domingos 3am)
    cron.schedule('0 3 * * 0', async () => {
      logger.info('🔍 Verificación semanal de integridad...');
      await _integrityCheckTask();
    });

    logger.info('✅ Scheduler inicializado correctamente');
  } catch (error) {
    logger.error('Error inicializando scheduler:', error.message);
  }
};

/**
 * Programar respaldo para una política específica
 */
const schedulePolicy = (policy) => {
  if (!policy.cronExpression) {
    logger.warn(`Política ${policy.nombre} no tiene expresión cron. Omitida.`);
    return;
  }

  // Validar expresión cron
  if (!cron.validate(policy.cronExpression)) {
    logger.error(`Expresión cron inválida para política ${policy.nombre}: ${policy.cronExpression}`);
    return;
  }

  // Si ya existe una tarea para esta política, eliminarla primero
  if (activeJobs.has(policy._id.toString())) {
    activeJobs.get(policy._id.toString()).stop();
    activeJobs.delete(policy._id.toString());
  }

  const job = cron.schedule(policy.cronExpression, async () => {
    logger.info(`⏰ Scheduler disparando respaldo automático: ${policy.nombre}`);
    try {
      // Recargar política para obtener estado actual
      const currentPolicy = await Policy.findById(policy._id);
      if (!currentPolicy || currentPolicy.estado !== 'activa') {
        logger.warn(`Política ${policy.nombre} ya no está activa. Omitiendo.`);
        return;
      }
      await backupEngine.executeBackup(policy._id.toString(), 'automatico');
    } catch (error) {
      logger.error(`Error en respaldo automático de "${policy.nombre}": ${error.message}`);
    }
  }, {
    scheduled: true,
    timezone: 'America/Bogota',
  });

  activeJobs.set(policy._id.toString(), job);
  logger.info(`📅 Programado: "${policy.nombre}" | Cron: ${policy.cronExpression}`);
};

/**
 * Detener tarea de una política
 */
const unschedulePolicy = (policyId) => {
  const policyIdStr = policyId.toString();
  if (activeJobs.has(policyIdStr)) {
    activeJobs.get(policyIdStr).stop();
    activeJobs.delete(policyIdStr);
    logger.info(`⏹️  Tarea detenida para política: ${policyIdStr}`);
  }
};

/**
 * Reprogramar una política (después de actualización)
 */
const reschedulePolicy = async (policyId) => {
  const policy = await Policy.findById(policyId);
  if (policy) {
    unschedulePolicy(policyId);
    if (policy.estado === 'activa') {
      schedulePolicy(policy);
    }
  }
};

/**
 * Obtener estado del scheduler
 */
const getSchedulerStatus = () => {
  const jobs = [];
  for (const [policyId, job] of activeJobs.entries()) {
    jobs.push({ policyId, activa: true });
  }
  return { totalJobs: activeJobs.size, jobs };
};

/**
 * Tarea de mantenimiento nocturno
 */
const _maintenanceTask = async () => {
  try {
    const { Session } = require('../repositories/models');
    const { ActivityLog } = require('../repositories/models');
    
    // Limpiar sesiones expiradas
    const sesionesBorradas = await Session.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    // Retención de logs (según config)
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS) || 365;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - retentionDays);
    
    // NOTA: Los logs de auditoría NO se eliminan; solo logs de sistema viejos
    
    logger.info(`🧹 Mantenimiento: ${sesionesBorradas.deletedCount} sesiones eliminadas`);
  } catch (err) {
    logger.error('Error en tarea de mantenimiento:', err.message);
  }
};

/**
 * Verificación aleatoria de integridad de respaldos recientes
 */
const _integrityCheckTask = async () => {
  try {
    const { Backup } = require('../repositories/models');
    const backupsRecientes = await Backup.find({
      estado: 'exitoso',
      integridadVerificada: false,
      eliminado: false,
    }).limit(10);

    for (const backup of backupsRecientes) {
      try {
        await backupEngine.verifyIntegrity(backup._id);
        logger.info(`🔍 Integridad verificada: ${backup.identificador}`);
      } catch (err) {
        logger.error(`⚠️  Integridad fallida: ${backup.identificador}`);
      }
    }
  } catch (err) {
    logger.error('Error en verificación de integridad:', err.message);
  }
};

/**
 * Helpers para generar expresiones cron desde configuración de política
 */
const buildCronExpression = (frecuencia, hora = '02:00') => {
  const [h, m] = hora.split(':').map(Number);
  switch (frecuencia) {
    case 'diaria':    return `${m} ${h} * * *`;       // Ej: 0 2 * * *
    case 'semanal':   return `${m} ${h} * * 0`;       // Ej: 0 2 * * 0 (domingos)
    case 'mensual':   return `${m} ${h} 1 * *`;       // Ej: 0 2 1 * * (día 1)
    default:          return `${m} ${h} * * *`;
  }
};

module.exports = {
  initScheduler,
  schedulePolicy,
  unschedulePolicy,
  reschedulePolicy,
  getSchedulerStatus,
  buildCronExpression,
};
