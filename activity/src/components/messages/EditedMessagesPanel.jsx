import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import MessageLogFilters from './MessageLogFilters.jsx';

function formatDate(iso) {
  if (!iso) return 'Desconocido';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function EditedMessagesPanel() {
  const [filters, setFilters] = useState({ messageId: '', channelId: '', userId: '', userLabel: '' });
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.messageId) params.set('messageId', filters.messageId);
    if (filters.channelId) params.set('channelId', filters.channelId);
    if (filters.userId) params.set('userId', filters.userId);

    api
      .get(`/guild/message-logs/edited?${params.toString()}`)
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, [filters.messageId, filters.channelId, filters.userId]);

  return (
    <div className="send-message-page">
      <MessageLogFilters filters={filters} onChange={setFilters} />

      {error && <p className="error-text">{error}</p>}
      {!entries && !error && <p className="muted">Cargando...</p>}
      {entries && entries.length === 0 && <p className="muted">No hay mensajes editados registrados.</p>}

      <div className="message-log-list">
        {entries?.map((e) => (
          <div key={`${e.messageId}-${e.editedAt}`} className="gradient-frame">
            <div className="guide-box message-log-card">
              <div className="message-log-row">
                <div className="message-log-author">
                  {e.authorAvatar && <img src={e.authorAvatar} alt="" />}
                  <div>
                    <strong>{e.authorTag || 'Desconocido'}</strong>
                    <span className="muted"> en #{e.channelName || e.channelId}</span>
                  </div>
                </div>
                <span className="muted">Enviado: {formatDate(e.sentAt)}</span>
              </div>

              <span className="field-title">Original</span>
              <p className="message-log-content message-log-original">
                {e.originalContent || <span className="muted">(sin contenido de texto)</span>}
              </p>

              <span className="field-title">Editado</span>
              <p className="message-log-content">
                {e.editedContent || <span className="muted">(sin contenido de texto)</span>}
              </p>

              <div className="message-log-row message-log-footer">
                <span className="muted">Editado: {formatDate(e.editedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
