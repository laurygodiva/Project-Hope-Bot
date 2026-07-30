import { useState } from 'react';

export default function LinkTool({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  function handleInsert() {
    if (!text || !url) return;
    onInsert(`[${text}](${url})`);
    setText('');
    setUrl('');
  }

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Incrustar enlace
      </button>
      {open && (
        <div className="color-generator">
          <p className="guide-desc">
            Solo se ve azul y clicable dentro de un <strong>Embed</strong> (título/descripción). En un mensaje normal se
            mostrará como texto plano.
          </p>
          <label>
            Texto visible
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej. Haz clic aquí" />
          </label>
          <label>
            URL
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </label>
          <div className="color-generator-actions">
            <button type="button" className="btn-primary" onClick={handleInsert} disabled={!text || !url}>
              Insertar enlace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
