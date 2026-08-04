import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

function formatRemaining(ms) {
  if (ms <= 0) return 'Terminando...';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getStatus(c, now) {
  if (c.archived) return { key: 'archivada', label: 'Archivada' };
  if (c.total.permaban) return { key: 'activa', label: 'Activa (permanente)' };
  if (c.total.ends_at_iso) {
    const endsAt = Date.parse(c.total.ends_at_iso);
    if (endsAt > now) return { key: 'activa', label: `Activa · ${formatRemaining(endsAt - now)}` };
  }
  return { key: 'cumplida', label: 'Cumplida' };
}

export default function MySanctionsPanel() {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api
      .get('/sanctions/mine')
      .then(setCases)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!cases) return null;

  return (
    <div className="send-message-page">
      <h2>Mis sanciones</h2>

      {cases.length === 0 && <p className="muted">No tienes sanciones registradas.</p>}

      <div className="catalog-table">
        {cases.map((c) => {
          const status = getStatus(c, now);
          return (
            <div key={c.id} className="catalog-row my-sanctions-row">
              <span className="catalog-title">{c.decisiones.map((d) => d.titulo).join(', ')}</span>
              <span className="catalog-severity">
                {c.total.permaban ? 'PermaBan' : c.total.auto_ms > 0 ? `${Math.round(c.total.auto_ms / 86400000)}d` : 'Sin baneo'}
              </span>
              <span className={`status-badge status-${status.key}`}>{status.label}</span>
              <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
