import { useEffect, useState } from 'react';
import { IdentityProvider } from './context/IdentityContext.jsx';
import { useIdentity } from './context/IdentityContext.jsx';
import { TicketNavProvider, useTicketNav } from './context/TicketNavContext.jsx';
import IdentityGate from './components/IdentityGate.jsx';
import HomePage from './pages/HomePage.jsx';
import SendMessagePage from './pages/SendMessagePage.jsx';
import SanctionsPage from './pages/SanctionsPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import UserPanelPage from './pages/UserPanelPage.jsx';
import { useTicketsUnread } from './hooks/useTicketsUnread.js';
import './App.css';

const STAFF_TABS = [
  { id: 'home', label: 'Panel', Component: HomePage },
  { id: 'send-message', label: 'Enviar mensaje', Component: SendMessagePage },
  { id: 'sanctions', label: 'Sanciones', Component: SanctionsPage },
  { id: 'tickets', label: 'Tickets', Component: TicketsPage },
];

const USER_TABS = [
  { id: 'home', label: 'Panel', Component: UserPanelPage },
  { id: 'sanctions', label: 'Sanciones', Component: SanctionsPage },
  { id: 'tickets', label: 'Tickets', Component: TicketsPage },
];

function AppShell() {
  const { viewMode, status } = useIdentity();
  const { request } = useTicketNav();
  const tabs = viewMode === 'staff' ? STAFF_TABS : USER_TABS;
  const [tab, setTab] = useState(tabs[0].id);
  const ticketsUnread = useTicketsUnread();

  useEffect(() => {
    if (status === 'ready' && !tabs.find((t) => t.id === tab)) setTab(tabs[0].id);
  }, [status, viewMode]);

  useEffect(() => {
    if (request) setTab('tickets');
  }, [request]);

  const Active = tabs.find((t) => t.id === tab)?.Component || tabs[0].Component;

  return (
    <>
      <nav className="tab-nav">
        {tabs.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'tickets' && ticketsUnread.any && <span className="nav-unread-dot" />}
          </button>
        ))}
      </nav>
      <Active />
    </>
  );
}

export default function App() {
  return (
    <IdentityProvider>
      <IdentityGate>
        <TicketNavProvider>
          <AppShell />
        </TicketNavProvider>
      </IdentityGate>
    </IdentityProvider>
  );
}
