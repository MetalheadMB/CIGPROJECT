export function Avatar({ name, src, lg }) {
  const initials = (name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (src) return <img className={`avatar ${lg ? 'lg' : ''}`} src={src} alt={name} style={{ objectFit: 'cover' }} />;
  return <div className={`avatar ${lg ? 'lg' : ''}`}>{initials}</div>;
}

export const Spinner = () => <div className="spinner" />;

export function Empty({ icon = '✦', title, children }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function RoleBadge({ role }) {
  return <span className="badge badge-role">{role?.replace('_', ' ')}</span>;
}

export function VisibilityBadge({ visibility }) {
  return visibility === 'PRIVATE' ? (
    <span className="badge badge-private">Private</span>
  ) : (
    <span className="badge badge-public">Public</span>
  );
}
