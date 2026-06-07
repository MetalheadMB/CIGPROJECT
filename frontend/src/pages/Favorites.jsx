import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MediaCard from '../components/MediaCard.jsx';
import { Spinner, Empty } from '../components/ui.jsx';

export default function Favorites() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/media/favorites/mine')
      .then(({ data }) => setMedia(data.media))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="section-head"><h2>Your favourites</h2></div>
      {loading ? (
        <Spinner />
      ) : media.length === 0 ? (
        <Empty icon="★" title="No favourites yet">Tap the star on any photo to save it here.</Empty>
      ) : (
        <div className="masonry">
          {media.map((m) => <MediaCard key={m.id} media={m} onChange={load} />)}
        </div>
      )}
    </>
  );
}
