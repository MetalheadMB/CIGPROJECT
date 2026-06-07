import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MediaCard({ media, onChange }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(media.liked);
  const [likeCount, setLikeCount] = useState(media.likeCount || 0);
  const [favorited, setFavorited] = useState(media.favorited);
  const [busy, setBusy] = useState(false);

  async function toggleLike(e) {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setLiked((l) => !l);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/media/${media.id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(liked);
      setLikeCount(likeCount);
    } finally {
      setBusy(false);
    }
  }

  async function toggleFav(e) {
    e.preventDefault();
    if (!user) return;
    setFavorited((f) => !f);
    try {
      const { data } = await api.post(`/media/${media.id}/favorite`);
      setFavorited(data.favorited);
      onChange?.();
    } catch {
      setFavorited(favorited);
    }
  }

  const src = media.thumbnailUrl || media.url;

  return (
    <Link to={`/m/${media.id}`} className="media-card">
      {media.type === 'VIDEO' ? (
        <video src={media.url} muted playsInline preload="metadata" />
      ) : (
        <img src={src} alt={media.caption || 'media'} loading="lazy" />
      )}
      <div className="overlay">
        {media.tags?.length > 0 && (
          <div className="tag-list" style={{ marginBottom: 8 }}>
            {media.tags.slice(0, 3).map((t) => (
              <span key={t.name} className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>
                #{t.name}
              </span>
            ))}
          </div>
        )}
        <div className="media-meta between" style={{ display: 'flex', width: '100%' }}>
          <span>{media.event?.name}</span>
          <div className="media-actions">
            <button className={`icon-btn ${liked ? 'on' : ''}`} onClick={toggleLike} title="Like">
              {liked ? '♥' : '♡'} {likeCount}
            </button>
            <button className={`icon-btn ${favorited ? 'on' : ''}`} onClick={toggleFav} title="Favourite">
              {favorited ? '★' : '☆'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
