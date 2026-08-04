import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client.js';
import { useIdentity } from '../../context/IdentityContext.jsx';

const CATEGORY_LABEL = { soporte: 'Soporte', reporte: 'Reporte', ck: 'CK' };

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function TicketDetail({ ticketId, onClose, onChanged }) {
  const { user, isAdmin } = useIdentity();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const bottomRef = useRef(null);

  function load() {
    api
      .get(`/tickets/${ticketId}`)
      .then(setTicket)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    api.post(`/tickets/${ticketId}/read`, {}).catch(() => {});
    const interval = setInterval(() => {
      load();
      api.post(`/tickets/${ticketId}/read`, {}).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [ticket?.messages?.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append('content', content);
      images.forEach((f) => form.append('images', f));
      const updated = await api.postForm(`/tickets/${ticketId}/messages`, form);
      setTicket(updated);
      setContent('');
      setImages([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function runAction(action) {
    setActionBusy(true);
    try {
      const updated = await api.post(`/tickets/${ticketId}/${action}`, {});
      setTicket(updated);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleTranscript() {
    setActionBusy(true);
    try {
      await api.post(`/tickets/${ticketId}/transcript`, {});
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionBusy(false);
    }
  }

  async function toggleNotifications(enabled) {
    try {
      const updated = await api.post(`/tickets/${ticketId}/notifications`, { enabled });
      setTicket(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !ticket) {
    return (
      <div className="ticket-modal-overlay" onClick={onClose}>
        <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
          <p className="error-text">{error}</p>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const notificationsEnabled = (ticket.notifyOptIn || []).includes(user.id);
  const canModerate = isAdmin;
  const isClosed = ticket.status === 'closed';

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-modal-header">
          <div>
            <h3>{ticket.title}</h3>
            <span className="muted">
              {CATEGORY_LABEL[ticket.category]} · Creado por {ticket.creatorTag} · {formatDate(ticket.createdAt)}
            </span>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ticket-modal-toolbar">
          <label className="checkbox-label">
            <input type="checkbox" checked={notificationsEnabled} onChange={(e) => toggleNotifications(e.target.checked)} />
            Notificarme por MD cuando escriban aquí
          </label>

          {canModerate && (
            <div className="ticket-modal-actions">
              {ticket.status === 'new' && (
                <button type="button" className="btn-secondary" disabled={actionBusy} onClick={() => runAction('claim')}>
                  Asignarme
                </button>
              )}
              {ticket.status === 'claimed' && (
                <>
                  <button type="button" className="btn-secondary" disabled={actionBusy} onClick={() => runAction('unclaim')}>
                    Designar (volver a Nuevos)
                  </button>
                  <button type="button" className="btn-secondary" disabled={actionBusy} onClick={() => runAction('close')}>
                    Cerrar ticket
                  </button>
                </>
              )}
              {isClosed && (
                <button type="button" className="btn-secondary" disabled={actionBusy} onClick={handleTranscript}>
                  Descargar conversación (MD)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="ticket-modal-body">
          <div className="gradient-frame">
            <div className="guide-box message-log-card">
              <p className="message-log-content">{ticket.description}</p>
              {ticket.links?.length > 0 && (
                <div className="ticket-links">
                  {ticket.links.map((l) => (
                    <a key={l} href={l} target="_blank" rel="noreferrer">
                      {l}
                    </a>
                  ))}
                </div>
              )}
              {ticket.images?.length > 0 && (
                <div className="ticket-images">
                  {ticket.images.map((src) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt="" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ticket-chat">
            {ticket.messages.map((m) => (
              <div key={m.id} className={`ticket-chat-message ${m.authorId === user.id ? 'own' : ''}`}>
                <img src={m.authorAvatar} alt="" />
                <div>
                  <div className="ticket-chat-meta">
                    <strong>{m.authorTag}</strong>
                    <span className="muted">{formatDate(m.createdAt)}</span>
                  </div>
                  {m.content && <p>{m.content}</p>}
                  {m.images?.length > 0 && (
                    <div className="ticket-images">
                      {m.images.map((src) => (
                        <a key={src} href={src} target="_blank" rel="noreferrer">
                          <img src={src} alt="" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        {!isClosed ? (
          <form onSubmit={handleSend} className="ticket-chat-form">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe un mensaje..."
            />
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))} />
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        ) : (
          <p className="muted">Este ticket está cerrado.</p>
        )}
      </div>
    </div>
  );
}
