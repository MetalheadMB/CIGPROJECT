import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar, Spinner, RoleBadge } from '../components/ui.jsx';

const ROLES = ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER', 'VIEWER'];

function Stat({ label, value, icon }) {
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div className="row between">
        <span className="muted small">{label}</span><span>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([api.get('/users/stats'), api.get('/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data.users); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    await api.patch(`/users/${id}/role`, { role });
    load();
  }

  if (loading) return <Spinner />;

  const t = stats.totals;
  return (
    <>
      <div className="section-head"><h2>Admin · Analytics</h2></div>

      <div className="grid grid-2">
        <Stat label="Users" value={t.users} icon="👥" />
        <Stat label="Events" value={t.events} icon="🎉" />
        <Stat label="Media" value={t.media} icon="🖼️" />
        <Stat label="Photos" value={t.images} icon="📷" />
        <Stat label="Videos" value={t.videos} icon="🎬" />
        <Stat label="Likes" value={t.likes} icon="♥" />
        <Stat label="Comments" value={t.comments} icon="💬" />
      </div>

      <div className="grid mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))' }}>
        <div className="panel">
          <h3 style={{ fontSize: 16 }}>Roles distribution</h3>
          {stats.roles.map((r) => (
            <div key={r.role} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <RoleBadge role={r.role} /><strong>{r.count}</strong>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3 style={{ fontSize: 16 }}>Top tags</h3>
          <div className="tag-list">
            {stats.topTags.length === 0 && <span className="muted small">No tags yet</span>}
            {stats.topTags.map((tg) => <span key={tg.name} className="chip">#{tg.name} <span className="muted">{tg.count}</span></span>)}
          </div>
        </div>
      </div>

      <div className="section-head mt-2"><h2>User management</h2></div>
      <div className="card">
        {users.map((u) => (
          <div key={u.id} className="notif-item">
            <Avatar name={u.name} src={u.avatarUrl} />
            <div style={{ flex: 1 }}>
              <strong>{u.name}</strong> <span className="muted small">{u.email}</span>
            </div>
            <select className="select" style={{ width: 'auto' }} value={u.role}
              disabled={u.id === user.id}
              onChange={(e) => changeRole(u.id, e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}
