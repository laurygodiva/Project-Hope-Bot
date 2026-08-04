import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useIdentity } from '../../context/IdentityContext.jsx';
import TicketDetail from './TicketDetail.jsx';

const CATEGORY_LABEL = { soporte: 'Soporte', reporte: 'Reporte', ck: 'CK', playmaker: 'Solicitar Playmaker' };
const STATUS_LABEL = { new: 'Nuevo', claimed: 'Reclamado', closed: 'Cerrado' };

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function MyTicketsPanel() {
  const { user } = useIdentity();
  const [tickets, setTickets] = useState(null);
  const [active, setActive] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api
      .get('/tickets/mine?onlyCreated=true')
      .then(setTickets)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="send-message-page">
      {error && <p className="error-text">{error}</p>}
      {!tickets && !error && <p className="muted">Cargando...</p>}
      {tickets?.length === 0 && <p className="muted">Todavía no tienes tickets.</p>}

      <div className="message-log-list">
        {tickets?.map((t) => (
          <div key={t.id} className="gradient-frame">
            <div className="guide-box ticket-card" role="button" tabIndex={0} onClick={() => setActive(t.id)}>
              <div className="message-log-row">
                <strong>{t.title}</strong>
                <span className="muted">{CATEGORY_LABEL[t.category]} · {STATUS_LABEL[t.status]}</span>
              </div>
              <span className="muted">
                {t.creatorId === user.id ? 'Creado por ti' : `Creado por ${t.creatorTag}`} · Últ. mensaje: {formatDate(t.lastMessageAt)}
              </span>
              {t.claimedBy && (
                <div className="ticket-card-staff">
                  <img src={t.claimedBy.avatar} alt="" />
                  {t.claimedBy.id === user.id ? 'Asignado a ti' : t.claimedBy.tag}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {active && (
        <TicketDetail
          ticketId={active}
          onClose={() => {
            setActive(null);
            load();
          }}
          onChanged={load}
        />
      )}
    </div>
  );
}
