import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function SendMessagePage() {
  const [channels, setChannels] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('bot');
  const [username, setUsername] = useState('');
  const [avatarURL, setAvatarURL] = useState('');
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
      });
      setFeedback({ type: 'ok', text: 'Mensaje enviado.' });
      setContent('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  }

  if (!channels) return <p>Cargando canales...</p>;

  return (
    <div className="send-message-page">
      <h1>Enviar mensaje</h1>

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
              Como webhook (nombre/avatar propio)
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
          Mensaje
          <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} required />
        </label>

        <button type="submit" className="btn-primary" disabled={sending || !channelId}>
          {sending ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>

      {feedback && <p className={feedback.type === 'error' ? 'error-text' : 'ok-text'}>{feedback.text}</p>}
    </div>
  );
}
