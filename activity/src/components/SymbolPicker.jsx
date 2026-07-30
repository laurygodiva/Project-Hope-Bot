import { useState } from 'react';

const RAW = `
✘ ✔ ☑ ☒ ☐ ✖ ✕ ✓ ❮ ❯ " " ⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉
⏾ ✦︎ ✶ ⋆ ⟡ ★ ⚡︎ ❤︎ ♡ ✧ • ◦ ‒ ― — ∥ ∣
│ ┆ ⋮ ⌇ 「 」 ╔ ═ ╗ ╚ ═ ╝ ╡ ╞ 「 」【 】﹁ ﹂ ﹃ ﹄ ￪ ￬ ╬
⤷ ↵ ↳ ↲ ← ︽ ︾ ︿ ﹀ 《 》 « » ↺ ⬇ ↓ ⤸ ⤹ ⤶ ⤷ ➡ ⬅ ↪ ↩ ➤ ➥ ➦ ➜
─ — ┕ ┓ └ ┐ ┖ ┒ ├ ┝ ┠ ┣ ┫ ┥ ┤ ┰ ┯ ┴ ┻ ┼ ╋ ╓ ╖ ╤ ╙ ╜
`;

const SYMBOLS = [...new Set(RAW.split(/\s+/).filter(Boolean))];

export default function SymbolPicker({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search ? SYMBOLS.filter((s) => s.includes(search)) : SYMBOLS;

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Símbolos
      </button>
      {open && (
        <div className="emoji-picker-panel">
          <input type="text" placeholder="Filtrar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="symbol-grid">
            {filtered.map((s, i) => (
              <button key={`${s}-${i}`} type="button" className="symbol-item" onClick={() => onInsert(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
