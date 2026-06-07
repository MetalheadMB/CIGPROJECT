import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import InfiniteGallery from '../components/InfiniteGallery.jsx';
import { Spinner, Empty, VisibilityBadge } from '../components/ui.jsx';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [album, setAlbum] = useState('');
  const [sort, setSort] = useState('new');

  const canManage = user && ['ADMIN', 'PHOTOGRAPHER'].includes(user.role);

  function load() {
    api.get(`/events/${id}`)
      .then(({ data }) => setEvent(data.event))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function createAlbum() {
    const name = prompt('Album name');
    if (!name) return;
    await api.post(`/events/${id}/albums`, { name });
    load();
  }

  if (loading) return <Spinner />;
  if (error) return <Empty icon="🔒" title="Can't open this event">{error}</Empty>;

  return (
    <>
      <div className="panel mt" style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.12), rgba(34,211,238,0.06))' }}>
        <div className="row between wrap">
          <div>
            <div className="row" style={{ gap: 10 }}>
              <h1 style={{ marginBottom: 4 }}>{event.name}</h1>
              <VisibilityBadge visibility={event.visibility} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              {event.category || 'Event'} · {event.clubName || 'Club'}
              {event.date && ` · ${new Date(event.date).toLocaleDateString()}`} · by {event.createdBy?.name}
            </p>
            {event.description && <p style={{ marginTop: 10, maxWidth: 640 }}>{event.description}</p>}
          </div>
          {user && ['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'].includes(user.role) && (
            <Link to={`/upload?event=${event.id}`} className="btn btn-primary">＋ Upload to event</Link>
          )}
        </div>
        <div className="event-stats" style={{ marginTop: 12 }}>
          <span>🖼️ {event._count?.media ?? 0} media</span>
          <span>📂 {event.albums?.length ?? 0} albums</span>
        </div>
      </div>

      <div className="section-head">
        <div className="toolbar">
          <span className={`chip ${!album ? 'active' : ''}`} onClick={() => setAlbum('')}>All media</span>
          {event.albums?.map((a) => (
            <span key={a.id} className={`chip ${album === a.id ? 'active' : ''}`} onClick={() => setAlbum(a.id)}>
              {a.name} ({a._count?.media ?? 0})
            </span>
          ))}
          {canManage && <span className="chip" onClick={createAlbum}>＋ Album</span>}
        </div>
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest</option>
          <option value="popular">Most liked</option>
        </select>
      </div>

      <InfiniteGallery params={{ eventId: id, albumId: album || undefined, sort }} emptyTitle="No media in this event yet" />
    </>
  );
}
