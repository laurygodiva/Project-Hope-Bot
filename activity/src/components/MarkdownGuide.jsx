import { useState } from 'react';

const EXAMPLES = [
  { syntax: '_texto_', label: 'Cursiva' },
  { syntax: '**texto**', label: 'Negrita' },
  { syntax: '***texto***', label: 'Negrita + cursiva' },
  { syntax: '__texto__', label: 'Subrayado' },
  { syntax: '~~texto~~', label: 'Tachado' },
  { syntax: '# texto', label: 'Encabezado grande' },
  { syntax: '## texto', label: 'Encabezado mediano' },
  { syntax: '### texto', label: 'Encabezado pequeño' },
  { syntax: '> texto', label: 'Cita' },
  { syntax: '- texto', label: 'Lista' },
  { syntax: '`texto`', label: 'Código en línea' },
  { syntax: '```texto```', label: 'Bloque de código' },
];

export default function MarkdownGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Guía de formato de texto
      </button>
      {open && (
        <table className="guide-table">
          <tbody>
            {EXAMPLES.map((ex) => (
              <tr key={ex.syntax}>
                <td>
                  <code>{ex.syntax}</code>
                </td>
                <td>{ex.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
