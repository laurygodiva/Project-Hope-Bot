import { useIdentity } from '../context/IdentityContext.jsx';

function avatarUrl(user) {
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/0.png`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}

export default function IdentityGate({ children }) {
  const { status, user, isAdmin, error } = useIdentity();

  if (status === 'loading') {
    return (
      <div className="screen">
        <p>Verificando identidad...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen">
        <p className="error-text">No se pudo verificar tu identidad: {error}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="screen">
        <img className="avatar" src={avatarUrl(user)} alt={user.username} />
        <h2>{user.username}</h2>
        <p>No tienes permisos de administrador en este servidor.</p>
      </div>
    );
  }

  return (
    <div className="identity-wrapper">
      <div className="identity-banner">
        <img className="avatar-small" src={avatarUrl(user)} alt={user.username} />
        <span>{user.username}</span>
        <span className="badge">Admin</span>
      </div>
      {children}
    </div>
  );
}
