/**
 * SEED - Poblar base de datos con datos iniciales
 * Ejecutar: node config/seed.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinelx';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  // Cargar modelos
  const User = require('../repositories/User.model');
  const Policy = require('../repositories/Policy.model');
  const { Asset } = require('../repositories/models');

  // Limpiar colecciones
  await User.deleteMany({});
  await Policy.deleteMany({});
  await Asset.deleteMany({});
  console.log('🗑️  Colecciones limpiadas');

  // ─── Crear usuarios ────────────────────────────────────
  const usuarios = [
    { nombre: 'Administrador Sistema', email: 'admin@sentinelx.io', password: 'Admin2024!', rol: 'admin' },
    { nombre: 'Carlos Técnico TI', email: 'ti@sentinelx.io', password: 'Ti2024!', rol: 'ti' },
    { nombre: 'María Operativa', email: 'operativo@sentinelx.io', password: 'Op2024!', rol: 'operativo' },
    { nombre: 'Director General', email: 'directivo@sentinelx.io', password: 'Dir2024!', rol: 'directivo' },
  ];

  const createdUsers = await User.insertMany(
    await Promise.all(usuarios.map(async u => ({
      ...u,
      password: await bcrypt.hash(u.password, 12),
    })))
  );

  const adminId = createdUsers[0]._id;
  console.log('👤 Usuarios creados:', createdUsers.map(u => u.email).join(', '));

  // ─── Crear activos ─────────────────────────────────────
  const activos = await Asset.insertMany([
    { nombre: 'Base de Datos Principal', tipo: 'base_datos', ruta: '/var/db/empresa', criticidad: 'alta', descripcion: 'BD PostgreSQL principal', tamanoEstimadoMB: 2048, creadoPor: adminId },
    { nombre: 'Archivos Financieros', tipo: 'carpeta', ruta: '/data/finanzas', criticidad: 'alta', descripcion: 'Reportes y estados financieros', tamanoEstimadoMB: 512, creadoPor: adminId },
    { nombre: 'Documentos RH', tipo: 'carpeta', ruta: '/data/rh', criticidad: 'media', descripcion: 'Expedientes de personal', tamanoEstimadoMB: 256, creadoPor: adminId },
    { nombre: 'Configuraciones Sistema', tipo: 'carpeta', ruta: '/etc/app', criticidad: 'alta', descripcion: 'Archivos de configuración críticos', tamanoEstimadoMB: 50, creadoPor: adminId },
    { nombre: 'Logs de Aplicación', tipo: 'carpeta', ruta: '/var/log/app', criticidad: 'baja', descripcion: 'Registros de aplicación', tamanoEstimadoMB: 1024, creadoPor: adminId },
  ]);
  console.log('📁 Activos creados:', activos.length);

  // ─── Crear políticas ───────────────────────────────────
  const politicas = await Policy.insertMany([
    {
      nombre: 'Respaldo Crítico Diario',
      descripcion: 'Respaldo completo de activos críticos cada día a las 2am',
      frecuencia: 'diaria',
      cronExpression: '0 2 * * *',
      tipoCopia: 'completa',
      activos: [activos[0]._id, activos[1]._id, activos[3]._id],
      diasRetencion: 90,
      rutaAlmacenamiento: './storage/backups',
      estado: 'activa',
      cifradoHabilitado: true,
      notificarFallos: true,
      notificarExito: false,
      creadoPor: adminId,
      proximaEjecucion: new Date(Date.now() + 86400000),
    },
    {
      nombre: 'Respaldo Semanal Completo',
      descripcion: 'Respaldo completo de todos los activos cada domingo',
      frecuencia: 'semanal',
      cronExpression: '0 3 * * 0',
      tipoCopia: 'completa',
      activos: activos.map(a => a._id),
      diasRetencion: 365,
      rutaAlmacenamiento: './storage/backups',
      estado: 'activa',
      cifradoHabilitado: true,
      notificarFallos: true,
      notificarExito: true,
      creadoPor: adminId,
      proximaEjecucion: new Date(Date.now() + 7 * 86400000),
    },
    {
      nombre: 'Incremental Documentos RH',
      descripcion: 'Copia incremental de documentos de RRHH los días hábiles',
      frecuencia: 'diaria',
      cronExpression: '0 22 * * 1-5',
      tipoCopia: 'incremental',
      activos: [activos[2]._id],
      diasRetencion: 30,
      rutaAlmacenamiento: './storage/backups',
      estado: 'activa',
      cifradoHabilitado: true,
      notificarFallos: true,
      notificarExito: false,
      creadoPor: adminId,
      proximaEjecucion: new Date(Date.now() + 86400000),
    },
  ]);
  console.log('📋 Políticas creadas:', politicas.map(p => p.nombre).join(', '));

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📝 Credenciales de acceso:');
  console.log('  👑 Admin:     admin@sentinelx.io     / Admin2024!');
  console.log('  🔧 TI:        ti@sentinelx.io        / Ti2024!');
  console.log('  👤 Operativo: operativo@sentinelx.io / Op2024!');
  console.log('  📊 Directivo: directivo@sentinelx.io / Dir2024!');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});