import { useState } from 'react';
import { IdentityProvider } from './context/IdentityContext.jsx';
import IdentityGate from './components/IdentityGate.jsx';
import HomePage from './pages/HomePage.jsx';
import SendMessagePage from './pages/SendMessagePage.jsx';
import SanctionsPage from './pages/SanctionsPage.jsx';
import './App.css';

const TABS = [
  { id: 'home', label: 'Panel', Component: HomePage },
  { id: 'send-message', label: 'Enviar mensaje', Component: SendMessagePage },
  { id: 'sanctions', label: 'Sanciones', Component: SanctionsPage },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const Active = TABS.find((t) => t.id === tab).Component;

  return (
    <IdentityProvider>
      <IdentityGate>
        <nav className="tab-nav">
          {TABS.map((t) => (
            <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <Active />
      </IdentityGate>
    </IdentityProvider>
  );
}
