import { useState } from 'react';
import { FONT_STYLES } from '../utils/fontMaps.js';

export default function FontConverter({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('Texto de ejemplo');
  const [styleId, setStyleId] = useState(FONT_STYLES[0].id);

  const style = FONT_STYLES.find((s) => s.id === styleId);
  const output = style.convert(text);

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Conversor de fuentes
      </button>
      {open && (
        <div className="color-generator">
          <label>
            Texto
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
          </label>

          <label>
            Fuente
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)}>
              {FONT_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="color-preview">{output || 'Vista previa'}</div>

          <div className="color-generator-actions">
            <button type="button" className="btn-primary" onClick={() => onInsert(output)}>
              Insertar en mensaje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
