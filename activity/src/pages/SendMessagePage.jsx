import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MarkdownGuide from '../components/MarkdownGuide.jsx';
import ColorTextGenerator from '../components/ColorTextGenerator.jsx';
import EmojiPicker from '../components/EmojiPicker.jsx';
import SymbolPicker from '../components/SymbolPicker.jsx';

export default function SendMessagePage() {
  const [channels, setChannels] = useState(null);
  const [channelId, setChannelId] = useState('');
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
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

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

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      await api.post(`/guild/channels/${channelId}/messages`, {
        content,
        mode,
        username: mode === 'webhook' ? username : undefined,
        avatarURL: mode === 'webhook' ? avatarURL : undefined,
        messageType,
        embed:
          messageType === 'embed'
            ? {
                title: embedTitle,
                description: embedDescription,
                color: embedColor,
                imageURL: embedImageURL,
                thumbnailURL: embedThumbnailURL,
                footer: embedFooter,
                footerIconURL: embedFooterIconURL,
              }
            : undefined,
      });
      setFeedback({ type: 'ok', text: 'Mensaje enviado.' });
      setContent('');
      setEmbedTitle('');
      setEmbedDescription('');
      setEmbedImageURL('');
      setEmbedThumbnailURL('');
      setEmbedFooter('');
      setEmbedFooterIconURL('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  if (!channels) return <p>Cargando canales...</p>;

  return (
    <div className="send-message-page">
      <div className="send-message-layout">
      <form onSubmit={handleSend} className="send-form">
        <label>
          Canal
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Modo de envío
          <div className="mode-toggle">
            <button type="button" className={mode === 'bot' ? 'active' : ''} onClick={() => setMode('bot')}>
              Como el bot
            </button>
            <button type="button" className={mode === 'webhook' ? 'active' : ''} onClick={() => setMode('webhook')}>
              Webhook
            </button>
          </div>
        </label>

        {mode === 'webhook' && (
          <>
            <label>
              Nombre a mostrar (opcional)
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej. Anuncios" />
            </label>
            <label>
              URL de avatar (opcional)
              <input type="text" value={avatarURL} onChange={(e) => setAvatarURL(e.target.value)} placeholder="https://..." />
            </label>
          </>
        )}

        <label>
          Tipo de mensaje
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
          {messageType === 'embed' ? 'Texto adicional (opcional, va antes del embed)' : 'Mensaje'}
          <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} required={messageType === 'text'} />
        </label>

        {messageType === 'embed' && (
          <fieldset className="embed-fields">
            <legend>Contenido del embed</legend>
            <label>
              Título
              <input type="text" value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} />
            </label>
            <label>
              Descripción
              <textarea rows={4} value={embedDescription} onChange={(e) => setEmbedDescription(e.target.value)} />
            </label>
            <label>
              Color
              <input type="color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} />
            </label>
            <label>
              Imagen (URL, grande, debajo del texto)
              <input type="text" value={embedImageURL} onChange={(e) => setEmbedImageURL(e.target.value)} placeholder="https://..." />
            </label>
            <label>
              Miniatura (URL, pequeña, arriba a la derecha)
              <input
                type="text"
                value={embedThumbnailURL}
                onChange={(e) => setEmbedThumbnailURL(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <label>
              Pie de página (opcional)
              <input type="text" value={embedFooter} onChange={(e) => setEmbedFooter(e.target.value)} />
            </label>
            <label>
              Icono del pie de página (URL, opcional)
              <input
                type="text"
                value={embedFooterIconURL}
                onChange={(e) => setEmbedFooterIconURL(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </fieldset>
        )}

        <button type="submit" className="btn-primary btn-block" disabled={sending || !channelId}>
          {sending ? 'Enviando...' : 'Enviar mensaje'}
        </button>

        {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
      </form>

      <aside className="send-message-sidebar">
        <MarkdownGuide />
        <ColorTextGenerator onInsert={(text) => setContent((prev) => (prev ? `${prev}\n${text}` : text))} />
        <EmojiPicker onInsert={(tag) => setContent((prev) => `${prev}${tag}`)} />
        <SymbolPicker onInsert={(symbol) => setContent((prev) => `${prev}${symbol}`)} />
      </aside>
      </div>
    </div>
  );
}
