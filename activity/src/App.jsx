import { useEffect, useState } from 'react';
import { IdentityProvider } from './context/IdentityContext.jsx';
import { useIdentity } from './context/IdentityContext.jsx';
import IdentityGate from './components/IdentityGate.jsx';
import HomePage from './pages/HomePage.jsx';
import SendMessagePage from './pages/SendMessagePage.jsx';
import SanctionsPage from './pages/SanctionsPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import './App.css';

const ADMIN_TABS = [
  { id: 'home', label: 'Panel', Component: HomePage },
  { id: 'send-message', label: 'Enviar mensaje', Component: SendMessagePage },
  { id: 'sanctions', label: 'Sanciones', Component: SanctionsPage },
  { id: 'tickets', label: 'Tickets', Component: TicketsPage },
];

const MEMBER_TABS = [{ id: 'tickets', label: 'Tickets', Component: TicketsPage }];

function AppShell() {
  const { isAdmin, status } = useIdentity();
  const tabs = isAdmin ? ADMIN_TABS : MEMBER_TABS;
  const [tab, setTab] = useState(tabs[0].id);

  useEffect(() => {
    if (status === 'ready' && !tabs.find((t) => t.id === tab)) setTab(tabs[0].id);
  }, [status, isAdmin]);

  const Active = tabs.find((t) => t.id === tab)?.Component || tabs[0].Component;

  return (
    <>
      {tabs.length > 1 && (
        <nav className="tab-nav">
          {tabs.map((t) => (
            <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      )}
      <Active />
    </>
  );
}

export default function App() {
  return (
    <IdentityProvider>
      <IdentityGate>
        <AppShell />
      </IdentityGate>
    </IdentityProvider>
  );
}
