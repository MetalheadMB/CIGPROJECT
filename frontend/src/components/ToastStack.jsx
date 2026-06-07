import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

export default function ToastStack() {
  const { toasts, dismissToast } = useSocket();
  const navigate = useNavigate();

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast"
          onClick={() => {
            if (t.mediaId) navigate(`/m/${t.mediaId}`);
            dismissToast(t.id);
          }}
          style={{ cursor: t.mediaId ? 'pointer' : 'default' }}
        >
          <div className="small" style={{ fontWeight: 600, color: '#fff' }}>🔔 {t.message}</div>
        </div>
      ))}
    </div>
  );
}
