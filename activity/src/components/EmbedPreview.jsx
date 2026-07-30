import { useState } from 'react';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdownLite(str) {
  let s = escapeHtml(str || '');
  s = s.replace(/```([\s\S]*?)```/g, (_, code) => `<code class="md-code-block">${code}</code>`);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<u>$1</u>');
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/(?:^|\n)_(.+?)_/g, (m, p1) => (m.startsWith('\n') ? '\n' : '') + `<em>${p1}</em>`);
  s = s.replace(/^&gt; (.*)$/gm, '<span class="md-quote">$1</span>');
  s = s.replace(/\n/g, '<br/>');
  return s;
}

export default function EmbedPreview({ title, description, color, imageURL, thumbnailURL, footer, footerIconURL }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="guide-box">
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Vista previa
      </button>
      {open && (
        <div className="embed-preview" style={{ borderLeftColor: color || '#5b66ff' }}>
          {thumbnailURL && <img className="embed-preview-thumb" src={thumbnailURL} alt="" />}
          {title && <div className="embed-preview-title">{title}</div>}
          {description && (
            <div className="embed-preview-desc" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(description) }} />
          )}
          {imageURL && <img className="embed-preview-image" src={imageURL} alt="" />}
          {footer && (
            <div className="embed-preview-footer">
              {footerIconURL && <img src={footerIconURL} alt="" />}
              <span>{footer}</span>
            </div>
          )}
          {!title && !description && !imageURL && !footer && <p className="muted">Rellena el embed para ver la vista previa.</p>}
        </div>
      )}
    </div>
  );
}
