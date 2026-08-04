import { useState } from 'react';
import ComposeMessagePanel from '../components/messages/ComposeMessagePanel.jsx';
import DeletedMessagesPanel from '../components/messages/DeletedMessagesPanel.jsx';
import EditedMessagesPanel from '../components/messages/EditedMessagesPanel.jsx';

const SUB_TABS = [
  { id: 'compose', label: 'Enviar mensaje' },
  { id: 'deleted', label: 'Mensajes eliminados' },
  { id: 'edited', label: 'Mensajes editados' },
];

export default function SendMessagePage() {
  const [subTab, setSubTab] = useState('compose');

  return (
    <div className="send-message-page">
      <nav className="mode-toggle sanctions-subnav">
        {SUB_TABS.map((t) => (
          <button key={t.id} className={subTab === t.id ? 'active' : ''} onClick={() => setSubTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'compose' && <ComposeMessagePanel />}
      {subTab === 'deleted' && <DeletedMessagesPanel />}
      {subTab === 'edited' && <EditedMessagesPanel />}
    </div>
  );
}
