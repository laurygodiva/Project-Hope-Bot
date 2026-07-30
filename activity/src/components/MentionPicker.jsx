import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const BASE_TABS = [
  { id: 'channels', label: 'Canales' },
  { id: 'roles', label: 'Roles' },
  { id: 'users', label: 'Usuarios' },
];

export default function MentionPicker({ onInsert, placeholders }) {
  const TABS = placeholders?.length ? [...BASE_TABS, { id: 'placeholders', label: 'Variables' }] : BASE_TABS;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('channels');
  const [search, setSearch] = useState('');
  const [channels, setChannels] = useState(null);
  const [roles, setRoles] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (tab === 'channels' && channels === null) {
      api.get('/guild/channels').then(setChannels).catch((err) => setError(err.message));
    }
    if (tab === 'roles' && roles === null) {
      api.get('/guild/roles').then(setRoles).catch((err) => setError(err.message));
    }
  }, [open, tab, channels, roles]);

  useEffect(() => {
    if (!open || tab !== 'users') return;
    const timeout = setTimeout(() => {
      api
        .get(`/guild/members?search=${encodeURIComponent(search)}&limit=50`)
        .then(setUsers)
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timeout);
  }, [open, tab, search]);

  function handlePick(mention) {
    onInsert(`${mention} `);
  }

  const textChannels = (channels || []).filter((c) => c.type === 0 || c.type === 5);
  const filteredChannels = textChannels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredRoles = (roles || []).filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Mencionar
      </button>
      {open && (
        <div className="mention-picker">
          <div className="mode-toggle mention-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? 'active' : ''}
                onClick={() => {
                  setTab(t.id);
                  setSearch('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />

          {error && <p className="error-text">{error}</p>}

          {tab === 'channels' && (
            <div className="mention-list">
              {!channels && <p className="muted">Cargando canales...</p>}
              {channels &&
                filteredChannels.map((c) => (
                  <button key={c.id} type="button" className="mention-item" onClick={() => handlePick(`<#${c.id}>`)}>
                    #{c.name}
                  </button>
                ))}
            </div>
          )}

          {tab === 'roles' && (
            <div className="mention-list">
              {!roles && <p className="muted">Cargando roles...</p>}
              {roles &&
                filteredRoles.map((r) => (
                  <button key={r.id} type="button" className="mention-item" onClick={() => handlePick(`<@&${r.id}>`)}>
                    @{r.name}
                  </button>
                ))}
            </div>
          )}

          {tab === 'users' && (
            <div className="mention-list">
              {!users && <p className="muted">Cargando usuarios...</p>}
              {users &&
                users.map((u) => (
                  <button key={u.id} type="button" className="mention-item" onClick={() => handlePick(`<@${u.id}>`)}>
                    <img src={u.avatar} alt="" />
                    {u.displayName}
                  </button>
                ))}
            </div>
          )}

          {tab === 'placeholders' && (
            <div className="mention-list">
              {placeholders.map((p) => (
                <button key={p.value} type="button" className="mention-item" onClick={() => onInsert(p.value)}>
                  {p.value} <span className="muted">({p.label})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
