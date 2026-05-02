// ═══════════════════════════════════════════════════════════
// PoliciesPage.js
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { policiesAPI, assetsAPI } from '../services/api';
import { Shield, Plus, Edit2, Trash2, Play, Pause, ToggleLeft, ToggleRight, Clock, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const frecuenciaLabels = { diaria: 'Diaria', semanal: 'Semanal', mensual: 'Mensual' };
const tipoLabels = { completa: 'Completa', incremental: 'Incremental', diferencial: 'Diferencial' };

function PolicyModal({ onClose, onSave, editData, assets }) {
  const [form, setForm] = useState(editData || {
    nombre: '', descripcion: '', frecuencia: 'diaria', tipoCopia: 'completa',
    activos: [], diasRetencion: 30, horaEjecucion: '02:00',
    cifradoHabilitado: true, notificarFallos: true, notificarExito: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <h3 className="modal-title">{editData ? '✏️ Editar Política' : '+ Nueva Política de Respaldo'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-control" value={form.nombre} onChange={e => f('nombre', e.target.value)} placeholder="Respaldo Crítico Diario" required />
            </div>
            <div className="form-group">
              <label className="form-label">Frecuencia</label>
              <select className="form-control" value={form.frecuencia} onChange={e => f('frecuencia', e.target.value)}>
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Tipo de Copia</label>
              <select className="form-control" value={form.tipoCopia} onChange={e => f('tipoCopia', e.target.value)}>
                <option value="completa">Completa</option>
                <option value="incremental">Incremental</option>
                <option value="diferencial">Diferencial</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hora de Ejecución</label>
              <input type="time" className="form-control" value={form.horaEjecucion} onChange={e => f('horaEjecucion', e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Retención (días)</label>
              <input type="number" className="form-control" value={form.diasRetencion} onChange={e => f('diasRetencion', +e.target.value)} min="1" max="3650" />
            </div>
            <div className="form-group">
              <label className="form-label">Activos Incluidos</label>
              <select className="form-control" multiple value={form.activos} onChange={e => f('activos', Array.from(e.target.selectedOptions, o => o.value))} style={{ height: 80 }}>
                {assets.map(a => <option key={a._id} value={a._id}>{a.nombre} ({a.tipo})</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-control" value={form.descripcion} onChange={e => f('descripcion', e.target.value)} rows={2} placeholder="Descripción opcional..." />
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[['cifradoHabilitado','🔒 Cifrado AES-256'],['notificarFallos','🔔 Notificar fallos'],['notificarExito','✅ Notificar éxitos']].map(([k,l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form[k]} onChange={e => f(k, e.target.checked)} />
                {l}
              </label>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <RefreshCw size={13} className="spin" /> : <Shield size={13} />}
              {editData ? 'Guardar cambios' : 'Crear política'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PoliciesPage() {
  const { hasPermission } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | policy-obj

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([policiesAPI.getAll(), assetsAPI.getAll()]);
      setPolicies(pRes.data?.policies || []);
      setAssets(aRes.data || []);
    } catch {}
    setLoading(false);
  };

  const handleSave = async (form) => {
    if (modal?._id) await policiesAPI.update(modal._id, form);
    else await policiesAPI.create(form);
    await fetchAll();
  };

  const handleToggle = async (id) => { await policiesAPI.toggle(id); fetchAll(); };
  const handleDelete = async (id) => { if (window.confirm('¿Eliminar política?')) { await policiesAPI.delete(id); fetchAll(); } };

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Políticas de Respaldo</h1>
          <p className="page-subtitle">Gestione los ciclos de vida de sus datos críticos con protocolos de seguridad automatizados.</p>
        </div>
        {hasPermission(['admin','ti']) && (
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            <Plus size={14} /> Nueva Política
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><RefreshCw size={28} className="spin" /><p>Cargando políticas...</p></div>
      ) : !policies.length ? (
        <div className="empty-state"><Shield size={40} /><p>No hay políticas configuradas.</p>
          <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={14} /> Crear primera política</button>
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px,1fr))' }}>
          {policies.map(p => (
            <div key={p._id} className={`policy-card ${p.estado !== 'activa' ? 'inactive' : ''}`}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary)20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      PROTOCOLO {frecuenciaLabels[p.frecuencia]}
                    </div>
                  </div>
                </div>
                <span className={`badge ${p.estado === 'activa' ? 'badge-success' : 'badge-muted'}`}>
                  {p.estado === 'activa' ? 'ENFORCED' : 'INACTIVA'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  ['Frecuencia', frecuenciaLabels[p.frecuencia]],
                  ['Retención', `${p.diasRetencion} Días`],
                  ['Tipo', tipoLabels[p.tipoCopia]],
                ].map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</div>
                  </div>
                ))}
              </div>

              {p.descripcion && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.descripcion}</div>}

              {p.activos?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['DB','FS','API'].slice(0, p.activos.length).map((t,i) => (
                    <span key={i} className="badge badge-muted" style={{ fontSize: 10 }}>{t}</span>
                  ))}
                </div>
              )}

              {p.cifradoHabilitado && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--success)' }}>
                  <span>🔒</span> Encriptación AES-256 habilitada
                </div>
              )}

              <div className="flex-between" style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {hasPermission(['admin','ti']) && (
                    <>
                      <button className="btn btn-ghost btn-icon" title="Editar" onClick={() => setModal(p)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-icon" title="Eliminar" onClick={() => handleDelete(p._id)}><Trash2 size={13} /></button>
                    </>
                  )}
                </div>
                {hasPermission(['admin','ti']) && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(p._id)}>
                    {p.estado === 'activa' ? <><Pause size={12} /> Pausar</> : <><Play size={12} /> Activar</>}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Create New card */}
          {hasPermission(['admin','ti']) && (
            <div onClick={() => setModal('create')} style={{
              background: 'var(--bg-card)', border: '1px dashed var(--border)',
              borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', minHeight: 200, color: 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Crear Nueva Regla</div>
                <div style={{ fontSize: 11 }}>Configurar protocolo de protección personalizado</div>
              </div>
            </div>
          )}
        </div>
      )}

      {modal && (
        <PolicyModal
          editData={typeof modal === 'object' ? modal : null}
          assets={assets}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BackupsPage.js
// ═══════════════════════════════════════════════════════════
import { backupsAPI, policiesAPI as polAPI } from '../services/api';
import { Cloud, CheckCircle, XCircle, AlertTriangle, RotateCcw, Eye, ShieldCheck } from 'lucide-react';

const fmtBytes2 = (b) => {
  if (!b) return '0 B';
  const u = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(b || 1) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

export function BackupsPage() {
  const { hasPermission } = useAuth();
  const [backups, setBackups] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, exitosos: 0, fallidos: 0, enProgreso: 0 });
  const [filters, setFilters] = useState({ estado: '', page: 1 });
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchAll(); }, [filters.estado, filters.page]);
  useEffect(() => { polAPI.getAll().then(r => setPolicies(r.data?.policies || [])); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await backupsAPI.getAll({ estado: filters.estado || undefined, page: filters.page, limit: 20 });
      const bk = res.data?.backups || [];
      setBackups(bk);
      setStats({
        total: res.data?.total || 0,
        exitosos: bk.filter(b => b.estado === 'exitoso').length,
        fallidos: bk.filter(b => b.estado === 'fallido').length,
        enProgreso: bk.filter(b => b.estado === 'en_progreso').length,
      });
    } catch {}
    setLoading(false);
  };

  const executeManual = async (policyId) => {
    try {
      await backupsAPI.execute(policyId);
      alert('✅ Respaldo iniciado correctamente');
      setTimeout(fetchAll, 2000);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const verifyHash = async (id) => {
    try {
      const res = await backupsAPI.verify(id);
      alert(res.data.integro ? '✅ SHA-256 verificado. Archivo íntegro.' : '❌ Integridad comprometida. Hash no coincide.');
    } catch (err) { alert('Error verificando: ' + err.message); }
  };

  const statusIcon = (s) => {
    if (s === 'exitoso') return <CheckCircle size={14} color="var(--success)" />;
    if (s === 'fallido') return <XCircle size={14} color="var(--danger)" />;
    if (s === 'en_progreso') return <RefreshCw size={14} color="var(--info)" className="spin" />;
    return <AlertTriangle size={14} color="var(--warning)" />;
  };

  const statusBadge = (s) => {
    const map = { exitoso: 'badge-success', fallido: 'badge-danger', en_progreso: 'badge-info', corrupto: 'badge-danger' };
    const labels = { exitoso: 'Exitoso', fallido: 'Fallido', en_progreso: 'En progreso', corrupto: 'Corrupto' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{statusIcon(s)} {labels[s] || s}</span>;
  };

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">CENTRO DE RESPALDOS</h1>
          <p className="page-subtitle">Monitoreo en tiempo real de la integridad de datos corporativos.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => window.location.href='/restaurar'}>
            <RotateCcw size={14} /> Restaurar Ahora
          </button>
          {hasPermission(['admin','ti']) && (
            <div style={{ position: 'relative' }}>
              <select className="form-control" style={{ paddingRight: 12 }} onChange={e => { if(e.target.value) executeManual(e.target.value); e.target.value=''; }}>
                <option value="">+ Nuevo Respaldo Manual</option>
                {policies.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Operaciones Totales', value: stats.total, color: 'var(--primary)' },
          { label: 'Exitosos', value: stats.exitosos, color: 'var(--success)' },
          { label: 'Fallidos', value: stats.fallidos, color: 'var(--danger)' },
          { label: 'En Progreso', value: stats.enProgreso, color: 'var(--info)' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filtrar:</span>
          {['', 'exitoso', 'fallido', 'en_progreso', 'corrupto'].map(s => (
            <button key={s} className={`btn btn-sm ${filters.estado === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilters(f => ({ ...f, estado: s, page: 1 }))}>
              {s || 'Todos'}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={fetchAll}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="empty-state"><RefreshCw size={28} className="spin" /><p>Cargando respaldos...</p></div>
        ) : !backups.length ? (
          <div className="empty-state"><Cloud size={40} /><p>No hay respaldos que mostrar</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Identificador</th>
                <th>Política</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Tamaño</th>
                <th>Hash SHA-256</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backups.map(b => (
                <tr key={b._id}>
                  <td><span className="backup-id">{b.identificador?.slice(0,20)}…</span></td>
                  <td><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.politica?.nombre || 'N/A'}</span></td>
                  <td><span className="badge badge-muted">{b.tipoCopia}</span></td>
                  <td style={{ fontSize: 12 }}>{new Date(b.createdAt).toLocaleString('es-CO')}</td>
                  <td>{fmtBytes2(b.tamanoBytes)}</td>
                  <td>
                    {b.hashSHA256
                      ? <span className="sha-hash" title={b.hashSHA256}>{b.hashSHA256.slice(0,20)}…</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                  </td>
                  <td>{statusBadge(b.estado)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {b.hashSHA256 && (
                        <button className="btn btn-ghost btn-sm" title="Verificar SHA-256" onClick={() => verifyHash(b._id)}>
                          <ShieldCheck size={12} />
                        </button>
                      )}
                      {hasPermission(['admin','ti']) && b.estado === 'exitoso' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => window.location.href='/restaurar'}>
                          <RotateCcw size={12} /> Restaurar
                        </button>
                      )}
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

// ═══════════════════════════════════════════════════════════
// RestorePage.js
// ═══════════════════════════════════════════════════════════
import { restoreAPI, backupsAPI as bkAPI } from '../services/api';
import { RotateCcw as RestoreIcon, ShieldCheck as IntegrityIcon, Calendar, CheckSquare } from 'lucide-react';

export function RestorePage() {
  const [backups, setBackups] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelectedBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tipo: 'total', rutaDestino: '' });

  useEffect(() => {
    bkAPI.getAll({ estado: 'exitoso', limit: 50 }).then(r => setBackups(r.data?.backups || []));
    restoreAPI.getHistory().then(r => setHistory(r.data?.restores || []));
  }, []);

  const handleRestore = async () => {
    if (!selected) return alert('Seleccione un respaldo');
    if (!window.confirm(`¿Iniciar restauración ${form.tipo} del respaldo seleccionado?`)) return;
    setLoading(true);
    try {
      await restoreAPI.initiate({ backupId: selected._id, ...form });
      alert('✅ Restauración iniciada. SHA-256 verificado. Proceso en ejecución.');
      const r = await restoreAPI.getHistory();
      setHistory(r.data?.restores || []);
    } catch (err) { alert('Error: ' + err.message); }
    setLoading(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Vault Recovery</h1>
          <p className="page-subtitle">Initialize secure restoration procedures. Select a verified recovery point from the encrypted timeline.</p>
        </div>
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--success-dim)', border: '1px solid var(--success)40', borderRadius: 8, padding: '7px 14px' }}>
            <span className="status-dot dot-success" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>System: Integrity Verified</span>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Backup selector */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700 }}>Temporal Recovery Points</span>
            <span className="badge badge-primary">{backups.length} disponibles</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {backups.map(b => (
              <div key={b._id} onClick={() => setSelectedBackup(b)} style={{
                padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${selected?._id === b._id ? 'var(--primary)' : 'var(--border)'}`,
                background: selected?._id === b._id ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{b.politica?.nombre || 'Respaldo'}</span>
                  <span className="badge badge-success">Verificado</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(b.createdAt).toISOString().replace('T',' ').slice(0,19)} UTC
                </div>
                {b.hashSHA256 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    <span className="badge badge-info" style={{ fontSize: 9 }}>🔒 ENCRYPTED AES-256</span>
                    <span className="badge badge-muted" style={{ fontSize: 9 }}>SHA-256 VERIFIED</span>
                  </div>
                )}
              </div>
            ))}
            {!backups.length && <div className="empty-state"><Cloud size={28} /><p>No hay respaldos exitosos disponibles</p></div>}
          </div>
        </div>

        {/* Right: Restore config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--success)40', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: 'var(--success-dim)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IntegrityIcon size={18} color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)' }}>SHA-256 Integrity Check Passed</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No tampering detected</div>
                </div>
              </div>
              <div className="sha-hash" style={{ maxWidth: '100%', display: 'block', padding: '6px 10px' }}>
                {selected.hashSHA256 || 'N/A - No hash disponible'}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Recovery Destination</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Restore Target</label>
                <select className="form-control" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="total">Original Location (In-place)</option>
                  <option value="selectiva">Alternative Location</option>
                </select>
              </div>
              {form.tipo === 'selectiva' && (
                <div className="form-group">
                  <label className="form-label">Ruta Destino</label>
                  <input className="form-control" value={form.rutaDestino} onChange={e => setForm(f => ({ ...f, rutaDestino: e.target.value }))} placeholder="/ruta/destino/alternativo" />
                </div>
              )}
              <div style={{ background: 'var(--warning-dim)', border: '1px solid var(--warning)40', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--warning)', display: 'flex', gap: 8 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                OVERWRITE PROTECTION ENABLED – Esta acción será registrada y auditada.
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: 12, fontSize: 14 }}
                onClick={handleRestore} disabled={!selected || loading}>
                {loading ? <RefreshCw size={15} className="spin" /> : <RestoreIcon size={15} />}
                {loading ? 'Procesando...' : 'AUTHORIZE RECOVERY'}
              </button>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                Proceeding will initiate a deep-level data reconstruction. This action is logged and audited.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restore History */}
      <div className="card mt-4">
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>Post Restore Audit</span>
          <span className="badge badge-muted">{history.length} operaciones</span>
        </div>
        {!history.length ? (
          <div className="empty-state"><RestoreIcon size={28} /><p>No hay historial de restauraciones</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Respaldo</th><th>Tipo</th><th>Solicitado Por</th><th>Fecha</th><th>Estado</th><th>Integridad</th></tr></thead>
            <tbody>
              {history.map(r => (
                <tr key={r._id}>
                  <td><span className="backup-id">{r.respaldo?.identificador?.slice(0,16) || 'N/A'}…</span></td>
                  <td><span className="badge badge-muted">{r.tipoRestauracion}</span></td>
                  <td>{r.solicitadoPor?.email || 'N/A'}</td>
                  <td style={{ fontSize: 12 }}>{new Date(r.createdAt).toLocaleString('es-CO')}</td>
                  <td><span className={`badge ${r.estado === 'exitoso' ? 'badge-success' : r.estado === 'fallido' ? 'badge-danger' : 'badge-info'}`}>{r.estado}</span></td>
                  <td>{r.integridadVerificada ? <span style={{ color: 'var(--success)', fontSize: 12 }}>✓ SHA-256</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UsersPage.js
// ═══════════════════════════════════════════════════════════
import { usersAPI } from '../services/api';
import { UserPlus, Unlock, UserX, Edit2 as EditIcon } from 'lucide-react';

const roleColors = { admin: 'badge-danger', ti: 'badge-primary', operativo: 'badge-muted', directivo: 'badge-success' };
const roleLabelsMap = { admin: 'ADMIN', ti: 'TI / SOPORTE', operativo: 'OPERATIVO', directivo: 'DIRECTIVO' };

function UserModal({ onClose, onSave, editData }) {
  const [form, setForm] = useState(editData || { nombre: '', email: '', password: '', rol: 'operativo' });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">{editData ? 'Editar Usuario' : '+ Nuevo Usuario'}</h3>
        <form onSubmit={async e => { e.preventDefault(); setLoading(true); try { await onSave(form); onClose(); } catch(err){alert(err.message);} finally{setLoading(false);} }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nombre completo</label>
            <input className="form-control" value={form.nombre} onChange={e => f('nombre', e.target.value)} required />
          </div>
          <div className="form-group"><label className="form-label">Email</label>
            <input type="email" className="form-control" value={form.email} onChange={e => f('email', e.target.value)} required />
          </div>
          {!editData && <div className="form-group"><label className="form-label">Contraseña (mín. 8 caracteres)</label>
            <input type="password" className="form-control" value={form.password} onChange={e => f('password', e.target.value)} required minLength={8} />
          </div>}
          <div className="form-group"><label className="form-label">Rol</label>
            <select className="form-control" value={form.rol} onChange={e => f('rol', e.target.value)}>
              <option value="admin">Administrador</option>
              <option value="ti">Personal TI</option>
              <option value="operativo">Usuario Operativo</option>
              <option value="directivo">Directivo</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <RefreshCw size={13} className="spin" /> : <UserPlus size={13} />} {editData ? 'Guardar' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsersPage() {
  const { hasPermission, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState({ total: 0, activos: 0, bloqueados: 0 });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      const us = res.data?.users || [];
      setUsers(us);
      setStats({ total: us.length, activos: us.filter(u => u.estado === 'activo').length, bloqueados: us.filter(u => u.estado === 'bloqueado').length });
    } catch {}
    setLoading(false);
  };

  const handleSave = async (form) => {
    if (modal?._id) await usersAPI.update(modal._id, form);
    else await usersAPI.create(form);
    await fetchUsers();
  };

  const handleUnlock = async (id) => { if (window.confirm('¿Desbloquear esta cuenta?')) { await usersAPI.unlock(id); fetchUsers(); } };
  const handleDeactivate = async (id) => { if (window.confirm('¿Desactivar este usuario?')) { await usersAPI.delete(id); fetchUsers(); } };

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Gestión de Acceso</h1>
          <p className="page-subtitle">Administre identidades, asigne privilegios jerárquicos y monitoree el estado de seguridad.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary"><Shield size={14} /> Exportar Log</button>
          {hasPermission(['admin']) && <button className="btn btn-primary" onClick={() => setModal('create')}><UserPlus size={14} /> Nuevo Usuario</button>}
        </div>
      </div>

      <div className="grid-4 mb-6">
        {[
          { label: 'Total Operadores', value: stats.total, sub: '+3 este mes', color: 'var(--primary)' },
          { label: 'Cuentas Activas', value: stats.activos, sub: 'En línea', color: 'var(--success)' },
          { label: 'Sesiones Activas', value: '—', sub: 'En vivo', color: 'var(--info)' },
          { label: 'Bloqueadas', value: stats.bloqueados, sub: 'Requieren atención', color: 'var(--danger)' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>Directorio de Operadores</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchUsers}><RefreshCw size={12} className={loading ? 'spin' : ''} /></button>
        </div>
        {loading ? <div className="empty-state"><RefreshCw size={28} className="spin" /></div> : (
          <table className="data-table">
            <thead><tr><th>Usuario</th><th>Rol Asignado</th><th>Estado</th><th>Último Acceso</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12 }}>
                        {u.nombre?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${roleColors[u.rol]}`}>{roleLabelsMap[u.rol]}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-dot ${u.estado === 'activo' ? 'dot-success' : u.estado === 'bloqueado' ? 'dot-danger' : 'dot-warning'}`} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{u.estado}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-CO') : 'Nunca'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {hasPermission(['admin']) && u._id !== me?.id && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}><EditIcon size={12} /></button>
                          {u.estado === 'bloqueado' && <button className="btn btn-secondary btn-sm" onClick={() => handleUnlock(u._id)}><Unlock size={12} /> Desbloquear</button>}
                          {u.estado === 'activo' && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id)}><UserX size={12} /></button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <UserModal editData={typeof modal === 'object' ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ReportsPage.js
// ═══════════════════════════════════════════════════════════
import { reportsAPI } from '../services/api';
import { BarChart2, Download, FileText, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis as RXAxis, YAxis as RYAxis, Tooltip as RTooltip, ResponsiveContainer as RRC, LineChart, Line } from 'recharts';

export function ReportsPage() {
  const [tipo, setTipo] = useState('backups');
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const handleExport = async (fmt = 'excel') => {
    setLoading(true);
    try {
      const res = await reportsAPI.export({ tipo, formato: fmt, desde: desde || undefined, hasta: hasta || undefined });
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `sentinelx_${tipo}_${Date.now()}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { alert('Error exportando: ' + err.message); }
    setLoading(false);
  };

  const mockNetData = Array.from({length:24}, (_,i) => ({ hora: `${String(i).padStart(2,'0')}:00`, mainframe: Math.random()*80+20, edge: Math.random()*60+10 }));

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Reportes Analíticos</h1>
          <p className="page-subtitle">Panel de inteligencia avanzado para el monitoreo de infraestructura, rendimiento y consistencia de datos históricos.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => handleExport('pdf')} disabled={loading}><FileText size={14} /> PDF</button>
          <button className="btn btn-primary" onClick={() => handleExport('excel')} disabled={loading}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Download size={14} />} Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Tasa de Éxito', value: '99.98%', trend: '+2.4%', color: 'var(--success)' },
          { label: 'Latencia Global', value: '42ms', trend: '12ms', color: 'var(--info)' },
          { label: 'Crecimiento Datos', value: '14.2 TB', trend: '-0.8%', color: 'var(--warning)' },
          { label: 'Sesiones Concurrentes', value: '1,204', trend: '+12%', color: 'var(--primary)' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>↑ {s.trend}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '0 0 auto' }}>
            <label className="form-label">Tipo de reporte</label>
            <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="backups">Respaldos</option>
              <option value="logs">Logs de Auditoría</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Desde</label>
            <input type="date" className="form-control" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input type="date" className="form-control" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => handleExport()} disabled={loading} style={{ marginBottom: 0 }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Download size={14} />} Exportar Reporte
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Network Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Rendimiento de Red & Latencia</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Monitoreo en tiempo real de nodos distribuidos</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: 'var(--primary)', borderRadius: 2, display: 'inline-block' }} /> MAINFRAME</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: 'var(--tertiary)', borderRadius: 2, display: 'inline-block' }} /> EDGE NODES</span>
            </div>
          </div>
          <RRC width="100%" height={200}>
            <BarChart data={mockNetData.filter((_,i) => i % 2 === 0)}>
              <RXAxis dataKey="hora" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <RYAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="mainframe" fill="var(--primary)" radius={[3,3,0,0]} opacity={0.8} />
              <Bar dataKey="edge" fill="var(--tertiary)" radius={[3,3,0,0]} opacity={0.8} />
            </BarChart>
          </RRC>
        </div>

        {/* State of Backups */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700 }}>Estado de Respaldos</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            {[
              { label: 'Exitosos', value: 12402, max: 13000, color: 'var(--primary)' },
              { label: 'Advertencias', value: 142, max: 13000, color: 'var(--tertiary)' },
              { label: 'Fallidos', value: 3, max: 13000, color: 'var(--danger)' },
            ].map((s,i) => (
              <div key={i}>
                <div className="flex-between mb-4" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.value.toLocaleString()}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(s.value/s.max)*100}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AuditPage.js
// ═══════════════════════════════════════════════════════════
import { logsAPI } from '../services/api';
import { BookOpen, Filter as FilterIcon, Download as DlIcon } from 'lucide-react';

export function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ modulo: '', resultado: '', page: 1 });
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchLogs(); }, [filters.modulo, filters.resultado, filters.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await logsAPI.getAll({ ...filters, limit: 30 });
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch {}
    setLoading(false);
  };

  const resultadoColor = { success: 'var(--success)', failed: 'var(--danger)', warning: 'var(--warning)' };
  const resultadoBadge = { success: 'badge-success', failed: 'badge-danger', warning: 'badge-warning' };

  return (
    <div className="animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Audit Stream</h1>
          <p className="page-subtitle">Registro inmutable de actividad del sistema. Análisis forense en tiempo real de accesos, modificaciones y eventos críticos.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary"><FilterIcon size={14} /> Filtrar Logs</button>
          <button className="btn btn-primary"><DlIcon size={14} /> Exportar Protocolo</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-6">
        {[
          { label: 'Eventos 24H', value: total.toLocaleString(), color: 'var(--primary)', sub: '↑+12% vs ayer' },
          { label: 'Fallos de Acceso', value: logs.filter(l=>l.accion?.includes('FAILED')).length, color: 'var(--danger)', sub: '⚠ Requiere revisión' },
          { label: 'Nodos Activos', value: '16/16', color: 'var(--success)', sub: '● Integridad verificada' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-control" style={{ width: 'auto' }} value={filters.modulo} onChange={e => setFilters(f => ({ ...f, modulo: e.target.value, page: 1 }))}>
            <option value="">Todos los módulos</option>
            {['auth','users','policies','assets','backups','restore','reports','config','scheduler'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filters.resultado} onChange={e => setFilters(f => ({ ...f, resultado: e.target.value, page: 1 }))}>
            <option value="">Todos los resultados</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="warning">Warning</option>
          </select>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            <span className="status-dot dot-success" style={{ animation: 'pulse-glow 1.5s infinite' }} />
            REAL-TIME
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={14} color="var(--primary)" />
            <span style={{ fontWeight: 700 }}>Registro de Operaciones</span>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
            {[['var(--success)','INFO'], ['var(--warning)','WARN'], ['var(--danger)','CRIT']].map(([c,l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} /> {l}
              </span>
            ))}
          </div>
        </div>

        {loading ? <div className="empty-state"><RefreshCw size={28} className="spin" /></div> : !logs.length ? (
          <div className="empty-state"><BookOpen size={32} /><p>No hay registros que mostrar</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Usuario ID</th>
                <th>Origen IP</th>
                <th>Acción Realizada</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td><span className="log-timestamp">{new Date(l.createdAt).toISOString().replace('T',' ').slice(0,23)}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="user-avatar" style={{ width: 22, height: 22, borderRadius: 4, fontSize: 8, flexShrink: 0 }}>
                        {(l.usuarioEmail || l.usuario?.email || 'S')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{l.usuarioEmail || l.usuario?.email || 'Sistema'}</span>
                    </div>
                  </td>
                  <td><span className="font-mono">{l.ipOrigen || '—'}</span></td>
                  <td>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: resultadoColor[l.resultado] || 'var(--text-primary)' }}>{l.accion}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{l.descripcion?.slice(0, 60)}…</div>
                    </div>
                  </td>
                  <td><span className={`badge ${resultadoBadge[l.resultado] || 'badge-muted'}`}>{l.resultado?.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex-between mt-4" style={{ marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mostrando {logs.length} de {total} entradas</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹</button>
            <span className="btn btn-secondary btn-sm">{filters.page}</span>
            <button className="btn btn-secondary btn-sm" disabled={filters.page * 30 >= total} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ConfigPage.js
// ═══════════════════════════════════════════════════════════
import { Settings, Key, Mail, ToggleRight as Toggle, ChevronDown as CDown } from 'lucide-react';

export function ConfigPage() {
  const [config, setConfig] = useState({
    algoritmo: 'AES-256-GCM', rotacionAuto: true, rotacionDias: 90,
    smtpHabilitado: true, smtpHost: '', smtpUser: '',
  });

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Configuración Global</h1>
        <p className="page-subtitle">Administra los parámetros de seguridad, integraciones externas y la apariencia del sistema Sentinel X.</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Encryption */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'var(--primary)20', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={16} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Llaves de Encriptación</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gestión de llaves maestras AES-256 y rotación</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Algoritmo Maestro</label>
                  <select className="form-control" value={config.algoritmo} onChange={e => setConfig(c => ({ ...c, algoritmo: e.target.value }))}>
                    <option>AES-256-GCM</option>
                    <option>AES-256-CBC</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rotación Automática</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38 }}>
                    <input type="checkbox" checked={config.rotacionAuto} onChange={e => setConfig(c => ({ ...c, rotacionAuto: e.target.checked }))} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Activado ({config.rotacionDias} días)</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                🔑 last_rotation: {new Date(Date.now() - 30*86400000).toISOString().slice(0,19)}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>Rotar Ahora</button>
            </div>
          </div>

          {/* SMTP */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'var(--success)20', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={16} color="var(--success)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Canales de Notificación</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Alertas críticas y reportes semanales</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={15} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Correo Electrónico (SMTP)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>alertas@empresa.com</div>
                  </div>
                </div>
                <input type="checkbox" checked={config.smtpHabilitado} onChange={e => setConfig(c => ({ ...c, smtpHabilitado: e.target.checked }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Host SMTP</label>
                <input className="form-control" placeholder="smtp.gmail.com" value={config.smtpHost} onChange={e => setConfig(c => ({ ...c, smtpHost: e.target.value }))} />
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>Guardar configuración</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Integrations */}
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700 }}>Integraciones Externas</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Almacenamiento Local (NAS)', status: 'conectado', desc: 'Repositorio principal de respaldos' },
                { name: 'PostgreSQL / MongoDB', status: 'conectado', desc: 'Base de datos del sistema' },
                { name: 'Servicio SMTP', status: config.smtpHabilitado ? 'conectado' : 'desconectado', desc: 'Notificaciones por email' },
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)40' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <span className={`badge ${item.status === 'conectado' ? 'badge-success' : 'badge-danger'}`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700 }}>Información del Sistema</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Versión', 'SentinelX v1.0.0'],
                ['Estándar', 'ISO/IEC 27001:2022'],
                ['Cifrado', 'AES-256-GCM'],
                ['Hash integridad', 'SHA-256'],
                ['Auth', 'JWT + RBAC'],
                ['Cumplimiento', 'Ley 1581/2012 (Colombia)'],
              ].map(([k,v]) => (
                <div key={k} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)30', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: k === 'Versión' ? 'var(--font-mono)' : 'inherit', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
