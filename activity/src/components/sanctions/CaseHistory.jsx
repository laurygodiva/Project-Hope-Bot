import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import SanctionLineEditor from './SanctionLineEditor.jsx';

function formatRemaining(ms) {
  if (ms <= 0) return 'Terminando...';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getStatus(c, now) {
  if (c.archived) return { key: 'archivada', label: 'Archivada' };
  if (c.total.permaban) return { key: 'activa', label: 'Activa (permanente)' };
  if (c.total.ends_at_iso) {
    const endsAt = Date.parse(c.total.ends_at_iso);
    if (endsAt > now) return { key: 'activa', label: `Activa · ${formatRemaining(endsAt - now)}` };
  }
  return { key: 'cumplida', label: 'Cumplida' };
}

export default function CaseHistory({ catalog }) {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editLines, setEditLines] = useState([]);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  function load(searchTerm = search) {
    const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
    api
      .get(`/sanctions/cases${query}`)
      .then(setCases)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function startEdit(c) {
    setEditingId(c.id);
    setEditLines(c.lineas.map((l) => ({ ...l })));
  }

  async function saveEdit(id) {
    try {
      await api.put(`/sanctions/cases/${id}`, { lineas: editLines });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/sanctions/cases/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleManualApplied(c) {
    try {
      const updated = await api.put(`/sanctions/cases/${c.id}`, { manualApplied: !c.manualApplied });
      setCases((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleArchived(c) {
    try {
      const updated = await api.put(`/sanctions/cases/${c.id}`, { archived: !c.archived });
      setCases((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!cases) return null;

  return (
    <div className="send-message-page">
      <label>
        <span className="field-title">Buscar por usuario</span>
        <input
          type="text"
          placeholder="Nombre o ID de usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {cases.length === 0 && <p className="muted">No hay sanciones que coincidan.</p>}

      <div className="catalog-table">
        {cases.map((c) => {
          const status = getStatus(c, now);
          const hasManualPunishments = c.decisiones.some((d) => d.castigo_manual);
          return (
            <div key={c.id}>
              <div className="catalog-row case-row">
                <span className="catalog-title">{c.targetName || c.targetId}</span>
                <span className="muted">{c.decisiones.map((d) => d.titulo).join(', ')}</span>
                <span className="catalog-severity">
                  {c.total.permaban ? 'PermaBan' : c.total.auto_ms > 0 ? `${Math.round(c.total.auto_ms / 86400000)}d` : 'Sin baneo'}
                </span>
                <span className={`status-badge status-${status.key}`}>{status.label}</span>
                <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
                <div className="catalog-actions">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(c)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleDelete(c.id)}
                    title="Elimina el registro y revierte el rol/baneo aplicado"
                  >
                    Eliminar
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => toggleArchived(c)}>
                    {c.archived ? 'Desarchivar' : 'Archivar'}
                  </button>
                </div>
              </div>

              {hasManualPunishments && (
                <label className="manual-applied-check">
                  <input type="checkbox" checked={!!c.manualApplied} onChange={() => toggleManualApplied(c)} />
                  <span>Castigo manual aplicado ({c.decisiones.filter((d) => d.castigo_manual).map((d) => d.castigo_manual).join(', ')})</span>
                </label>
              )}

              {editingId === c.id && (
                <div className="case-edit">
                  {editLines.map((line, i) => (
                    <SanctionLineEditor
                      key={i}
                      catalog={catalog}
                      line={line}
                      onChange={(next) => setEditLines((prev) => prev.map((l, li) => (li === i ? next : l)))}
                      onRemove={() => setEditLines((prev) => prev.filter((_, li) => li !== i))}
                    />
                  ))}
                  <div className="color-generator-actions">
                    <button type="button" className="btn-primary" onClick={() => saveEdit(c.id)}>
                      Guardar cambios
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                  </div>
                  <p className="muted">
                    Editar corrige el registro (útil para errores de captura). No vuelve a aplicar ni retirar roles/baneos ya
                    ejecutados en Discord.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
