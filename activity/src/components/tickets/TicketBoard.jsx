import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import TicketDetail from './TicketDetail.jsx';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function TicketCard({ ticket, onOpen, children }) {
  return (
    <div className="gradient-frame">
      <div className="guide-box ticket-card" role="button" tabIndex={0} onClick={() => onOpen(ticket.id)}>
        <strong>{ticket.title}</strong>
        <span className="muted">{ticket.creatorTag}</span>
        <span className="muted">Últ. mensaje: {formatDate(ticket.lastMessageAt)}</span>
        {ticket.claimedBy && (
          <div className="ticket-card-staff">
            <img src={ticket.claimedBy.avatar} alt="" />
            {ticket.claimedBy.tag}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default function TicketBoard({ category }) {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [openTickets, setOpenTickets] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    const params = new URLSearchParams({ category });
    if (search) params.set('search', search);

    api
      .get(`/tickets?${params.toString()}`)
      .then(setOpenTickets)
      .catch((err) => setError(err.message));

    api
      .get(`/tickets/history?${params.toString()}`)
      .then(setHistory)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [category, search]);

  const nuevos = (openTickets || []).filter((t) => t.status === 'new');
  const reclamados = (openTickets || []).filter((t) => t.status === 'claimed');

  return (
    <div className="send-message-page">
      <div className="gradient-frame">
        <div className="guide-box message-log-filters">
          <label>
            <span className="field-title">Buscar por ID o usuario</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID de ticket o nombre de usuario..." />
          </label>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="ticket-board">
        <div className="ticket-column">
          <h4>Nuevos</h4>
          {nuevos.length === 0 && <p className="muted">No hay tickets nuevos.</p>}
          {nuevos.map((t) => (
            <TicketCard key={t.id} ticket={t} onOpen={setActive} />
          ))}
        </div>

        <div className="ticket-column">
          <h4>Reclamados</h4>
          {reclamados.length === 0 && <p className="muted">No hay tickets reclamados.</p>}
          {reclamados.map((t) => (
            <TicketCard key={t.id} ticket={t} onOpen={setActive} />
          ))}
        </div>

        <div className="ticket-column">
          <h4>Historial</h4>
          {history?.length === 0 && <p className="muted">Sin tickets cerrados.</p>}
          {history?.map((t) => (
            <TicketCard key={t.id} ticket={t} onOpen={setActive} />
          ))}
        </div>
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
