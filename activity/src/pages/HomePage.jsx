import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useIdentity } from '../context/IdentityContext.jsx';
import RoleMembers from '../components/RoleMembers.jsx';
import MemberStatsPanel from '../components/MemberStatsPanel.jsx';
import UserRoleSearch from '../components/UserRoleSearch.jsx';
import BlacklistPanel from '../components/BlacklistPanel.jsx';
import StaffRatingsPanel from '../components/StaffRatingsPanel.jsx';
import StaffRankingPanel from '../components/StaffRankingPanel.jsx';

export default function HomePage() {
  const { isFounder } = useIdentity();
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
      <div className="home-left-column">
        <div className="gradient-frame home-roles-panel">
          <section className="guide-box">
            <h2>Roles ({roles.length})</h2>
            <UserRoleSearch roles={roles} />
            <ul className="role-list">
              {roles.map((r) => (
                <RoleMembers key={r.id} role={r} />
              ))}
            </ul>
          </section>
        </div>

        <div className="gradient-frame home-blacklist-panel">
          <BlacklistPanel />
        </div>
      </div>

      <div className="home-right-column">
        <MemberStatsPanel />

        <div className="gradient-frame home-stats-panel">
          <StaffRankingPanel />
        </div>

        {isFounder && (
          <div className="gradient-frame home-stats-panel">
            <StaffRatingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
