import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import SanctionLineEditor from './SanctionLineEditor.jsx';

export default function CaseHistory({ catalog }) {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editLines, setEditLines] = useState([]);

  function load() {
    api.get('/sanctions/cases').then(setCases).catch((err) => setError(err.message));
  }

  useEffect(load, []);

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

  if (error) return <p className="error-text">{error}</p>;
  if (!cases) return null;
  if (cases.length === 0) return <p className="muted">Todavía no se ha aplicado ninguna sanción.</p>;

  return (
    <div className="send-message-page">
      <div className="catalog-table">
        {cases.map((c) => (
          <div key={c.id}>
            <div className="catalog-row case-row">
              <span className="catalog-title">{c.targetName || c.targetId}</span>
              <span className="muted">{c.decisiones.map((d) => d.titulo).join(', ')}</span>
              <span className="catalog-severity">
                {c.total.permaban ? 'PermaBan' : c.total.auto_ms > 0 ? `${Math.round(c.total.auto_ms / 86400000)}d` : 'Sin baneo'}
              </span>
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
              </div>
            </div>

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
        ))}
      </div>
    </div>
  );
}
