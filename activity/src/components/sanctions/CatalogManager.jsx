import { useState } from 'react';
import { api } from '../../api/client.js';

const SEVERITY_LABELS = { 1: 'S.1 Aviso', 2: 'S.2 Sanción', 3: 'S.3 Baneo 3d', 4: 'S.4 Baneo 5d', 5: 'S.5 Baneo 7d', 6: 'S.6 PermaBan' };

function emptyForm() {
  return {
    id: '',
    familia: '',
    titulo: '',
    descripcion: '',
    severidad_base: 1,
    pdr_cost: '',
    castigo_manual: '',
    reiterado_limit: '',
    severidad_base_staff: '',
    pdr_cost_staff: '',
    castigo_manual_staff: '',
  };
}

export default function CatalogManager({ catalog, onReload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  function startEdit(entry) {
    setEditing(entry.id);
    setForm({
      ...entry,
      pdr_cost: entry.pdr_cost ?? '',
      castigo_manual: entry.castigo_manual ?? '',
      reiterado_limit: entry.reiterado_limit ?? '',
      severidad_base_staff: entry.severidad_base_staff ?? '',
      pdr_cost_staff: entry.pdr_cost_staff ?? '',
      castigo_manual_staff: entry.castigo_manual_staff ?? '',
    });
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

            <div className="catalog-staff-split">
              <div className="catalog-staff-col">
                <span className="field-title catalog-col-heading">Para un usuario</span>
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
                <label>
                  <span className="field-title">Retirada de PDR</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Por defecto según severidad"
                    value={form.pdr_cost}
                    onChange={(e) => setForm({ ...form, pdr_cost: e.target.value })}
                  />
                </label>
                <label>
                  <span className="field-title">Sanción manual (texto libre)</span>
                  <textarea
                    rows={2}
                    placeholder="Ej: retirar cargo, expulsión de facción..."
                    value={form.castigo_manual}
                    onChange={(e) => setForm({ ...form, castigo_manual: e.target.value })}
                  />
                </label>
                <label>
                  <span className="field-title">Reincidencia: nº de veces sin archivar para PermaBan automático</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 3 = a la 3ª vez, PermaBan automático"
                    value={form.reiterado_limit}
                    onChange={(e) => setForm({ ...form, reiterado_limit: e.target.value })}
                  />
                </label>
              </div>

              <div className="catalog-staff-col catalog-staff-col-highlight">
                <span className="field-title catalog-col-heading">Equivalencia para un staff</span>
                <label>
                  <span className="field-title">Severidad si es staff</span>
                  <select
                    value={form.severidad_base_staff}
                    onChange={(e) => setForm({ ...form, severidad_base_staff: e.target.value })}
                  >
                    <option value="">Igual que para un usuario</option>
                    {Object.entries(SEVERITY_LABELS).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-title">Retirada de PDR si es staff</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Igual que para un usuario"
                    value={form.pdr_cost_staff}
                    onChange={(e) => setForm({ ...form, pdr_cost_staff: e.target.value })}
                  />
                </label>
                <label>
                  <span className="field-title">Sanción manual si es staff (texto libre)</span>
                  <textarea
                    rows={2}
                    placeholder="Ej: expulsión del staff, retirar todos los cargos..."
                    value={form.castigo_manual_staff}
                    onChange={(e) => setForm({ ...form, castigo_manual_staff: e.target.value })}
                  />
                </label>
              </div>
            </div>

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
            {entry.pdr_cost != null && <span className="muted">PDR: {entry.pdr_cost}</span>}
            {entry.castigo_manual && <span className="muted">Otro: {entry.castigo_manual}</span>}
            {entry.severidad_base_staff && (
              <span className="muted">Staff: {SEVERITY_LABELS[entry.severidad_base_staff]}</span>
            )}
            {entry.pdr_cost_staff != null && <span className="muted">PDR (staff): {entry.pdr_cost_staff}</span>}
            {entry.castigo_manual_staff && <span className="muted">Otro (staff): {entry.castigo_manual_staff}</span>}
            {entry.reiterado_limit && <span className="muted">Reiteración: {entry.reiterado_limit}x → PermaBan</span>}
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
