import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, Empty, VisibilityBadge } from '../components/ui.jsx';

function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', category: '', clubName: '', date: '', description: '', visibility: 'PUBLIC' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/events', form);
      onCreated(data.event);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 80, padding: 16 }} onClick={onClose}>
      <form className="panel" style={{ width: 480, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Create event</h2>
        {error && <div className="error-banner">{error}</div>}
        <div className="field"><label>Event name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Category</label>
            <input className="input" placeholder="Cultural, Trip…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>Club</label>
            <input className="input" value={form.clubName} onChange={(e) => setForm({ ...form, clubName: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>Visibility</label>
            <select className="select" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="PUBLIC">Public</option><option value="PRIVATE">Private</option>
            </select></div>
        </div>
        <div className="field"><label>Description</label>
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="row between">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create event'}</button>
        </div>
      </form>
    </div>
  );
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('date');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);

  const canCreate = user && ['ADMIN', 'PHOTOGRAPHER'].includes(user.role);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/events', { params: { sort, category: category || undefined, q: q || undefined } })
      .then(({ data }) => setEvents(data.events))
      .finally(() => setLoading(false));
  }, [sort, category, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/events/categories').then(({ data }) => setCategories(data.categories)).catch(() => {}); }, []);

  return (
    <>
      <div className="section-head">
        <h2>Events</h2>
        <div className="toolbar">
          <input className="input" style={{ width: 200 }} placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="name">Sort: Name</option>
            <option value="category">Sort: Category</option>
          </select>
          {canCreate && <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>＋ New event</button>}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="toolbar" style={{ marginBottom: 18 }}>
          <span className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>All</span>
          {categories.map((c) => (
            <span key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</span>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : events.length === 0 ? (
        <Empty icon="🎈" title="No events found">Try a different filter, or create the first event.</Empty>
      ) : (
        <div className="grid grid-events">
          {events.map((ev) => (
            <Link to={`/events/${ev.id}`} key={ev.id} className="card event-card">
              <div className="event-cover" style={ev.coverUrl ? { backgroundImage: `url(${ev.coverUrl})`, backgroundSize: 'cover' } : {}}>
                {!ev.coverUrl && '🎉'}
              </div>
              <div className="body">
                <div className="row between">
                  <h3>{ev.name}</h3>
                  <VisibilityBadge visibility={ev.visibility} />
                </div>
                <p className="small">{ev.category || 'Event'} · {ev.clubName || 'Club'}
                  {ev.date && ` · ${new Date(ev.date).toLocaleDateString()}`}</p>
                <div className="event-stats">
                  <span>🖼️ {ev._count?.media ?? 0}</span>
                  <span>📂 {ev._count?.albums ?? 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modal && <CreateEventModal onClose={() => setModal(false)} onCreated={() => { setModal(false); load(); }} />}
    </>
  );
}
