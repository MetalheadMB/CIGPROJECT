import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fileToImage } from '../utils/image.js';
import { extractPrimaryDescriptor } from '../utils/face.js';
import { Avatar, RoleBadge } from '../components/ui.jsx';

export default function Profile() {
  const { user, refresh } = useAuth();
  const fileInput = useRef();
  const [form, setForm] = useState({ name: '', clubName: '' });
  const [hasFace, setHasFace] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setForm({ name: data.user.name || '', clubName: data.user.clubName || '' });
      setHasFace(data.user.hasFaceProfile);
    });
  }, []);

  async function saveInfo(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      await api.patch('/auth/profile', form);
      await refresh();
      setStatus('Profile saved.');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveSelfie(file) {
    setStatus('Analyzing selfie in your browser…');
    try {
      const { img } = await fileToImage(file);
      const descriptor = await extractPrimaryDescriptor(img);
      if (!descriptor) return setStatus('No face detected. Use a clear, front-facing photo.');
      await api.patch('/auth/profile', { faceDescriptor: descriptor });
      setHasFace(true);
      setStatus('Reference selfie saved — you can now find your photos automatically.');
    } catch (err) {
      setStatus(`Could not process selfie: ${err.message}`);
    }
  }

  if (!user) return null;

  return (
    <>
      <div className="section-head"><h2>Profile</h2></div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))' }}>
        <form className="panel" onSubmit={saveInfo}>
          <div className="row" style={{ gap: 14, marginBottom: 16 }}>
            <Avatar name={user.name} src={user.avatarUrl} lg />
            <div>
              <strong style={{ fontSize: 17 }}>{user.name}</strong>
              <div className="row" style={{ gap: 8, marginTop: 4 }}>
                <RoleBadge role={user.role} />
                <span className="muted small">{user.email}</span>
              </div>
            </div>
          </div>
          {status && <div className="alert-info" style={{ marginBottom: 12 }}>{status}</div>}
          <div className="field"><label>Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Club</label>
            <input className="input" value={form.clubName} onChange={(e) => setForm({ ...form, clubName: e.target.value })} /></div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>

        <div className="panel">
          <h3 style={{ fontSize: 16 }}>Reference selfie</h3>
          <p>Set a reference selfie so the platform can automatically find all photos you appear in. The image is processed locally — only the math (a face descriptor) is stored.</p>
          <div className="row" style={{ gap: 10 }}>
            <span className={`badge ${hasFace ? 'badge-public' : 'badge-private'}`}>
              {hasFace ? '✓ Selfie on file' : 'Not set'}
            </span>
            <button className="btn" onClick={() => fileInput.current.click()}>
              {hasFace ? 'Replace selfie' : 'Upload selfie'}
            </button>
          </div>
          <input ref={fileInput} type="file" accept="image/*" hidden
            onChange={(e) => e.target.files[0] && saveSelfie(e.target.files[0])} />
        </div>
      </div>
    </>
  );
}
