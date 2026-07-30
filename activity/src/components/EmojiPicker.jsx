import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function EmojiPicker({ onInsert }) {
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

  const filtered = (emojis || []).filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  function handlePick(emoji) {
    const tag = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
    onInsert(tag);
  }

  return (
    <div className="emoji-picker">
      <button type="button" className="btn-secondary" onClick={() => setOpen((o) => !o)}>
        😀 Insertar emoji
      </button>

      {open && (
        <div className="emoji-dropdown">
          <input
            type="text"
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {error && <p className="error-text">{error}</p>}
          {!emojis && !error && <p className="muted">Cargando emojis...</p>}

          {emojis && (
            <div className="emoji-grid">
              {filtered.length === 0 && <p className="muted">Sin resultados.</p>}
              {filtered.map((e) => (
                <button
                  key={`${e.source}-${e.id}`}
                  type="button"
                  className="emoji-item"
                  title={`:${e.name}: (${e.source === 'bot' ? 'del bot' : 'del servidor'})`}
                  onClick={() => handlePick(e)}
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
