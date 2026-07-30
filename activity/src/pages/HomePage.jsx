import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function HomePage() {
  const [channels, setChannels] = useState(null);
  const [roles, setRoles] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/guild/channels'), api.get('/guild/roles')])
      .then(([c, r]) => {
        setChannels(c);
        setRoles(r);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!channels || !roles) return null;

  return (
    <div className="home-page">
      <div className="gradient-frame">
        <section className="guide-box">
          <h2>Canales ({channels.length})</h2>
          <ul>
            {channels.slice(0, 10).map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </section>
      </div>
      <div className="gradient-frame">
        <section className="guide-box">
          <h2>Roles ({roles.length})</h2>
          <ul>
            {roles.slice(0, 10).map((r) => (
              <li key={r.id}>{r.name}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
