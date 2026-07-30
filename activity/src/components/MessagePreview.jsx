import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ANSI_FG = { 30: '#4f545c', 31: '#dc322f', 32: '#859900', 33: '#b58900', 34: '#268bd2', 35: '#d33682', 36: '#2aa198', 37: '#ffffff' };
const ANSI_BG = { 40: '#1e1f22', 41: '#dc322f', 42: '#3ba55d', 43: '#e67e22', 44: '#1f3a5f', 45: '#d33682', 46: '#1abc9c', 47: '#ffffff' };

function renderAnsi(raw) {
  let html = '';
  let style = {};
  const regex = /\[([0-9;]*)m/g;
  let lastIndex = 0;
  let match;

  const styleToCss = () => {
    const css = [];
    if (style.bold) css.push('font-weight:700');
    if (style.underline) css.push('text-decoration:underline');
    if (style.fg) css.push(`color:${ANSI_FG[style.fg]}`);
    if (style.bg) css.push(`background:${ANSI_BG[style.bg]};padding:0 2px;border-radius:2px`);
    return css.join(';');
  };

  while ((match = regex.exec(raw))) {
    const chunk = raw.slice(lastIndex, match.index);
    if (chunk) html += `<span style="${styleToCss()}">${escapeHtml(chunk)}</span>`;
    const codes = match[1].split(';').filter(Boolean).map(Number);
    if (codes.length === 0 || codes.includes(0)) style = {};
    codes.forEach((c) => {
      if (c === 1) style.bold = true;
      else if (c === 4) style.underline = true;
      else if (c >= 30 && c <= 37) style.fg = c;
      else if (c >= 40 && c <= 47) style.bg = c;
    });
    lastIndex = regex.lastIndex;
  }
  const rest = raw.slice(lastIndex);
  if (rest) html += `<span style="${styleToCss()}">${escapeHtml(rest)}</span>`;
  return html || escapeHtml(raw);
}

export function extractMentionIds(text) {
  const userIds = [...text.matchAll(/<@!?(\d+)>/g)].map((m) => m[1]);
  const roleIds = [...text.matchAll(/<@&(\d+)>/g)].map((m) => m[1]);
  const channelIds = [...text.matchAll(/<#(\d+)>/g)].map((m) => m[1]);
  return { userIds, roleIds, channelIds };
}

export function renderMarkdownLite(str, mentions = { users: {}, roles: {}, channels: {} }, allowLinks = false) {
  if (!str) return '';

  const placeholders = [];
  function store(html) {
    placeholders.push(html);
    return `@@PH${placeholders.length - 1}@@`;
  }

  // Bloques de código (```lang\ncontenido``` o ```contenido```), con soporte especial para ansi
  let s = str.replace(/```(?:(\w+)\n)?([\s\S]*?)```/g, (_, lang, code) => {
    const trimmed = code.replace(/\n$/, '');
    if (lang === 'ansi') return store(`<span class="md-code-block">${renderAnsi(trimmed)}</span>`);
    return store(`<span class="md-code-block">${escapeHtml(trimmed)}</span>`);
  });

  // Código en línea
  s = s.replace(/`([^`]+)`/g, (_, code) => store(`<code>${escapeHtml(code)}</code>`));

  // Enlaces enmascarados [texto](url): Discord solo los renderiza clicables
  // dentro de Embeds (título/descripción/campos), NO en mensajes normales.
  if (allowLinks) {
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, text, url) => {
      return store(`<a class="md-link" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`);
    });
  }

  // Emojis personalizados de Discord: <:nombre:id> o <a:nombre:id>
  s = s.replace(/<(a)?:(\w+):(\d+)>/g, (_, animated, name, id) => {
    const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;
    return store(`<img class="md-emoji" src="${url}" alt=":${name}:" />`);
  });

  // Menciones: usuarios, roles y canales
  s = s.replace(/<@!?(\d+)>/g, (_, id) => store(`<span class="md-mention">@${mentions.users[id] || 'usuario'}</span>`));
  s = s.replace(/<@&(\d+)>/g, (_, id) => store(`<span class="md-mention">@${mentions.roles[id] || 'rol'}</span>`));
  s = s.replace(/<#(\d+)>/g, (_, id) => store(`<span class="md-mention">#${mentions.channels[id] || 'canal'}</span>`));

  s = escapeHtml(s);

  // Bloques de línea: encabezados, listas, citas
  s = s
    .split('\n')
    .map((line) => {
      let m;
      if ((m = line.match(/^### (.*)$/))) return `<span class="md-h3">${m[1]}</span>`;
      if ((m = line.match(/^## (.*)$/))) return `<span class="md-h2">${m[1]}</span>`;
      if ((m = line.match(/^# (.*)$/))) return `<span class="md-h1">${m[1]}</span>`;
      if ((m = line.match(/^&gt; (.*)$/))) return `<span class="md-quote">${m[1]}</span>`;
      if ((m = line.match(/^- (.*)$/))) return `<span class="md-list-item">• ${m[1]}</span>`;
      return line;
    })
    .join('\n');

  // Negrita, cursiva, subrayado, tachado
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<u>$1</u>');
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

  s = s.replace(/@@PH(\d+)@@/g, (_, i) => placeholders[Number(i)]);

  s = s.replace(/\n/g, '<br/>');

  return s;
}

function useMentionNames(...texts) {
  const [mentions, setMentions] = useState({ users: {}, roles: {}, channels: {} });

  useEffect(() => {
    const combined = texts.filter(Boolean).join('\n');
    const { userIds, roleIds, channelIds } = extractMentionIds(combined);

    const missingUsers = userIds.filter((id) => !(id in mentions.users));
    const missingRoles = roleIds.filter((id) => !(id in mentions.roles));
    const missingChannels = channelIds.filter((id) => !(id in mentions.channels));

    if (!missingUsers.length && !missingRoles.length && !missingChannels.length) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams({
        userIds: missingUsers.join(','),
        roleIds: missingRoles.join(','),
        channelIds: missingChannels.join(','),
      });
      api
        .get(`/guild/mention-names?${params.toString()}`)
        .then((data) => {
          setMentions((prev) => ({
            users: { ...prev.users, ...data.users },
            roles: { ...prev.roles, ...data.roles },
            channels: { ...prev.channels, ...data.channels },
          }));
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, texts);

  return mentions;
}

export default function MessagePreview({
  mode,
  username,
  avatarURL,
  content,
  showEmbed,
  title,
  description,
  color,
  imageURL,
  thumbnailURL,
  footer,
  footerIconURL,
}) {
  const [open, setOpen] = useState(true);
  const mentions = useMentionNames(content, title, description);

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Vista previa
      </button>
      {open && (
        <div className="message-preview-body">
          {mode === 'webhook' && (
            <div className="message-preview-author">
              <img src={avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" />
              <span>{username || 'Webhook'}</span>
            </div>
          )}

          {content && (
            <div className="message-preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(content, mentions) }} />
          )}

          {showEmbed && (
            <div className="embed-preview" style={{ borderLeftColor: color || '#5b66ff' }}>
              {thumbnailURL && <img className="embed-preview-thumb" src={thumbnailURL} alt="" />}
              {title && (
                <div className="embed-preview-title" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(title, mentions, true) }} />
              )}
              {description && (
                <div
                  className="embed-preview-desc"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownLite(description, mentions, true) }}
                />
              )}
              {imageURL && <img className="embed-preview-image" src={imageURL} alt="" />}
              {footer && (
                <div className="embed-preview-footer">
                  {footerIconURL && <img src={footerIconURL} alt="" />}
                  <span>{footer}</span>
                </div>
              )}
            </div>
          )}

          {!content && !showEmbed && <p className="muted">Escribe el mensaje para ver la vista previa.</p>}
        </div>
      )}
    </div>
  );
}
