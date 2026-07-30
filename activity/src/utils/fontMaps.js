// Conversores a variantes Unicode de "fuentes" (Mathematical Alphanumeric Symbols
// y tablas de versalitas/superíndice). Los acentos (ñ/Ñ) no existen en estos
// bloques, así que se componen como letra base + tilde combinada (U+0303),
// igual que se ve en los generadores de texto habituales.

function offsetMapper({ upperA, lowerA, digit0 }) {
  return function map(ch) {
    const code = ch.codePointAt(0);
    if (ch >= 'A' && ch <= 'Z') return String.fromCodePoint(upperA + (code - 65));
    if (ch >= 'a' && ch <= 'z') return String.fromCodePoint(lowerA + (code - 97));
    if (digit0 != null && ch >= '0' && ch <= '9') return String.fromCodePoint(digit0 + (code - 48));
    return ch;
  };
}

const italicBase = offsetMapper({ upperA: 0x1d434, lowerA: 0x1d44e, digit0: null });
function italicMap(ch) {
  if (ch === 'h') return 'ℎ';
  return italicBase(ch);
}

const SMALL_CAPS = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
  k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ',
  u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};
function smallCapsMap(ch) {
  const lower = ch.toLowerCase();
  if (SMALL_CAPS[lower]) return SMALL_CAPS[lower];
  return ch;
}

const SUPERSCRIPT = {
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ',
  k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', q: 'q', r: 'ʳ', s: 'ˢ', t: 'ᵗ',
  u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  A: 'ᴬ', B: 'ᴮ', C: 'ᶜ', D: 'ᴰ', E: 'ᴱ', F: 'ᶠ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ',
  K: 'ᴷ', L: 'ᴸ', M: 'ᴹ', N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', Q: 'ᵠ', R: 'ᴿ', S: 'ˢ', T: 'ᵀ',
  U: 'ᵁ', V: 'ⱽ', W: 'ᵂ', X: 'ˣ', Y: 'ʸ', Z: 'ᶻ',
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
};
function superscriptMap(ch) {
  return SUPERSCRIPT[ch] || ch;
}

function buildConverter(mapChar) {
  return function convert(text) {
    let out = '';
    for (const ch of text) {
      if (ch === 'ñ') out += mapChar('n') + '̃';
      else if (ch === 'Ñ') out += mapChar('N') + '̃';
      else out += mapChar(ch);
    }
    return out;
  };
}

export const FONT_STYLES = [
  { id: 'bold', label: 'Negrita', convert: buildConverter(offsetMapper({ upperA: 0x1d400, lowerA: 0x1d41a, digit0: 0x1d7ce })) },
  { id: 'italic', label: 'Cursiva', convert: buildConverter(italicMap) },
  { id: 'boldItalic', label: 'Negrita cursiva', convert: buildConverter(offsetMapper({ upperA: 0x1d468, lowerA: 0x1d482, digit0: null })) },
  { id: 'sans', label: 'Sans', convert: buildConverter(offsetMapper({ upperA: 0x1d5a0, lowerA: 0x1d5ba, digit0: 0x1d7e2 })) },
  { id: 'sansBold', label: 'Sans negrita', convert: buildConverter(offsetMapper({ upperA: 0x1d5d4, lowerA: 0x1d5ee, digit0: 0x1d7ec })) },
  { id: 'sansItalic', label: 'Sans cursiva', convert: buildConverter(offsetMapper({ upperA: 0x1d608, lowerA: 0x1d622, digit0: null })) },
  {
    id: 'sansBoldItalic',
    label: 'Sans negrita cursiva',
    convert: buildConverter(offsetMapper({ upperA: 0x1d63c, lowerA: 0x1d656, digit0: null })),
  },
  { id: 'monospace', label: 'Monoespaciada', convert: buildConverter(offsetMapper({ upperA: 0x1d670, lowerA: 0x1d68a, digit0: 0x1d7f6 })) },
  { id: 'smallCaps', label: 'Versalitas', convert: buildConverter(smallCapsMap) },
  { id: 'superscript', label: 'Superíndice', convert: buildConverter(superscriptMap) },
];
