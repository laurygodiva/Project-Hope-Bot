import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { copyToClipboard } from '../utils/clipboard.js';

export default function UserRoleSearch({ roles }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(null);
  const [revealedId, setRevealedId] = useState(null);
  const inputRef = useRef(null);

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

  function revealId(id) {
    setRevealedId((prev) => (prev === id ? null : id));
    copyToClipboard(id);
  }

  useEffect(() => {
    if (revealedId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [revealedId]);

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
            <div key={m.id}>
              <button
                type="button"
                className="role-member user-role-search-item"
                onClick={() => revealId(m.id)}
                title="Mostrar/copiar ID del usuario"
              >
                <img src={m.avatar} alt="" />
                <span className="user-role-search-info">
                  <span className="role-member-name">{m.displayName}</span>
                  <span className="muted">{m.roles.length ? m.roles.map(roleName).join(', ') : 'Sin roles'}</span>
                </span>
              </button>
              {revealedId === m.id && (
                <div className="role-member-id-reveal">
                  <input ref={inputRef} type="text" readOnly value={m.id} onClick={(e) => e.target.select()} />
                  <span className="muted">Ctrl+C para copiar</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
