import { useState } from 'react';
import { api } from '../../api/client.js';

const SEVERITY_LABELS = { 1: 'S.1 Aviso', 2: 'S.2 Sanción', 3: 'S.3 Baneo 3d', 4: 'S.4 Baneo 5d', 5: 'S.5 Baneo 7d', 6: 'S.6 PermaBan' };

function emptyForm() {
  return { id: '', familia: '', titulo: '', descripcion: '', severidad_base: 1 };
}

export default function CatalogManager({ catalog, onReload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  function startEdit(entry) {
    setEditing(entry.id);
    setForm({ ...entry });
    setCreating(false);
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    setError(null);
    try {
      if (creating) {
        await api.post('/sanctions/catalog', form);
        setCreating(false);
      } else if (editing != null) {
        await api.put(`/sanctions/catalog/${editing}`, form);
        setEditing(null);
      }
      onReload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/sanctions/catalog/${id}`);
      onReload();
    } catch (err) {
      setError(err.message);
    }
  }

  const isFormOpen = creating || editing != null;

  return (
    <div className="send-message-page">
      {error && <p className="error-text">{error}</p>}

      {isFormOpen && (
        <div className="gradient-frame">
          <div className="embed-fields">
            <label>
              <span className="field-title">Identificador</span>
              <input
                type="number"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!creating}
              />
            </label>
            <label>
              <span className="field-title">Categoría</span>
              <input type="text" value={form.familia} onChange={(e) => setForm({ ...form, familia: e.target.value })} />
            </label>
            <label>
              <span className="field-title">Título</span>
              <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </label>
            <label>
              <span className="field-title">Descripción</span>
              <textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
            <label>
              <span className="field-title">Severidad base</span>
              <select
                value={form.severidad_base}
                onChange={(e) => setForm({ ...form, severidad_base: Number(e.target.value) })}
              >
                {Object.entries(SEVERITY_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="color-generator-actions">
              <button type="button" className="btn-primary" onClick={handleSave}>
                Guardar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {!isFormOpen && (
        <button type="button" className="btn-primary" onClick={startCreate}>
          + Añadir tipo de sanción
        </button>
      )}

      <div className="catalog-table">
        {catalog.map((entry) => (
          <div key={entry.id} className="catalog-row">
            <span className="catalog-id">#{entry.id}</span>
            <span className="catalog-title">{entry.titulo}</span>
            <span className="muted">{entry.familia}</span>
            <span className="catalog-severity">{SEVERITY_LABELS[entry.severidad_base]}</span>
            <div className="catalog-actions">
              <button type="button" className="btn-secondary" onClick={() => startEdit(entry)}>
                Editar
              </button>
              <button type="button" className="btn-secondary" onClick={() => handleDelete(entry.id)}>
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
