import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useIdentity } from '../context/IdentityContext.jsx';

const REASON_LABEL = {
  mensajes_masivos: 'Mensajes masivos',
  url_repetida: 'URL repetida',
  invite_link: 'Enlace de invitación',
  scam_domain: 'Dominio de estafa',
  cuenta_nueva: 'Cuenta nueva',
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function UserRow({ avatar, tag, id, children }) {
  return (
    <div className="blacklist-row">
      <img src={avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" />
      <div className="blacklist-row-info">
        <strong>{tag || 'Desconocido'}</strong>
        <span className="muted">{id}</span>
      </div>
      <div className="blacklist-row-actions">{children}</div>
    </div>
  );
}

function BlacklistSection({ title, endpoint, renderItem, emptyText }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api
      .get(endpoint)
      .then(setList)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  return (
    <li className="role-item">
      <button type="button" className="role-row" onClick={() => setOpen((o) => !o)}>
        <span className="role-name">
          {open ? '▾' : '▸'} {title}
        </span>
        <span className="role-count">{list ? `${list.length} usuario${list.length === 1 ? '' : 's'}` : '...'}</span>
      </button>
      {open && (
        <div className="role-members blacklist-list">
          {error && <p className="error-text">{error}</p>}
          {!list && !error && <p className="muted">Cargando...</p>}
          {list?.length === 0 && <p className="muted">{emptyText}</p>}
          {list?.map((item) => renderItem(item, load))}
        </div>
      )}
    </li>
  );
}

function SuspiciousItem(u) {
  return (
    <UserRow key={u.id} avatar={u.avatar} tag={u.tag} id={u.id}>
      <span className="muted">{u.reasons.join(' · ')}</span>
    </UserRow>
  );
}

function DangerousItem(u, reload) {
  async function handleClear() {
    try {
      await api.delete(`/guild/blacklist/dangerous/${u.id}`);
      reload();
    } catch {
      // se muestra en la lista aunque falle; el usuario puede reintentar
    }
  }

  return (
    <div key={u.id} className="blacklist-danger-entry">
      <UserRow avatar={u.avatar} tag={u.tag} id={u.id}>
        <button type="button" className="btn-secondary" onClick={handleClear}>
          Limpiar avisos
        </button>
      </UserRow>
      <div className="blacklist-flag-list">
        {u.flags.map((f, j) => (
          <span key={j} className="blacklist-flag-chip" title={f.detail}>
            {REASON_LABEL[f.reason] || f.reason} · {formatDate(f.at)}
          </span>
        ))}
      </div>
    </div>
  );
}

function BannedItem(u) {
  return (
    <UserRow key={u.id} avatar={u.avatar} tag={u.tag} id={u.id}>
      {u.reason && <span className="muted">{u.reason}</span>}
    </UserRow>
  );
}

function VetadosSection() {
  const { isFounder } = useIdentity();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  function load() {
    api
      .get('/guild/blacklist/vetados')
      .then(setList)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!userId.trim()) return;
    setSending(true);
    try {
      const updated = await api.post('/guild/blacklist/vetados', { userId: userId.trim(), reason });
      setList(updated);
      setUserId('');
      setReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleRemove(id) {
    try {
      const updated = await api.delete(`/guild/blacklist/vetados/${id}`);
      setList(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <li className="role-item">
      <button type="button" className="role-row" onClick={() => setOpen((o) => !o)}>
        <span className="role-name">{open ? '▾' : '▸'} Vetados</span>
        <span className="role-count">{list ? `${list.length} usuario${list.length === 1 ? '' : 's'}` : '...'}</span>
      </button>
      {open && (
        <div className="role-members blacklist-list">
          {isFounder && (
            <form onSubmit={handleAdd} className="blacklist-add-form">
              <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ID de usuario de Discord" />
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" />
              <button type="submit" className="btn-primary" disabled={sending}>
                Añadir a vetados
              </button>
            </form>
          )}

          {error && <p className="error-text">{error}</p>}
          {!list && !error && <p className="muted">Cargando...</p>}
          {list?.length === 0 && <p className="muted">No hay usuarios vetados.</p>}
          {list?.map((v) => (
            <UserRow key={v.id} avatar={null} tag={v.reason || 'Sin motivo'} id={v.id}>
              {isFounder && (
                <button type="button" className="btn-secondary" onClick={() => handleRemove(v.id)}>
                  Quitar
                </button>
              )}
            </UserRow>
          ))}
        </div>
      )}
    </li>
  );
}

export default function BlacklistPanel() {
  return (
    <section className="guide-box">
      <h2>Lista negra</h2>
      <ul className="role-list">
        <BlacklistSection
          title="Sospechosos"
          endpoint="/guild/blacklist/suspicious"
          renderItem={SuspiciousItem}
          emptyText="Sin usuarios sospechosos."
        />
        <BlacklistSection
          title="Peligrosos"
          endpoint="/guild/blacklist/dangerous"
          renderItem={DangerousItem}
          emptyText="Sin usuarios peligrosos detectados."
        />
        <VetadosSection />
        <BlacklistSection
          title="Baneados"
          endpoint="/guild/blacklist/banned"
          renderItem={BannedItem}
          emptyText="No hay usuarios baneados."
        />
      </ul>
    </section>
  );
}
