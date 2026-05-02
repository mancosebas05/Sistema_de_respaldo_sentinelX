import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import {
  LayoutDashboard, Shield, Cloud, RotateCcw, Users, BarChart2,
  BookOpen, Settings, Bell, Search, LogOut, AlertTriangle,
  Moon, Sun, HelpCircle, ChevronDown, Cpu
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, roles: ['admin','ti','operativo','directivo'] },
  { path: '/politicas',    label: 'Políticas',    icon: Shield,           roles: ['admin','ti','operativo','directivo'] },
  { path: '/respaldos',    label: 'Respaldos',    icon: Cloud,            roles: ['admin','ti','operativo','directivo'] },
  { path: '/restaurar',    label: 'Restaurar',    icon: RotateCcw,        roles: ['admin','ti'] },
  { path: '/usuarios',     label: 'Usuarios',     icon: Users,            roles: ['admin','directivo'] },
  { path: '/reportes',     label: 'Reportes',     icon: BarChart2,        roles: ['admin','ti','directivo'] },
  { path: '/auditoria',    label: 'Auditoría',    icon: BookOpen,         roles: ['admin','ti'] },
  { path: '/configuracion',label: 'Configuración',icon: Settings,         roles: ['admin'] },
];

const roleLabels = { admin: 'Admin Global', ti: 'TI / Soporte', operativo: 'Usuario Operativo', directivo: 'Directivo' };

export default function AppShell() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('sentinelx_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sentinelx_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifs = async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 8 });
      setNotifications(res.data?.notificaciones || []);
      setUnread(res.data?.noLeidas || 0);
    } catch {}
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const filteredNav = navItems.filter(n => hasPermission(n.roles));

  const initials = user?.nombre?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <div className="app-shell">
      {/* ─── Topbar ───────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="logo-mark">
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div className="logo-text">SENTINEL<span>X</span></div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: -2 }}>ENTERPRISE VAULT</div>
          </div>
        </div>

        <div className="topbar-search">
          <Search size={13} />
          <input placeholder="Buscar en SENTINEL X..." />
        </div>

        <div className="topbar-actions">
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
              <Bell size={16} />
              {unread > 0 && <span className="notif-count">{unread > 9 ? '9+' : unread}</span>}
            </button>
            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: '110%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 0, width: 320, zIndex: 200,
                boxShadow: 'var(--shadow-lg)',
              }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Notificaciones</span>
                  <button className="btn btn-ghost btn-sm" onClick={async () => { await notificationsAPI.markAllRead(); fetchNotifs(); }}>
                    Marcar leídas
                  </button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sin notificaciones</div>
                  ) : notifications.map(n => (
                    <div key={n._id} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)40',
                      background: n.leida ? 'transparent' : 'var(--primary-glow)',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.titulo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{n.mensaje}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(n.createdAt).toLocaleString('es-CO')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="notif-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button className="notif-btn"><HelpCircle size={15} /></button>

          {/* User */}
          <div className="topbar-user">
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.nombre}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{roleLabels[user?.rol]}</div>
            </div>
            <div className="user-avatar">{initials}</div>
          </div>
        </div>
      </header>

      {/* ─── Sidebar ──────────────────────────────────── */}
      <aside className="sidebar">
        {/* System Admin info */}
        <div style={{ padding: '10px 12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div className="user-avatar" style={{ width: 36, height: 36, borderRadius: 10, fontSize: 13 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.nombre?.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{roleLabels[user?.rol]}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {filteredNav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div>
          <div className="system-status">
            <span className="status-dot dot-success" />
            <span>System Status: Secure</span>
          </div>
          <div style={{ padding: '4px 16px 6px', fontSize: 10, color: 'var(--text-muted)' }}>
            Uptime: 99.99%
          </div>
          <div style={{ padding: '0 8px 10px' }}>
            <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', color: 'var(--danger)', fontSize: 12 }} onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}