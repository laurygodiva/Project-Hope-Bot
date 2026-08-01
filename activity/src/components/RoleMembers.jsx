import { useState } from 'react';
import { api } from '../api/client.js';

export default function RoleMembers({ role }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  function toggle() {
    setOpen((o) => !o);
    if (!open && members === null) {
      api
        .get(`/guild/members?role=${role.id}&limit=200`)
        .then(setMembers)
        .catch((err) => setError(err.message));
    }
  }

  function copyId(id) {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1200);
  }

  return (
    <li className="role-item">
      <button type="button" className="role-row" onClick={toggle}>
        <span className="role-name">{open ? '▾' : '▸'} {role.name}</span>
        <span className="role-count">{role.memberCount} usuario{role.memberCount === 1 ? '' : 's'}</span>
      </button>
      {open && (
        <div className="role-members">
          {error && <p className="error-text">{error}</p>}
          {!members && !error && <p className="muted">Cargando usuarios...</p>}
          {members?.length === 0 && <p className="muted">Nadie tiene este rol.</p>}
          {members?.map((m) => (
            <button
              key={m.id}
              type="button"
              className="role-member"
              onClick={() => copyId(m.id)}
              title="Copiar ID del usuario"
            >
              <img src={m.avatar} alt="" />
              <span className="role-member-name">{m.displayName}</span>
              {copiedId === m.id && <span className="badge">ID copiada</span>}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
