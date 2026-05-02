/**
 * Formatear bytes a unidad legible
 */
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Formatear fecha en español colombiano
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  });
};

/**
 * Formatear duración en segundos a string legible
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

/**
 * Obtener iniciales de un nombre
 */
export const getInitials = (name = '') => {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

/**
 * Clases de badge según estado de respaldo
 */
export const getBackupStatusBadge = (estado) => {
  const map = {
    exitoso: 'badge-success',
    fallido: 'badge-danger',
    en_progreso: 'badge-info',
    corrupto: 'badge-danger',
    eliminado: 'badge-muted',
  };
  return map[estado] || 'badge-muted';
};

/**
 * Truncar string con elipsis
 */
export const truncate = (str, maxLen = 40) => {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
};

/**
 * Descargar blob como archivo
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
