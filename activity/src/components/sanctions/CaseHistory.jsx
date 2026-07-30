import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function CaseHistory() {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/sanctions/cases').then(setCases).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!cases) return null;
  if (cases.length === 0) return <p className="muted">Todavía no se ha aplicado ninguna sanción.</p>;

  return (
    <div className="send-message-page">
      <div className="catalog-table">
        {cases.map((c) => (
          <div key={c.id} className="catalog-row case-row">
            <span className="catalog-title">{c.targetName || c.targetId}</span>
            <span className="muted">{c.decisiones.map((d) => d.titulo).join(', ')}</span>
            <span className="catalog-severity">
              {c.total.permaban ? 'PermaBan' : c.total.auto_ms > 0 ? `${Math.round(c.total.auto_ms / 86400000)}d` : 'Sin baneo'}
            </span>
            <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
            <span className="muted">Staff: {c.moderatorName || c.moderatorId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
