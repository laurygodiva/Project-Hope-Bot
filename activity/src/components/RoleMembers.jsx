import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { copyToClipboard } from '../utils/clipboard.js';

export default function RoleMembers({ role }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState(null);
  const [revealedId, setRevealedId] = useState(null);
  const inputRef = useRef(null);

  function toggle() {
    setOpen((o) => !o);
    if (!open && members === null) {
      api
        .get(`/guild/members?role=${role.id}&limit=200`)
        .then(setMembers)
        .catch((err) => setError(err.message));
    }
  }

  function revealId(id) {
    setRevealedId((prev) => (prev === id ? null : id));
    copyToClipboard(id);
  }

  useEffect(() => {
    if (revealedId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [revealedId]);

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
            <div key={m.id}>
              <button type="button" className="role-member" onClick={() => revealId(m.id)} title="Mostrar/copiar ID del usuario">
                <img src={m.avatar} alt="" />
                <span className="role-member-name">{m.displayName}</span>
              </button>
              {revealedId === m.id && (
                <div className="role-member-id-reveal">
                  <input ref={inputRef} type="text" readOnly value={m.id} onClick={(e) => e.target.select()} />
                  <span className="muted">Ctrl+C para copiar</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
