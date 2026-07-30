import { useState } from 'react';

export default function CatalogPicker({ catalog, value, onChange }) {
  const [search, setSearch] = useState('');
  const selected = catalog.find((e) => e.id === value);

  const filtered = catalog.filter(
    (e) =>
      !search ||
      e.titulo.toLowerCase().includes(search.toLowerCase()) ||
      e.familia.toLowerCase().includes(search.toLowerCase()) ||
      String(e.id).includes(search)
  );

  if (selected) {
    return (
      <div className="mention-item target-user-selected">
        <span>
          #{selected.id} · {selected.titulo}
        </span>
        <button type="button" className="btn-secondary" onClick={() => onChange(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ID, título o familia..." />
      <div className="mention-list">
        {filtered.slice(0, 40).map((e) => (
          <button key={e.id} type="button" className="mention-item" onClick={() => onChange(e.id)}>
            #{e.id} · {e.titulo} <span className="muted">({e.familia})</span>
          </button>
        ))}
      </div>
    </>
  );
}
