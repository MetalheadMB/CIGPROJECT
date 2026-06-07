import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, Empty, Avatar } from '../components/ui.jsx';

export default function MediaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [share, setShare] = useState(null);
  const [tagging, setTagging] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);

  function load() {
    api.get(`/media/${id}`)
      .then(({ data }) => setMedia(data.media))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function like() {
    const { data } = await api.post(`/media/${id}/like`);
    setMedia((m) => ({ ...m, liked: data.liked, likeCount: data.likeCount }));
  }
  async function favorite() {
    const { data } = await api.post(`/media/${id}/favorite`);
    setMedia((m) => ({ ...m, favorited: data.favorited }));
  }
  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    const { data } = await api.post(`/media/${id}/comments`, { text: comment });
    setMedia((m) => ({ ...m, comments: [data.comment, ...(m.comments || [])] }));
    setComment('');
  }
  async function doShare() {
    const { data } = await api.post(`/media/${id}/share`);
    setShare(`${window.location.origin}/m/${id}?s=${data.token}`);
  }
  async function download() {
    try {
      const res = await api.get(`/media/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  }
  async function searchUsers(q) {
    setUserQuery(q);
    if (q.length < 2) return setUserResults([]);
    const { data } = await api.get('/users', { params: { q } });
    setUserResults(data.users);
  }
  async function tagUser(u) {
    await api.post(`/media/${id}/tag-user`, { userId: u.id });
    setTagging(false);
    setUserQuery('');
    setUserResults([]);
    load();
  }

  if (loading) return <Spinner />;
  if (error) return <Empty icon="🔒" title="Can't open this media">{error}</Empty>;

  const canDelete = user && (user.id === media.uploadedBy?.id || user.role === 'ADMIN');

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.7fr) minmax(280px,1fr)', alignItems: 'start', marginTop: 18 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {media.type === 'VIDEO' ? (
          <video src={media.url} controls style={{ width: '100%' }} />
        ) : (
          <img src={media.url} alt={media.caption || ''} style={{ width: '100%', display: 'block' }} />
        )}
      </div>

      <div className="panel">
        <div className="row between">
          <Link to={`/events/${media.event?.id}`} className="row" style={{ gap: 10 }}>
            <Avatar name={media.uploadedBy?.name} src={media.uploadedBy?.avatarUrl} />
            <div>
              <strong>{media.uploadedBy?.name}</strong>
              <div className="small muted">{media.event?.name}</div>
            </div>
          </Link>
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm('Delete this media?')) { await api.delete(`/media/${id}`); history.back(); } }}>
              Delete
            </button>
          )}
        </div>

        {media.caption && <p style={{ marginTop: 14, color: 'var(--text)' }}>{media.caption}</p>}

        {media.tags?.length > 0 && (
          <div className="tag-list mt">
            {media.tags.map((t) => (
              <Link key={t.name} to={`/search?tag=${t.name}`} className="chip">#{t.name}</Link>
            ))}
          </div>
        )}

        <div className="row wrap mt" style={{ gap: 8 }}>
          <button className={`btn btn-sm ${media.liked ? '' : 'btn-ghost'}`} onClick={user ? like : undefined} disabled={!user}>
            {media.liked ? '♥' : '♡'} {media.likeCount || 0}
          </button>
          <button className={`btn btn-sm ${media.favorited ? '' : 'btn-ghost'}`} onClick={user ? favorite : undefined} disabled={!user}>
            {media.favorited ? '★ Saved' : '☆ Favourite'}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={doShare}>↗ Share</button>
          <button className="btn btn-sm btn-ghost" onClick={download}>⬇ Download</button>
          {user && <button className="btn btn-sm btn-ghost" onClick={() => setTagging((t) => !t)}>＠ Tag</button>}
        </div>

        {tagging && (
          <div className="mt">
            <input className="input" placeholder="Search people to tag…" value={userQuery} onChange={(e) => searchUsers(e.target.value)} />
            {userResults.map((u) => (
              <div key={u.id} className="notif-item" style={{ cursor: 'pointer' }} onClick={() => tagUser(u)}>
                <Avatar name={u.name} /> <span>{u.name} <span className="muted small">({u.role})</span></span>
              </div>
            ))}
          </div>
        )}

        {media.userTags?.length > 0 && (
          <div className="mt">
            <div className="small muted">Tagged:</div>
            <div className="tag-list">{media.userTags.map((t) => <span key={t.id} className="chip">@{t.taggedUser.name}</span>)}</div>
          </div>
        )}

        {share && (
          <div className="alert-info mt" style={{ textAlign: 'center' }}>
            <div className="small" style={{ marginBottom: 8 }}>Scan or copy to share</div>
            <div style={{ background: '#fff', display: 'inline-block', padding: 10, borderRadius: 10 }}>
              <QRCodeCanvas value={share} size={130} />
            </div>
            <input className="input mt" readOnly value={share} onFocus={(e) => e.target.select()} />
          </div>
        )}

        <div className="divider" />
        <h3 style={{ fontSize: 16 }}>Comments ({media.comments?.length || 0})</h3>
        {user && (
          <form className="row" style={{ gap: 8, marginBottom: 12 }} onSubmit={addComment}>
            <input className="input" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn btn-primary btn-sm">Post</button>
          </form>
        )}
        {media.comments?.map((c) => (
          <div key={c.id} className="row" style={{ gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
            <Avatar name={c.user?.name} src={c.user?.avatarUrl} />
            <div>
              <div className="small"><strong>{c.user?.name}</strong> <span className="muted">· {new Date(c.createdAt).toLocaleDateString()}</span></div>
              <div className="small">{c.text}</div>
            </div>
          </div>
        ))}
        {(!media.comments || media.comments.length === 0) && <p className="small muted">No comments yet.</p>}
      </div>
    </div>
  );
}
