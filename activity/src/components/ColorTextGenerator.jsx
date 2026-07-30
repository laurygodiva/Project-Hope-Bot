import { useState } from 'react';

const FG_COLORS = [
  { code: null, name: 'Por defecto', hex: '#dcddde' },
  { code: 30, name: 'Gris', hex: '#4f545c' },
  { code: 31, name: 'Rojo', hex: '#dc322f' },
  { code: 32, name: 'Verde', hex: '#859900' },
  { code: 33, name: 'Amarillo', hex: '#b58900' },
  { code: 34, name: 'Azul', hex: '#268bd2' },
  { code: 35, name: 'Rosa', hex: '#d33682' },
  { code: 36, name: 'Cian', hex: '#2aa198' },
  { code: 37, name: 'Blanco', hex: '#ffffff' },
];

// Verificados a mano por el usuario probando en Discord real (2026-07-30):
// Discord renderiza los fondos con la paleta ANSI estándar de terminal,
// NO con la paleta "solarized" que usa para el texto (FG).
const BG_COLORS = [
  { code: null, name: 'Ninguno', hex: 'transparent' },
  { code: 40, name: 'Negro', hex: '#1e1f22' },
  { code: 41, name: 'Rojo', hex: '#dc322f' },
  { code: 42, name: 'Verde', hex: '#3ba55d' },
  { code: 43, name: 'Naranja', hex: '#e67e22' },
  { code: 44, name: 'Azul oscuro', hex: '#1f3a5f' },
  { code: 45, name: 'Rosa', hex: '#d33682' },
  { code: 46, name: 'Turquesa', hex: '#1abc9c' },
  { code: 47, name: 'Blanco', hex: '#ffffff' },
];

function buildAnsiBlock({ text, bold, underline, fg, bg }) {
  const codes = [];
  if (bold) codes.push('1');
  if (underline) codes.push('4');
  if (fg) codes.push(String(fg));
  if (bg) codes.push(String(bg));

  const wrapped = codes.length ? `[${codes.join(';')}m${text}[0m` : text;
  return '```ansi\n' + wrapped + '\n```';
}

export default function ColorTextGenerator({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('Texto de ejemplo');
  const [bold, setBold] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [fg, setFg] = useState(null);
  const [bg, setBg] = useState(null);

  const output = buildAnsiBlock({ text, bold, underline, fg, bg });
  const fgColor = FG_COLORS.find((c) => c.code === fg);
  const bgColor = BG_COLORS.find((c) => c.code === bg);

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Generador de texto con color
      </button>
      {open && (
        <div className="color-generator">
          <label>
            Texto
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
          </label>

          <div className="color-generator-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} />
              Negrita
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={underline} onChange={(e) => setUnderline(e.target.checked)} />
              Subrayado
            </label>
          </div>

          <div className="color-generator-row">
            <label>
              Color de texto (FG)
              <select value={fg ?? ''} onChange={(e) => setFg(e.target.value ? Number(e.target.value) : null)}>
                {FG_COLORS.map((c) => (
                  <option key={c.name} value={c.code ?? ''}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Color de fondo (BG)
              <select value={bg ?? ''} onChange={(e) => setBg(e.target.value ? Number(e.target.value) : null)}>
                {BG_COLORS.map((c) => (
                  <option key={c.name} value={c.code ?? ''}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            className="color-preview"
            style={{
              color: fgColor.hex,
              backgroundColor: bgColor.hex,
              fontWeight: bold ? 'bold' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
            }}
          >
            {text || 'Vista previa'}
          </div>

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
