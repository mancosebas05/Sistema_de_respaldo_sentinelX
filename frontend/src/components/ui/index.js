import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

// ─── Loading Spinner ──────────────────────────────────────
export const Spinner = ({ size = 24, text = 'Cargando...' }) => (
  <div className="empty-state">
    <RefreshCw size={size} className="spin" />
    {text && <p>{text}</p>}
  </div>
);

// ─── Empty State ──────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="empty-state">
    {Icon && <Icon size={40} />}
    <div>
      {title && <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</p>}
      {subtitle && <p style={{ fontSize: 11 }}>{subtitle}</p>}
    </div>
    {action && action}
  </div>
);

// ─── Alert Banner ─────────────────────────────────────────
export const Alert = ({ type = 'info', children }) => {
  const config = {
    info:    { icon: Info,         cls: 'badge-info',    color: 'var(--info)' },
    success: { icon: CheckCircle,  cls: 'badge-success', color: 'var(--success)' },
    warning: { icon: AlertTriangle,cls: 'badge-warning', color: 'var(--warning)' },
    error:   { icon: XCircle,      cls: 'badge-danger',  color: 'var(--danger)' },
  }[type];

  const Icon = config.icon;

  return (
    <div style={{
      background: `${config.color}15`, border: `1px solid ${config.color}40`,
      borderRadius: 8, padding: '10px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      fontSize: 13, color: config.color,
    }}>
      <Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────
export const ConfirmModal = ({ title, message, onConfirm, onCancel, danger = false }) => (
  <div className="modal-overlay">
    <div className="modal" style={{ maxWidth: 420 }}>
      <h3 className="modal-title">{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  </div>
);

// ─── Status Dot ───────────────────────────────────────────
export const StatusDot = ({ status }) => {
  const dotMap = {
    activo: 'dot-success', exitoso: 'dot-success',
    inactivo: 'dot-warning', pausada: 'dot-warning',
    bloqueado: 'dot-danger', fallido: 'dot-danger',
    en_progreso: 'dot-info',
  };
  return <span className={`status-dot ${dotMap[status] || 'dot-info'}`} />;
};

// ─── Pagination ───────────────────────────────────────────
export const Pagination = ({ page, totalPages, onPrev, onNext, total, showing }) => (
  <div className="flex-between" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
      Mostrando {showing} de {total} registros
    </span>
    <div style={{ display: 'flex', gap: 6 }}>
      <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={onPrev}>‹ Anterior</button>
      <span className="btn btn-secondary btn-sm" style={{ cursor: 'default' }}>Pág. {page} / {totalPages}</span>
      <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={onNext}>Siguiente ›</button>
    </div>
  </div>
);
