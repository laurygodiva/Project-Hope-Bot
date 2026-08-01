import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function UserRoleSearch({ roles }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get(`/guild/members?search=${encodeURIComponent(search)}&limit=10`)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  function copyId(id) {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1200);
  }

  function roleName(id) {
    return roles.find((r) => r.id === id)?.name || id;
  }

  return (
    <div className="user-role-search">
      <input
        type="text"
        placeholder="Buscar usuario por nombre o ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {results && (
        <div className="role-members user-role-search-results">
          {results.length === 0 && <p className="muted">Sin resultados.</p>}
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              className="role-member user-role-search-item"
              onClick={() => copyId(m.id)}
              title="Copiar ID del usuario"
            >
              <img src={m.avatar} alt="" />
              <span className="user-role-search-info">
                <span className="role-member-name">{m.displayName}</span>
                <span className="muted">{m.roles.length ? m.roles.map(roleName).join(', ') : 'Sin roles'}</span>
              </span>
              {copiedId === m.id && <span className="badge">ID copiada</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
