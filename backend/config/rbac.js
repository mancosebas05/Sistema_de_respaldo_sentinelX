/**
 * RBAC - Role-Based Access Control
 * Define permisos por recurso y acción para cada rol del sistema
 */

const ROLES = {
  ADMIN: 'admin',
  TI: 'ti',
  OPERATIVO: 'operativo',
  DIRECTIVO: 'directivo',
};

/**
 * Matriz de permisos: role -> resource -> actions[]
 */
const PERMISSIONS = {
  [ROLES.ADMIN]: {
    users: ['create', 'read', 'update', 'delete', 'unlock'],
    policies: ['create', 'read', 'update', 'delete', 'activate', 'deactivate'],
    assets: ['create', 'read', 'update', 'delete'],
    backups: ['create', 'read', 'delete', 'execute'],
    restore: ['create', 'read', 'execute'],
    logs: ['read', 'export'],
    notifications: ['read', 'create', 'delete'],
    reports: ['read', 'export'],
    dashboard: ['read'],
    config: ['read', 'update'],
  },
  [ROLES.TI]: {
    users: ['read'],
    policies: ['read', 'update'],
    assets: ['create', 'read', 'update'],
    backups: ['create', 'read', 'execute'],
    restore: ['create', 'read', 'execute'],
    logs: ['read', 'export'],
    notifications: ['read'],
    reports: ['read', 'export'],
    dashboard: ['read'],
    config: ['read'],
  },
  [ROLES.OPERATIVO]: {
    users: [],
    policies: ['read'],
    assets: ['read'],
    backups: ['read'],
    restore: ['read'],
    logs: ['read'],
    notifications: ['read'],
    reports: [],
    dashboard: ['read'],
    config: [],
  },
  [ROLES.DIRECTIVO]: {
    users: ['read'],
    policies: ['read'],
    assets: ['read'],
    backups: ['read'],
    restore: ['read'],
    logs: ['read'],
    notifications: ['read'],
    reports: ['read', 'export'],
    dashboard: ['read'],
    config: [],
  },
};

/**
 * Verifica si un rol tiene permiso para una acción en un recurso
 */
const hasPermission = (role, resource, action) => {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  return resourcePermissions.includes(action);
};

module.exports = { ROLES, PERMISSIONS, hasPermission };
