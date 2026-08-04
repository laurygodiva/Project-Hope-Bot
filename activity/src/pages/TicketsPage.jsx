import { useState } from 'react';
import { useIdentity } from '../context/IdentityContext.jsx';
import CreateTicketForm from '../components/tickets/CreateTicketForm.jsx';
import TicketBoard from '../components/tickets/TicketBoard.jsx';
import MyTicketsPanel from '../components/tickets/MyTicketsPanel.jsx';

const STAFF_TABS = [
  { id: 'create', label: 'Crear ticket' },
  { id: 'soporte', label: 'Soporte' },
  { id: 'reporte', label: 'Reporte' },
  { id: 'ck', label: 'CK' },
];

const MEMBER_TABS = [
  { id: 'create', label: 'Crear ticket' },
  { id: 'mine', label: 'Mis tickets' },
];

export default function TicketsPage() {
  const { isAdmin } = useIdentity();
  const tabs = isAdmin ? STAFF_TABS : MEMBER_TABS;
  const [subTab, setSubTab] = useState('create');

  return (
    <div className="send-message-page">
      <nav className="mode-toggle sanctions-subnav">
        {tabs.map((t) => (
          <button key={t.id} className={subTab === t.id ? 'active' : ''} onClick={() => setSubTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'create' && <CreateTicketForm onCreated={() => setSubTab(isAdmin ? 'soporte' : 'mine')} />}
      {subTab === 'mine' && <MyTicketsPanel />}
      {subTab === 'soporte' && <TicketBoard category="soporte" />}
      {subTab === 'reporte' && <TicketBoard category="reporte" />}
      {subTab === 'ck' && <TicketBoard category="ck" />}
    </div>
  );
}
