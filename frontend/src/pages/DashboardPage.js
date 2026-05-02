import React, { useState, useEffect } from 'react';
import { dashboardAPI, backupsAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Cloud, CheckCircle, XCircle, Shield, Database, TrendingUp, RefreshCw, Play } from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

const fmtBytes = (b) => {
  if (!b) return '0 B';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

const statusBadge = (s) => {
  const map = { exitoso: 'badge-success', fallido: 'badge-danger', en_progreso: 'badge-info', corrupto: 'badge-danger' };
  const labels = { exitoso: 'Exitoso', fallido: 'Fallido', en_progreso: 'En progreso', corrupto: 'Corrupto' };
  return <span className={`badge ${map[s] || 'badge-muted'}`}>{labels[s] || s}</span>;
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('30');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.get();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock chart data for visualization
  const generateChartData = () => {
    const days = parseInt(chartRange);
    return Array.from({ length: days > 10 ? 12 : days }, (_, i) => ({
      name: `D${i + 1}`,
      exitosos: Math.floor(Math.random() * 50 + 30),
      fallidos: Math.floor(Math.random() * 5),
    }));
  };

  const pieData = data ? [
    { name: 'Exitosos', value: data.stats?.exitosos || 0 },
    { name: 'Fallidos', value: data.stats?.fallidos || 0 },
  ] : [];

  const stats = data?.stats || {};

  const statCards = [
    { label: 'Total Respaldos', value: stats.totalRespaldos || 0, icon: Cloud, color: '#3B82F6', badge: '+12%', badgeColor: 'badge-primary' },
    { label: 'Exitosos', value: stats.exitosos || 0, icon: CheckCircle, color: '#10B981', badge: 'Óptimal', badgeColor: 'badge-success' },
    { label: 'Fallidos', value: stats.fallidos || 0, icon: XCircle, color: '#EF4444', badge: `-${stats.fallidos || 0}`, badgeColor: 'badge-danger' },
    { label: 'Políticas Activas', value: stats.politicasActivas || 0, icon: Shield, color: '#A858B0', badge: 'Activas', badgeColor: 'badge-muted' },
    { label: 'Almacenamiento', value: fmtBytes(data?.almacenamiento?.totalBytes), icon: Database, color: '#F59E0B', badge: '85% Full', badgeColor: 'badge-warning' },
    { label: 'Tasa de Éxito', value: `${stats.tasaExito || 0}%`, icon: TrendingUp, color: '#10B981', badge: 'Target 99%', badgeColor: 'badge-success' },
  ];

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Dashboard <span style={{ color: 'var(--primary)' }}>SENTINEL X</span></h1>
          <p className="page-subtitle">Resumen general del sistema de respaldo SENTINEL X</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboard} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid-6 mb-6">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ '--accent-color': s.color }}>
              <div className="stat-icon"><Icon size={16} /></div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <span className={`badge stat-badge ${s.badgeColor}`}>{s.badge}</span>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-6">
        {/* Area Chart */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, fontSize: 14 }}>Distribución de Respaldos SENTINEL X</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7','30'].map(r => (
                <button key={r} className={`btn btn-sm ${chartRange === r ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setChartRange(r)}>
                  {r} Días
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={generateChartData()}>
              <defs>
                <linearGradient id="gExit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="exitosos" stroke="#10B981" fill="url(#gExit)" strokeWidth={2} />
              <Area type="monotone" dataKey="fallidos" stroke="#EF4444" fill="url(#gFail)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700, fontSize: 14 }}>Estado Global de Respaldos</span>
          </div>
          {pieData.some(d => d.value > 0) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{stats.tasaExito}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TASA DE ÉXITO</div>
                </div>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i], display: 'inline-block' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state"><Database size={32} /><p>Sin datos disponibles</p></div>
          )}
        </div>
      </div>

      {/* Recent Backups Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Respaldos Recientes SENTINEL X</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.href='/respaldos'}>
            Ver todo el historial
          </button>
        </div>
        {loading ? (
          <div className="empty-state"><RefreshCw size={28} className="spin" /><p>Cargando respaldos...</p></div>
        ) : !data?.respaldosRecientes?.length ? (
          <div className="empty-state"><Database size={28} /><p>No hay respaldos recientes</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Identificador</th>
                <th>Política</th>
                <th>Fecha / Hora</th>
                <th>Tamaño</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.respaldosRecientes.map(b => (
                <tr key={b._id}>
                  <td><span className="backup-id">{b.identificador?.slice(0, 16)}...</span></td>
                  <td><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.politica?.nombre || 'N/A'}</span></td>
                  <td>{new Date(b.createdAt).toLocaleString('es-CO')}</td>
                  <td>{fmtBytes(b.tamanoBytes)}</td>
                  <td>{statusBadge(b.estado)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" title="Ver detalles">Ver</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
