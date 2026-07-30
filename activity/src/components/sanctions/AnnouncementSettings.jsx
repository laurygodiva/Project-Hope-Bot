import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import MarkdownGuide from '../MarkdownGuide.jsx';
import ColorTextGenerator from '../ColorTextGenerator.jsx';
import EmojiPicker from '../EmojiPicker.jsx';
import MentionPicker from '../MentionPicker.jsx';
import LinkTool from '../LinkTool.jsx';
import MessagePreview from '../MessagePreview.jsx';
import { useIdentity } from '../../context/IdentityContext.jsx';

const LIMITS = { title: 256, description: 4096, footer: 2048 };
const PLACEHOLDERS = [
  { label: 'mención al usuario sancionado', value: '{usuario}' },
  { label: 'tipos de sanción aplicados', value: '{sanciones}' },
  { label: 'duración o "Permanente"', value: '{duracion}' },
  { label: 'fecha/hora en que termina la sanción', value: '{fin}' },
];

function CharCounter({ length, max }) {
  return (
    <span className={`char-counter ${length > max ? 'over' : ''}`}>
      {length}/{max}
    </span>
  );
}

function emptyEmbed() {
  return {
    title: '',
    description: '',
    color: '#5b66ff',
    imageURL: '',
    thumbnailURL: '',
    footer: '',
    footerIconURL: '',
    footerShowDate: false,
    footerShowTime: false,
  };
}

function buildFooterPreview(embed) {
  if (!embed.footer && !embed.footerShowDate && !embed.footerShowTime) return '';
  const now = new Date();
  const parts = [];
  if (embed.footerShowDate) parts.push(now.toLocaleDateString());
  if (embed.footerShowTime) parts.push(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const suffix = parts.join(' ');
  if (embed.footer && suffix) return `${embed.footer} • ${suffix}`;
  return embed.footer || suffix;
}

export default function AnnouncementSettings() {
  const { isSanctionsManager } = useIdentity();
  const [embed, setEmbed] = useState(emptyEmbed());
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/sanctions/settings')
      .then((data) => setEmbed({ ...emptyEmbed(), ...data.embed }))
      .catch((err) => setError(err.message));
  }, []);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await api.put('/sanctions/settings', { embed });
      setEmbed({ ...emptyEmbed(), ...saved.embed });
      setFeedback({ type: 'ok', text: 'Plantilla de anuncio guardada.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const overLimit =
    embed.title.length > LIMITS.title || embed.description.length > LIMITS.description || embed.footer.length > LIMITS.footer;

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="send-message-page">
      <div className="send-message-layout">
        <div className="send-form">
          <p className="muted">
            Este embed se envía por MD al usuario cuando se le aplica una sanción. Usa la herramienta "Mencionar" → pestaña
            "Variables" para insertar {'{usuario}'}, {'{sanciones}'} y {'{duracion}'}.
          </p>

          {!isSanctionsManager && (
            <p className="muted">Solo el staff con el rol autorizado puede editar y guardar esta plantilla.</p>
          )}

          <div className="gradient-frame">
            <fieldset className="embed-fields" disabled={!isSanctionsManager}>
              <label>
                <span className="field-title">Título</span>
                <input type="text" value={embed.title} onChange={(e) => setEmbed({ ...embed, title: e.target.value })} />
                <CharCounter length={embed.title.length} max={LIMITS.title} />
              </label>
              <label>
                <span className="field-title">Descripción</span>
                <textarea
                  rows={6}
                  value={embed.description}
                  onChange={(e) => setEmbed({ ...embed, description: e.target.value })}
                />
                <CharCounter length={embed.description.length} max={LIMITS.description} />
              </label>
              <label>
                <span className="field-title">Color</span>
                <input type="color" value={embed.color} onChange={(e) => setEmbed({ ...embed, color: e.target.value })} />
              </label>
              <label>
                <span className="field-title">Imagen incrustada</span>
                <input
                  type="text"
                  value={embed.imageURL}
                  onChange={(e) => setEmbed({ ...embed, imageURL: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                <span className="field-title">Miniatura</span>
                <input
                  type="text"
                  value={embed.thumbnailURL}
                  onChange={(e) => setEmbed({ ...embed, thumbnailURL: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                <span className="field-title">Pie de página</span>
                <input type="text" value={embed.footer} onChange={(e) => setEmbed({ ...embed, footer: e.target.value })} />
                <CharCounter length={embed.footer.length} max={LIMITS.footer} />
              </label>
              <label>
                <span className="field-title">Icono del pie de página</span>
                <input
                  type="text"
                  value={embed.footerIconURL}
                  onChange={(e) => setEmbed({ ...embed, footerIconURL: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <div className="color-generator-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={embed.footerShowDate}
                    onChange={(e) => setEmbed({ ...embed, footerShowDate: e.target.checked })}
                  />
                  Mostrar fecha
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={embed.footerShowTime}
                    onChange={(e) => setEmbed({ ...embed, footerShowTime: e.target.checked })}
                  />
                  Mostrar hora
                </label>
              </div>
            </fieldset>
          </div>

          {isSanctionsManager && (
            <button type="button" className="btn-primary btn-block" onClick={handleSave} disabled={saving || overLimit}>
              {saving ? 'Guardando...' : 'Guardar plantilla'}
            </button>
          )}

          {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
        </div>

        <aside className="send-message-sidebar">
          {isSanctionsManager && (
            <>
              <div className="gradient-frame">
                <MarkdownGuide />
              </div>
              <div className="gradient-frame">
                <ColorTextGenerator onInsert={(text) => setEmbed((prev) => ({ ...prev, description: prev.description ? `${prev.description}\n${text}` : text }))} />
              </div>
              <div className="gradient-frame">
                <EmojiPicker onInsert={(tag) => setEmbed((prev) => ({ ...prev, description: `${prev.description}${tag}` }))} />
              </div>
              <div className="gradient-frame">
                <MentionPicker
                  placeholders={PLACEHOLDERS}
                  onInsert={(mention) => setEmbed((prev) => ({ ...prev, description: `${prev.description}${mention}` }))}
                />
              </div>
              <div className="gradient-frame">
                <LinkTool
                  onInsert={(link) =>
                    setEmbed((prev) => ({ ...prev, description: prev.description ? `${prev.description} ${link}` : link }))
                  }
                />
              </div>
            </>
          )}
          <div className="gradient-frame">
            <MessagePreview
              mode="bot"
              content=""
              showEmbed
              title={embed.title}
              description={embed.description}
              color={embed.color}
              imageURL={embed.imageURL}
              thumbnailURL={embed.thumbnailURL}
              footer={buildFooterPreview(embed)}
              footerIconURL={embed.footerIconURL}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
