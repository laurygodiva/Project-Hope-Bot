import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function UserPicker({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (value) return;
    const timeout = setTimeout(() => {
      api.get(`/guild/members?search=${encodeURIComponent(search)}&limit=30`).then(setResults);
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, value]);

  if (value) {
    return (
      <div className="mention-item target-user-selected">
        <img src={value.avatar} alt="" />
        {value.displayName}
        <button type="button" className="btn-secondary" onClick={() => onChange(null)}>
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..." />
      <div className="mention-list">
        {!results && <p className="muted">Cargando usuarios...</p>}
        {results?.map((u) => (
          <button key={u.id} type="button" className="mention-item" onClick={() => onChange(u)}>
            <img src={u.avatar} alt="" />
            {u.displayName}
          </button>
        ))}
      </div>
    </>
  );
}
