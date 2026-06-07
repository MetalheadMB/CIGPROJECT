import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import MediaCard from '../components/MediaCard.jsx';
import { Spinner, Empty } from '../components/ui.jsx';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    tag: params.get('tag') || '',
    user: params.get('user') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    sort: 'new',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    api.get('/search/tags').then(({ data }) => setPopular(data.tags)).catch(() => {});
  }, []);

  const run = useCallback(async (f) => {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get('/search', { params: f });
      setResults(data.media);
    } finally {
      setLoading(false);
    }
  }, []);

  // auto-run if arriving with a tag/query in the URL
  useEffect(() => {
    if (filters.tag || filters.q || filters.user) run(filters);
    // eslint-disable-next-line
  }, []);

  function submit(e) {
    e?.preventDefault();
    setParams({ ...(filters.q && { q: filters.q }), ...(filters.tag && { tag: filters.tag }) });
    run(filters);
  }

  function quickTag(name) {
    const next = { ...filters, tag: name };
    setFilters(next);
    run(next);
  }

  return (
    <>
      <div className="section-head"><h2>Advanced search</h2></div>

      <form className="panel" onSubmit={submit}>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 2, minWidth: 220 }}>
            <label>Keyword (caption, event, tag, user)</label>
            <input className="input" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="e.g. mountains, fest, sunset" />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label>Tag</label>
            <input className="input" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })} placeholder="beach" />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label>Uploader name</label>
            <input className="input" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} />
          </div>
        </div>
        <div className="row wrap" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label>From date</label>
            <input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label>To date</label>
            <input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div className="field" style={{ width: 160 }}>
            <label>Sort</label>
            <select className="select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              <option value="new">Newest</option>
              <option value="popular">Most liked</option>
            </select>
          </div>
          <div className="field" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary">Search</button>
          </div>
        </div>
      </form>

      {popular.length > 0 && (
        <div className="toolbar mt">
          <span className="muted small">Popular tags:</span>
          {popular.slice(0, 16).map((t) => (
            <span key={t.name} className={`chip ${filters.tag === t.name ? 'active' : ''}`} onClick={() => quickTag(t.name)}>
              #{t.name} <span className="muted">{t.count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-2">
        {loading ? (
          <Spinner />
        ) : searched && results.length === 0 ? (
          <Empty icon="🔍" title="No matches">Try different keywords or date range.</Empty>
        ) : (
          <div className="masonry">
            {results.map((m) => <MediaCard key={m.id} media={m} />)}
          </div>
        )}
      </div>
    </>
  );
}
