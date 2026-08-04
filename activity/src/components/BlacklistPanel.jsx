import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const REASON_LABEL = {
  mensajes_masivos: 'Mensajes masivos',
  url_repetida: 'URL repetida',
  invite_link: 'Enlace de invitación',
  scam_domain: 'Dominio de estafa',
  cuenta_nueva: 'Cuenta nueva',
};

const SUB_TABS = [
  { id: 'suspicious', label: 'Sospechosos' },
  { id: 'dangerous', label: 'Peligrosos' },
  { id: 'vetados', label: 'Vetados' },
  { id: 'banned', label: 'Baneados' },
];

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

function SuspiciousList() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/guild/blacklist/suspicious')
      .then(setList)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!list) return <p className="muted">Cargando...</p>;
  if (list.length === 0) return <p className="muted">Sin usuarios sospechosos.</p>;

  return (
    <div className="blacklist-list">
      {list.map((u) => (
        <UserRow key={u.id} avatar={u.avatar} tag={u.tag} id={u.id}>
          <span className="muted">{u.reasons.join(' · ')}</span>
        </UserRow>
      ))}
    </div>
  );
}

function DangerousList() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api
      .get('/guild/blacklist/dangerous')
      .then(setList)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleClear(id) {
    try {
      await api.delete(`/guild/blacklist/dangerous/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!list) return <p className="muted">Cargando...</p>;
  if (list.length === 0) return <p className="muted">Sin usuarios peligrosos detectados.</p>;

  return (
    <div className="blacklist-list">
      {list.map((u) => (
        <div key={u.id} className="blacklist-danger-entry">
          <UserRow avatar={u.avatar} tag={u.tag} id={u.id}>
            <button type="button" className="btn-secondary" onClick={() => handleClear(u.id)}>
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
      ))}
    </div>
  );
}

function VetadosList() {
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
    <div>
      <form onSubmit={handleAdd} className="blacklist-add-form">
        <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ID de usuario de Discord" />
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" />
        <button type="submit" className="btn-primary" disabled={sending}>
          Añadir a vetados
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {!list && !error && <p className="muted">Cargando...</p>}
      {list?.length === 0 && <p className="muted">No hay usuarios vetados.</p>}

      <div className="blacklist-list">
        {list?.map((v) => (
          <UserRow key={v.id} avatar={null} tag={v.reason || 'Sin motivo'} id={v.id}>
            <button type="button" className="btn-secondary" onClick={() => handleRemove(v.id)}>
              Quitar
            </button>
          </UserRow>
        ))}
      </div>
    </div>
  );
}

function BannedList() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/guild/blacklist/banned')
      .then(setList)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!list) return <p className="muted">Cargando...</p>;
  if (list.length === 0) return <p className="muted">No hay usuarios baneados.</p>;

  return (
    <div className="blacklist-list">
      {list.map((u) => (
        <UserRow key={u.id} avatar={u.avatar} tag={u.tag} id={u.id}>
          {u.reason && <span className="muted">{u.reason}</span>}
        </UserRow>
      ))}
    </div>
  );
}

export default function BlacklistPanel() {
  const [subTab, setSubTab] = useState('suspicious');

  return (
    <section className="guide-box">
      <h2>Lista negra</h2>
      <nav className="mode-toggle blacklist-subnav">
        {SUB_TABS.map((t) => (
          <button key={t.id} className={subTab === t.id ? 'active' : ''} onClick={() => setSubTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="blacklist-body">
        {subTab === 'suspicious' && <SuspiciousList />}
        {subTab === 'dangerous' && <DangerousList />}
        {subTab === 'vetados' && <VetadosList />}
        {subTab === 'banned' && <BannedList />}
      </div>
    </section>
  );
}
