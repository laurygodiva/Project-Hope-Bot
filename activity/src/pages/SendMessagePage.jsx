import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MarkdownGuide from '../components/MarkdownGuide.jsx';
import ColorTextGenerator from '../components/ColorTextGenerator.jsx';
import FontConverter from '../components/FontConverter.jsx';
import EmojiPicker from '../components/EmojiPicker.jsx';
import SymbolPicker from '../components/SymbolPicker.jsx';
import MentionPicker from '../components/MentionPicker.jsx';
import LinkTool from '../components/LinkTool.jsx';
import MessagePreview from '../components/MessagePreview.jsx';
import { loadWebhookPresets, saveWebhookPreset } from '../utils/webhookPresets.js';

const LIMITS = { content: 2000, title: 256, description: 4096, footer: 2048 };

function CharCounter({ length, max }) {
  return <span className={`char-counter ${length > max ? 'over' : ''}`}>{length}/{max}</span>;
}

export default function SendMessagePage() {
  const [channels, setChannels] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [destination, setDestination] = useState('channel');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('bot');
  const [username, setUsername] = useState('');
  const [avatarURL, setAvatarURL] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [embedColor, setEmbedColor] = useState('#5b66ff');
  const [embedImageURL, setEmbedImageURL] = useState('');
  const [embedThumbnailURL, setEmbedThumbnailURL] = useState('');
  const [embedFooter, setEmbedFooter] = useState('');
  const [embedFooterIconURL, setEmbedFooterIconURL] = useState('');
  const [showFooterDate, setShowFooterDate] = useState(false);
  const [showFooterTime, setShowFooterTime] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [webhookPresets, setWebhookPresets] = useState(() => loadWebhookPresets());

  function handleSaveWebhookPreset() {
    if (!username) return;
    setWebhookPresets(saveWebhookPreset({ name: username, avatarURL }));
  }

  useEffect(() => {
    api
      .get('/guild/channels')
      .then((data) => {
        const textChannels = data.filter((c) => c.type === 0 || c.type === 5);
        setChannels(textChannels);
        if (textChannels[0]) setChannelId(textChannels[0].id);
      })
      .catch((err) => setFeedback({ type: 'error', text: err.message }));
  }, []);

  useEffect(() => {
    if (destination !== 'user') return;
    const timeout = setTimeout(() => {
      api
        .get(`/guild/members?search=${encodeURIComponent(userSearch)}&limit=30`)
        .then(setUserResults)
        .catch((err) => setFeedback({ type: 'error', text: err.message }));
    }, 250);
    return () => clearTimeout(timeout);
  }, [destination, userSearch]);

  function buildFooterText() {
    if (!embedFooter && !showFooterDate && !showFooterTime) return '';
    const now = new Date();
    const parts = [];
    if (showFooterDate) parts.push(now.toLocaleDateString());
    if (showFooterTime) parts.push(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const suffix = parts.join(' ');
    if (embedFooter && suffix) return `${embedFooter} • ${suffix}`;
    return embedFooter || suffix;
  }

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const payload = {
        content,
        mode: destination === 'user' ? 'bot' : mode,
        username: destination === 'channel' && mode === 'webhook' ? username : undefined,
        avatarURL: destination === 'channel' && mode === 'webhook' ? avatarURL : undefined,
        messageType,
        embed:
          messageType === 'embed'
            ? {
                title: embedTitle,
                description: embedDescription,
                color: embedColor,
                imageURL: embedImageURL,
                thumbnailURL: embedThumbnailURL,
                footer: buildFooterText(),
                footerIconURL: embedFooterIconURL,
              }
            : undefined,
      };

      if (destination === 'user') {
        await api.post(`/guild/users/${targetUser.id}/messages`, payload);
      } else {
        await api.post(`/guild/channels/${channelId}/messages`, payload);
      }

      setFeedback({ type: 'ok', text: 'Mensaje enviado.' });
      setContent('');
      setEmbedTitle('');
      setEmbedDescription('');
      setEmbedImageURL('');
      setEmbedThumbnailURL('');
      setEmbedFooter('');
      setEmbedFooterIconURL('');
      setShowFooterDate(false);
      setShowFooterTime(false);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  if (!channels) return <p>Cargando canales...</p>;

  const overLimit =
    content.length > LIMITS.content ||
    embedTitle.length > LIMITS.title ||
    embedDescription.length > LIMITS.description ||
    embedFooter.length > LIMITS.footer;
  const canSend = (destination === 'user' ? Boolean(targetUser) : Boolean(channelId)) && !overLimit;

  return (
    <div className="send-message-page">
      <div className="send-message-layout">
        <form onSubmit={handleSend} className="send-form">
          <label>
            <span className="field-title">Destino</span>
            <div className="mode-toggle">
              <button type="button" className={destination === 'channel' ? 'active' : ''} onClick={() => setDestination('channel')}>
                Canal
              </button>
              <button type="button" className={destination === 'user' ? 'active' : ''} onClick={() => setDestination('user')}>
                Usuario (MD)
              </button>
            </div>
          </label>

          {destination === 'channel' ? (
            <label>
              <span className="field-title">Canal</span>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              <span className="field-title">Usuario</span>
              {targetUser ? (
                <div className="mention-item target-user-selected">
                  <img src={targetUser.avatar} alt="" />
                  {targetUser.displayName}
                  <button type="button" className="btn-secondary" onClick={() => setTargetUser(null)}>
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar usuario..." />
                  <div className="mention-list">
                    {!userResults && <p className="muted">Cargando usuarios...</p>}
                    {userResults?.map((u) => (
                      <button key={u.id} type="button" className="mention-item" onClick={() => setTargetUser(u)}>
                        <img src={u.avatar} alt="" />
                        {u.displayName}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </label>
          )}

          {destination === 'channel' && (
            <label>
              <span className="field-title">Modo de envío</span>
              <div className="mode-toggle">
                <button type="button" className={mode === 'bot' ? 'active' : ''} onClick={() => setMode('bot')}>
                  Como el bot
                </button>
                <button type="button" className={mode === 'webhook' ? 'active' : ''} onClick={() => setMode('webhook')}>
                  Webhook
                </button>
              </div>
            </label>
          )}

          {destination === 'channel' && mode === 'webhook' && (
            <>
              {webhookPresets.length > 0 && (
                <label>
                  <span className="field-title">Webhooks guardados</span>
                  <div className="webhook-preset-list">
                    {webhookPresets.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className="webhook-preset-chip"
                        onClick={() => {
                          setUsername(p.name);
                          setAvatarURL(p.avatarURL || '');
                        }}
                      >
                        <img src={p.avatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </label>
              )}
              <label>
                <span className="field-title">Nombre</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej. Anuncios" />
              </label>
              <label>
                <span className="field-title">Avatar</span>
                <input type="text" value={avatarURL} onChange={(e) => setAvatarURL(e.target.value)} placeholder="https://..." />
              </label>
              <button type="button" className="btn-secondary" onClick={handleSaveWebhookPreset} disabled={!username}>
                Guardar
              </button>
            </>
          )}

          <label>
            <span className="field-title">Tipo de mensaje</span>
            <div className="mode-toggle">
              <button type="button" className={messageType === 'text' ? 'active' : ''} onClick={() => setMessageType('text')}>
                Texto normal
              </button>
              <button type="button" className={messageType === 'embed' ? 'active' : ''} onClick={() => setMessageType('embed')}>
                Embed
              </button>
            </div>
          </label>

          <label>
            <span className="field-title">{messageType === 'embed' ? 'Texto adicional' : 'Mensaje'}</span>
            <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} required={messageType === 'text'} />
            <CharCounter length={content.length} max={LIMITS.content} />
          </label>

          {messageType === 'embed' && (
            <div className="gradient-frame">
              <fieldset className="embed-fields">
                <label>
                  <span className="field-title">Título</span>
                  <input type="text" value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} />
                  <CharCounter length={embedTitle.length} max={LIMITS.title} />
                </label>
                <label>
                  <span className="field-title">Descripción</span>
                  <textarea rows={4} value={embedDescription} onChange={(e) => setEmbedDescription(e.target.value)} />
                  <CharCounter length={embedDescription.length} max={LIMITS.description} />
                </label>
                <label>
                  <span className="field-title">Color</span>
                  <input type="color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} />
                </label>
                <label>
                  <span className="field-title">Imagen incrustada</span>
                  <input type="text" value={embedImageURL} onChange={(e) => setEmbedImageURL(e.target.value)} placeholder="https://..." />
                </label>
                <label>
                  <span className="field-title">Miniatura</span>
                  <input
                    type="text"
                    value={embedThumbnailURL}
                    onChange={(e) => setEmbedThumbnailURL(e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  <span className="field-title">Pie de página</span>
                  <input type="text" value={embedFooter} onChange={(e) => setEmbedFooter(e.target.value)} />
                  <CharCounter length={embedFooter.length} max={LIMITS.footer} />
                </label>
                <label>
                  <span className="field-title">Icono del pie de página</span>
                  <input
                    type="text"
                    value={embedFooterIconURL}
                    onChange={(e) => setEmbedFooterIconURL(e.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <div className="color-generator-row">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={showFooterDate} onChange={(e) => setShowFooterDate(e.target.checked)} />
                    Mostrar fecha
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={showFooterTime} onChange={(e) => setShowFooterTime(e.target.checked)} />
                    Mostrar hora
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          <button type="submit" className="btn-primary btn-block" disabled={sending || !canSend}>
            {sending ? 'Enviando...' : 'Enviar mensaje'}
          </button>

          {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
        </form>

        <aside className="send-message-sidebar">
          <div className="gradient-frame">
            <MarkdownGuide />
          </div>
          <div className="gradient-frame">
            <ColorTextGenerator onInsert={(text) => setContent((prev) => (prev ? `${prev}\n${text}` : text))} />
          </div>
          <div className="gradient-frame">
            <FontConverter onInsert={(text) => setContent((prev) => `${prev}${text}`)} />
          </div>
          <div className="gradient-frame">
            <EmojiPicker onInsert={(tag) => setContent((prev) => `${prev}${tag}`)} />
          </div>
          <div className="gradient-frame">
            <SymbolPicker onInsert={(symbol) => setContent((prev) => `${prev}${symbol}`)} />
          </div>
          <div className="gradient-frame">
            <MentionPicker onInsert={(mention) => setContent((prev) => `${prev}${mention}`)} />
          </div>
          <div className="gradient-frame">
            <LinkTool onInsert={(link) => setContent((prev) => (prev ? `${prev} ${link}` : link))} />
          </div>
          {(messageType === 'embed' || (destination === 'channel' && mode === 'webhook')) && (
            <div className="gradient-frame">
              <MessagePreview
                mode={destination === 'user' ? 'bot' : mode}
                username={username}
                avatarURL={avatarURL}
                content={content}
                showEmbed={messageType === 'embed'}
                title={embedTitle}
                description={embedDescription}
                color={embedColor}
                imageURL={embedImageURL}
                thumbnailURL={embedThumbnailURL}
                footer={buildFooterText()}
                footerIconURL={embedFooterIconURL}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
