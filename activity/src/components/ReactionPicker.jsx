import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const COMMON_UNICODE = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '✅', '❌', '🔥', '🙌', '👀', '💯', '🤔'];

export default function ReactionPicker({ reactions, onChange }) {
  const [open, setOpen] = useState(false);
  const [emojis, setEmojis] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && emojis === null) {
      api
        .get('/guild/emojis')
        .then(setEmojis)
        .catch((err) => setError(err.message));
    }
  }, [open, emojis]);

  function add(identifier, display, imgUrl) {
    if (reactions.some((r) => r.identifier === identifier)) return;
    onChange([...reactions, { identifier, display, imgUrl }]);
  }

  function remove(identifier) {
    onChange(reactions.filter((r) => r.identifier !== identifier));
  }

  const filtered = (emojis || []).filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Reacciones
      </button>
      {open && (
        <div className="emoji-picker-panel">
          <p className="muted">
            Los emojis que añadas aquí se pondrán como reacción automáticamente en cuanto se envíe el mensaje.
          </p>

          {reactions.length > 0 && (
            <div className="reaction-chip-list">
              {reactions.map((r) => (
                <span key={r.identifier} className="reaction-chip">
                  {r.imgUrl ? <img src={r.imgUrl} alt="" /> : r.display}
                  <button type="button" onClick={() => remove(r.identifier)} title="Quitar">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <span className="field-title">Comunes</span>
          <div className="emoji-grid">
            {COMMON_UNICODE.map((u) => (
              <button key={u} type="button" className="emoji-item" onClick={() => add(u, u)}>
                {u}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Buscar emoji del servidor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          {emojis && (
            <div className="emoji-grid">
              {filtered.length === 0 && <p className="muted">Sin resultados.</p>}
              {filtered.map((e) => (
                <button
                  key={`${e.source}-${e.id}`}
                  type="button"
                  className="emoji-item"
                  title={`:${e.name}:`}
                  onClick={() => add(e.id, e.name, e.url)}
                >
                  <img src={e.url} alt={e.name} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
