import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function MessageLogFilters({ filters, onChange }) {
  const [channels, setChannels] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState(null);
  const [showUserResults, setShowUserResults] = useState(false);

  useEffect(() => {
    api.get('/guild/channels').then((data) => setChannels(data.filter((c) => c.type === 0 || c.type === 5)));
  }, []);

  useEffect(() => {
    if (!showUserResults) return;
    const timeout = setTimeout(() => {
      api
        .get(`/guild/members?search=${encodeURIComponent(userSearch)}&limit=15`)
        .then(setUserResults)
        .catch(() => setUserResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [userSearch, showUserResults]);

  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="gradient-frame">
      <div className="guide-box message-log-filters">
        <label>
          <span className="field-title">Buscar por ID de mensaje</span>
          <input
            type="text"
            value={filters.messageId}
            onChange={(e) => set('messageId', e.target.value)}
            placeholder="ID del mensaje..."
          />
        </label>

        <label>
          <span className="field-title">Filtrar por canal</span>
          <select value={filters.channelId} onChange={(e) => set('channelId', e.target.value)}>
            <option value="">Todos los canales</option>
            {channels?.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="field-title">Filtrar por usuario</span>
          {filters.userLabel ? (
            <div className="mention-item target-user-selected">
              {filters.userLabel}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  set('userId', '');
                  set('userLabel', '');
                }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onFocus={() => setShowUserResults(true)}
                placeholder="Buscar usuario..."
              />
              {showUserResults && (
                <div className="mention-list">
                  {!userResults && <p className="muted">Buscando...</p>}
                  {userResults?.length === 0 && <p className="muted">Sin resultados.</p>}
                  {userResults?.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="mention-item"
                      onClick={() => {
                        set('userId', u.id);
                        set('userLabel', u.displayName);
                        setShowUserResults(false);
                        setUserSearch('');
                      }}
                    >
                      <img src={u.avatar} alt="" />
                      {u.displayName}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </label>

        {(filters.messageId || filters.channelId || filters.userId) && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onChange({ messageId: '', channelId: '', userId: '', userLabel: '' })}
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
