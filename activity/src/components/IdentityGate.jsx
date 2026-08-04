import { useIdentity } from '../context/IdentityContext.jsx';

function avatarUrl(user) {
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/0.png`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}

const PHASE_LABEL = {
  authorizing: 'Verificando Usuario',
  verifying: 'Verificando Permisos',
  ready: '¡Listo!',
};

const PHASE_PROGRESS = {
  authorizing: 35,
  verifying: 75,
  ready: 100,
};

function LoadingScreen({ guild, phase }) {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        {guild?.iconURL ? <img src={guild.iconURL} alt={guild.name} /> : <div className="loading-logo-placeholder" />}
      </div>
      <p key={phase} className="loading-text">
        {PHASE_LABEL[phase] || 'Verificando...'}
      </p>
      <div className="loading-progress">
        <div className="loading-progress-fill" style={{ width: `${PHASE_PROGRESS[phase] || 10}%` }} />
      </div>
    </div>
  );
}

export default function IdentityGate({ children }) {
  const { status, phase, user, isAdmin, error, guild } = useIdentity();

  if (status === 'loading') {
    return <LoadingScreen guild={guild} phase={phase} />;
  }

  if (status === 'error') {
    return (
      <div className="screen">
        <p className="error-text">No se pudo verificar tu identidad: {error}</p>
      </div>
    );
  }

  return (
    <div className="identity-wrapper">
      <div className="identity-banner">
        <img className="avatar-small" src={avatarUrl(user)} alt={user.username} />
        <span>{user.username}</span>
        {isAdmin && <span className="badge">Admin</span>}
      </div>
      {children}
    </div>
  );
}
