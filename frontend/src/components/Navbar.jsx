import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Avatar } from './ui.jsx';

function NotificationBell() {
  const { notifications, unread, markAllRead } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="bell" ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) markAllRead();
        }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="card dropdown">
          <div className="row between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <strong>Notifications</strong>
            <Link to="/notifications" className="small muted" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <div className="muted small" style={{ padding: 20, textAlign: 'center' }}>
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                {n.media?.thumbnailUrl ? (
                  <img className="thumb" src={n.media.thumbnailUrl} alt="" />
                ) : (
                  <Avatar name={n.actor?.name} src={n.actor?.avatarUrl} />
                )}
                <div className="small">{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const canUpload = user && ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'].includes(user.role);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="logo">📸</span> CIG Media
        </Link>
        <div className="nav-links">
          <NavLink to="/events" className="nav-link">Events</NavLink>
          <NavLink to="/search" className="nav-link">Search</NavLink>
          {user && <NavLink to="/my-photos" className="nav-link">My Photos</NavLink>}
          {user && <NavLink to="/favorites" className="nav-link">Favorites</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin" className="nav-link">Admin</NavLink>}
        </div>
        <div className="nav-right">
          {canUpload && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
              ＋ Upload
            </button>
          )}
          {user ? (
            <>
              <NotificationBell />
              <Link to="/profile" title={user.name}>
                <Avatar name={user.name} src={user.avatarUrl} />
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
