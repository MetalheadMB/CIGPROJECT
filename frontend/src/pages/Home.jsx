import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import InfiniteGallery from '../components/InfiniteGallery.jsx';

export default function Home() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events', { params: { sort: 'date', order: 'desc' } })
      .then(({ data }) => setEvents(data.events.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Every event. Every memory. One place.</h1>
        <p>
          Upload, organize and discover event media with AI-powered tagging, facial recognition,
          and social interactions — all in one centralized platform.
        </p>
        <div className="cta">
          <Link to="/events" className="btn btn-primary">Browse events</Link>
          {!user && <Link to="/register" className="btn">Get started</Link>}
          {user && <Link to="/my-photos" className="btn">Find my photos</Link>}
        </div>
      </section>

      {events.length > 0 && (
        <>
          <div className="section-head">
            <h2>Latest events</h2>
            <Link to="/events" className="btn btn-ghost btn-sm">See all →</Link>
          </div>
          <div className="grid grid-events">
            {events.map((ev) => (
              <Link to={`/events/${ev.id}`} key={ev.id} className="card event-card">
                <div className="event-cover" style={ev.coverUrl ? { backgroundImage: `url(${ev.coverUrl})`, backgroundSize: 'cover' } : {}}>
                  {!ev.coverUrl && '🎉'}
                </div>
                <div className="body">
                  <h3>{ev.name}</h3>
                  <p className="small">{ev.category || 'Event'} · {ev.clubName || 'Club'}</p>
                  <div className="event-stats">
                    <span>🖼️ {ev._count?.media ?? 0} media</span>
                    <span>📂 {ev._count?.albums ?? 0} albums</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="section-head mt-2">
        <h2>Recent uploads</h2>
      </div>
      <InfiniteGallery params={{ sort: 'new' }} emptyTitle="No public media yet" />
    </>
  );
}
