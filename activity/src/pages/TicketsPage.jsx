import { useEffect, useState } from 'react';
import { useIdentity } from '../context/IdentityContext.jsx';
import { useTicketNav } from '../context/TicketNavContext.jsx';
import { useTicketsUnread } from '../hooks/useTicketsUnread.js';
import CreateTicketForm from '../components/tickets/CreateTicketForm.jsx';
import TicketBoard from '../components/tickets/TicketBoard.jsx';
import MyTicketsPanel from '../components/tickets/MyTicketsPanel.jsx';

const STAFF_TABS = [
  { id: 'create', label: 'Crear ticket' },
  { id: 'soporte', label: 'Soporte' },
  { id: 'reporte', label: 'Reporte' },
  { id: 'ck', label: 'CK' },
  { id: 'playmaker', label: 'Solicitar Playmaker' },
];

const MEMBER_TABS = [
  { id: 'create', label: 'Crear ticket' },
  { id: 'mine', label: 'Mis tickets' },
];

export default function TicketsPage() {
  const { viewMode } = useIdentity();
  const { request, clearRequest } = useTicketNav();
  const staffMode = viewMode === 'staff';
  const tabs = staffMode ? STAFF_TABS : MEMBER_TABS;
  const [subTab, setSubTab] = useState('create');
  const ticketsUnread = useTicketsUnread();

  useEffect(() => {
    if (!tabs.find((t) => t.id === subTab)) setSubTab('create');
  }, [viewMode]);

  useEffect(() => {
    if (request?.category) setSubTab(request.category);
  }, [request]);

  return (
    <div className="send-message-page">
      <nav className="mode-toggle sanctions-subnav">
        {tabs.map((t) => (
          <button key={t.id} className={subTab === t.id ? 'active' : ''} onClick={() => setSubTab(t.id)}>
            {t.label}
            {(t.id === 'mine' ? ticketsUnread.mine : ticketsUnread.byCategory[t.id]) && <span className="nav-unread-dot" />}
          </button>
        ))}
      </nav>

      {subTab === 'create' && <CreateTicketForm onCreated={() => setSubTab(staffMode ? 'soporte' : 'mine')} />}
      {subTab === 'mine' && <MyTicketsPanel />}
      {subTab === 'soporte' && (
        <TicketBoard category="soporte" initialOpenTicketId={request?.category === 'soporte' ? request.ticketId : null} onInitialOpenHandled={clearRequest} />
      )}
      {subTab === 'reporte' && (
        <TicketBoard category="reporte" initialOpenTicketId={request?.category === 'reporte' ? request.ticketId : null} onInitialOpenHandled={clearRequest} />
      )}
      {subTab === 'ck' && (
        <TicketBoard category="ck" initialOpenTicketId={request?.category === 'ck' ? request.ticketId : null} onInitialOpenHandled={clearRequest} />
      )}
      {subTab === 'playmaker' && (
        <TicketBoard
          category="playmaker"
          initialOpenTicketId={request?.category === 'playmaker' ? request.ticketId : null}
          onInitialOpenHandled={clearRequest}
        />
      )}
    </div>
  );
}
