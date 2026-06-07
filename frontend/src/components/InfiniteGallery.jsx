import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import MediaCard from './MediaCard.jsx';
import { Spinner, Empty } from './ui.jsx';

// Infinite-scroll gallery backed by cursor pagination (bonus: infinite scrolling).
export default function InfiniteGallery({ params = {}, emptyTitle = 'No media yet' }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const sentinel = useRef();
  const paramKey = JSON.stringify(params);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const { data } = await api.get('/media', {
          params: { ...params, limit: 24, cursor: reset ? undefined : cursor },
        });
        setItems((prev) => (reset ? data.media : [...prev, ...data.media]));
        setCursor(data.nextCursor);
        setDone(!data.nextCursor);
      } catch {
        setDone(true);
      } finally {
        setLoading(false);
      }
    },
    [cursor, params]
  );

  // Reset when params change
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setDone(false);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  // Observe sentinel for infinite scroll
  useEffect(() => {
    if (done || loading) return;
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && load(false),
      { rootMargin: '600px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [done, loading, load]);

  if (!loading && items.length === 0) {
    return <Empty icon="🖼️" title={emptyTitle}>Media will appear here once it's uploaded.</Empty>;
  }

  return (
    <>
      <div className="masonry">
        {items.map((m) => (
          <MediaCard key={m.id} media={m} />
        ))}
      </div>
      {loading && <Spinner />}
      <div ref={sentinel} style={{ height: 1 }} />
      {done && items.length > 0 && <p className="center muted small mt">— end of gallery —</p>}
    </>
  );
}
