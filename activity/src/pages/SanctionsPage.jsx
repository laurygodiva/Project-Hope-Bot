import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import NewSanctionForm from '../components/sanctions/NewSanctionForm.jsx';
import CatalogManager from '../components/sanctions/CatalogManager.jsx';
import CaseHistory from '../components/sanctions/CaseHistory.jsx';

const SUB_TABS = [
  { id: 'new', label: 'Nueva sanción' },
  { id: 'catalog', label: 'Catálogo' },
  { id: 'history', label: 'Historial' },
];

export default function SanctionsPage() {
  const [subTab, setSubTab] = useState('new');
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);

  function loadCatalog() {
    api
      .get('/sanctions/catalog')
      .then(setCatalog)
      .catch((err) => setError(err.message));
  }

  useEffect(loadCatalog, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!catalog) return null;

  return (
    <div className="send-message-page">
      <nav className="mode-toggle sanctions-subnav">
        {SUB_TABS.map((t) => (
          <button key={t.id} className={subTab === t.id ? 'active' : ''} onClick={() => setSubTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'new' && <NewSanctionForm catalog={catalog} />}
      {subTab === 'catalog' && <CatalogManager catalog={catalog} onReload={loadCatalog} />}
      {subTab === 'history' && <CaseHistory />}
    </div>
  );
}
