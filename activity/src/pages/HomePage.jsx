import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import RoleMembers from '../components/RoleMembers.jsx';
import MemberStatsPanel from '../components/MemberStatsPanel.jsx';

export default function HomePage() {
  const [roles, setRoles] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/guild/roles')
      .then(setRoles)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!roles) return null;

  return (
    <div className="home-page">
      <div className="gradient-frame home-roles-panel">
        <section className="guide-box">
          <h2>Roles ({roles.length})</h2>
          <ul className="role-list">
            {roles.map((r) => (
              <RoleMembers key={r.id} role={r} />
            ))}
          </ul>
        </section>
      </div>

      <MemberStatsPanel />
    </div>
  );
}
