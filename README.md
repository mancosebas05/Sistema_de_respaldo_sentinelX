# 🛡️ SENTINELX — Sistema de Respaldo Automatizado y Centralizado

> **Proyecto Académico** | UNIMINUTO | Práctica Profesional  
> **Stack:** MERN (MongoDB + Express + React + Node.js)  
> **Estándar:** ISO/IEC/IEEE 12207 | ISO/IEC 27001 | NIST SP 800-53

---

## 📁 Estructura del Proyecto

```
sentinelx/
├── backend/                        # Node.js + Express API
│   ├── server.js                   # Entry point principal
│   ├── .env                        # Variables de entorno
│   ├── config/
│   │   ├── database.js             # Conexión MongoDB (Mongoose)
│   │   ├── logger.js               # Winston - logs estructurados
│   │   ├── rbac.js                 # Matriz de permisos RBAC
│   │   └── seed.js                 # Script de datos iniciales
│   ├── controllers/
│   │   ├── auth.controller.js      # Login, logout, perfil
│   │   ├── backup.controller.js    # CRUD respaldos + ejecución manual
│   │   ├── policy.controller.js    # CRUD políticas + toggle estado
│   │   ├── user.controller.js      # CRUD usuarios + desbloqueo
│   │   └── misc.controllers.js     # Dashboard, logs, assets, restore, reportes, notificaciones
│   ├── services/
│   │   ├── auth.service.js         # Lógica de autenticación + JWT + bloqueo
│   │   ├── backup.engine.js        # Motor de respaldo (ZIP + SHA-256 + retención)
│   │   └── restore.engine.js       # Motor de restauración + verificación integridad
│   ├── repositories/
│   │   ├── User.model.js           # Schema Usuario (bcrypt, bloqueo, roles)
│   │   ├── Policy.model.js         # Schema Política de respaldo
│   │   └── models.js               # Asset, Backup, Restore, ActivityLog, Notification, Session
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verify + RBAC authorize + timeout sesión
│   │   └── errorHandler.js         # Manejador global de errores
│   ├── routes/                     # Rutas Express (auth, users, policies, backups, etc.)
│   ├── scheduler/
│   │   └── index.js                # node-cron scheduler + mantenimiento automático
│   └── utils/
│       └── AppError.js             # Clase de error personalizada
│
└── frontend/                       # React 18 SPA
    └── src/
        ├── App.js                  # Rutas protegidas (React Router v6)
        ├── index.css               # Design system completo (CSS Variables)
        ├── context/
        │   └── AuthContext.js      # Estado global de autenticación
        ├── services/
        │   └── api.js              # Axios + interceptores JWT
        ├── components/
        │   └── layout/
        │       └── AppShell.js     # Topbar + Sidebar + Outlet
        └── pages/
            ├── LoginPage.js        # Autenticación
            ├── DashboardPage.js    # Dashboard con KPIs y gráficas
            ├── PoliciesPage.js     # CRUD políticas de respaldo
            ├── BackupsPage.js      # Centro de respaldos + ejecución manual
            ├── RestorePage.js      # Vault Recovery con verificación SHA-256
            ├── UsersPage.js        # Gestión de acceso RBAC
            ├── ReportsPage.js      # Reportes analíticos + exportación Excel
            ├── AuditPage.js        # Audit Stream (logs inmutables)
            └── ConfigPage.js       # Configuración global del sistema
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js >= 18.x
- MongoDB >= 6.x (local o Atlas)
- npm >= 9.x

### 1. Backend

```bash
cd sentinelx/backend
npm install
cp .env.example .env         # Editar variables según entorno
node config/seed.js          # Crear usuarios y datos iniciales
npm run dev                  # Iniciar en modo desarrollo (nodemon)
```

La API correrá en: `http://localhost:5000`

### 2. Frontend

```bash
cd sentinelx/frontend
npm install
npm start                    # Inicia en http://localhost:3000
```

---

## 🔑 Credenciales de Prueba

| Rol            | Email                       | Contraseña  |
|----------------|-----------------------------|-------------|
| **Admin**      | admin@sentinelx.io         | Admin2024!  |
| **TI/Soporte** | ti@sentinelx.io            | Ti2024!     |
| **Operativo**  | operativo@sentinelx.io     | Op2024!     |
| **Directivo**  | directivo@sentinelx.io     | Dir2024!    |

---

## 🔐 Seguridad Implementada

| Control              | Implementación                          |
|----------------------|-----------------------------------------|
| Contraseñas          | bcrypt (12 rondas)                      |
| Autenticación        | JWT (8h) + verificación de sesión en BD |
| Bloqueo de cuenta    | 3 intentos fallidos → bloqueo 30 min   |
| Timeout inactividad  | 10 minutos automático                   |
| Control de acceso    | RBAC (4 roles × 10 recursos × acciones) |
| Integridad datos     | SHA-256 en cada respaldo generado       |
| Cifrado              | AES-256 + HTTPS                         |
| Auditoría            | Log inmutable de todas las acciones     |
| Sanitización         | express-mongo-sanitize                  |
| Rate limiting        | express-rate-limit (100 req/15min)      |

---

## 📡 Endpoints Principales de la API

```
POST   /api/v1/auth/login              # Autenticación
POST   /api/v1/auth/logout             # Cerrar sesión
GET    /api/v1/auth/profile            # Perfil actual

GET    /api/v1/dashboard               # Estadísticas del sistema
GET    /api/v1/policies                # Listar políticas
POST   /api/v1/policies                # Crear política (admin/ti)
PATCH  /api/v1/policies/:id/toggle     # Activar/desactivar
POST   /api/v1/backups/execute         # Respaldo manual
POST   /api/v1/backups/:id/verify      # Verificar SHA-256
POST   /api/v1/restore                 # Iniciar restauración
GET    /api/v1/logs                    # Audit stream
GET    /api/v1/reports/export          # Exportar Excel/PDF
GET    /api/v1/users                   # Lista de usuarios
PATCH  /api/v1/users/:id/unlock        # Desbloquear cuenta
```

### Ejemplo de Request: Login
```json
POST /api/v1/auth/login
{
  "email": "admin@sentinelx.io",
  "password": "Admin2024!"
}
```

### Ejemplo de Response: Login exitoso
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "nombre": "Administrador Sistema",
      "email": "admin@sentinelx.io",
      "rol": "admin",
      "ultimoAcceso": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Ejemplo de Request: Crear Política
```json
POST /api/v1/policies
Authorization: Bearer <token>
{
  "nombre": "Respaldo Crítico Diario",
  "frecuencia": "diaria",
  "horaEjecucion": "02:00",
  "tipoCopia": "completa",
  "activos": ["64a1b2c3d4e5f6a7b8c9d0e2"],
  "diasRetencion": 90,
  "cifradoHabilitado": true,
  "notificarFallos": true
}
```

### Ejemplo de Response: Respaldo Completado
```json
{
  "success": true,
  "data": {
    "backupId": "64a1b2c3d4e5f6a7b8c9d0e3",
    "identificador": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "estado": "exitoso",
    "hashSHA256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```

---

## ⚙️ Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```env
MONGODB_URI=mongodb://localhost:27017/sentinelx
JWT_SECRET=cambiar_este_secreto_en_produccion
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=3
LOCK_TIME_MINUTES=30
SESSION_TIMEOUT_MINUTES=10
BACKUP_STORAGE_PATH=./storage/backups
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 Mapeo ERS → Implementación

| RF   | Requisito                          | Implementado                                    |
|------|------------------------------------|-------------------------------------------------|
| RF-01| Configuración de políticas         | `PoliciesPage` + `PolicyController.create`      |
| RF-02| Programación automática            | `scheduler/index.js` + `node-cron`              |
| RF-03| Selección de activos               | `AssetController` + UI de selección múltiple    |
| RF-04| Gestión de roles y permisos        | `RBAC config` + `auth.middleware.authorize`     |
| RF-05| Restauración de información        | `RestoreEngine` + `RestorePage`                 |
| RF-06| Logs de actividad                  | `ActivityLog` model + `AuditPage`               |
| RF-07| Reportes exportables               | `ExcelJS` + `ReportsPage`                       |
| RF-08| Notificaciones y alertas           | `Notification` model + topbar counter           |
| RF-09| Panel de monitoreo                 | `DashboardPage` con KPIs y gráficas             |
| RF-10| Validación SHA-256                 | `BackupEngine._calculateSHA256`                 |
| RF-11| Políticas de retención             | `BackupEngine._aplicarRetencion`                |
| RF-12| Almacenamiento seguro              | File system cifrado + AES-256                   |

---

*© 2024 SentinelX — Corporación Universitaria Minuto de Dios*
