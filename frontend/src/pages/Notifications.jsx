import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { Avatar, Empty } from '../components/ui.jsx';

export default function Notifications() {
  const { notifications, markAllRead } = useSocket();
  useEffect(() => { markAllRead(); }, [markAllRead]);

  return (
    <>
      <div className="section-head"><h2>Notifications</h2></div>
      {notifications.length === 0 ? (
        <Empty icon="🔔" title="You're all caught up">Likes, comments and tags will show here.</Empty>
      ) : (
        <div className="card">
          {notifications.map((n) => {
            const inner = (
              <div className={`notif-item ${n.read ? '' : 'unread'}`}>
                {n.media?.thumbnailUrl ? (
                  <img className="thumb" src={n.media.thumbnailUrl} alt="" />
                ) : (
                  <Avatar name={n.actor?.name} src={n.actor?.avatarUrl} />
                )}
                <div>
                  <div className="small">{n.message}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </div>
            );
            return n.media ? <Link key={n.id} to={`/m/${n.media.id}`}>{inner}</Link> : <div key={n.id}>{inner}</div>;
          })}
        </div>
      )}
    </>
  );
}
