import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function StickerPicker({ selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [stickers, setStickers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && stickers === null) {
      api
        .get('/guild/stickers')
        .then(setStickers)
        .catch((err) => setError(err.message));
    }
  }, [open, stickers]);

  const selected = stickers?.find((s) => s.id === selectedId);

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Stickers
      </button>
      {open && (
        <div className="sticker-picker">
          <p className="guide-note">Solo disponible en modo "Como el bot" (los webhooks no pueden enviar stickers).</p>

          {error && <p className="error-text">{error}</p>}
          {!stickers && !error && <p className="muted">Cargando stickers...</p>}

          {selected && (
            <div className="sticker-selected">
              <img src={selected.url} alt={selected.name} />
              <span>{selected.name}</span>
              <button type="button" className="btn-secondary" onClick={() => onSelect(null)}>
                Quitar
              </button>
            </div>
          )}

          {stickers && (
            <div className="emoji-grid sticker-grid">
              {stickers.length === 0 && <p className="muted">Este servidor no tiene stickers.</p>}
              {stickers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`emoji-item ${selectedId === s.id ? 'selected' : ''}`}
                  title={s.name}
                  onClick={() => onSelect(selectedId === s.id ? null : s.id)}
                >
                  <img src={s.url} alt={s.name} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
