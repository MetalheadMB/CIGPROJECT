import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CLUB_MEMBER', clubName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="panel auth-card" onSubmit={submit}>
        <h2>Create your account</h2>
        <p>Join your club to share and discover event media.</p>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Full name</label>
          <input className="input" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@club.dev" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Role</label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="VIEWER">Viewer</option>
              <option value="CLUB_MEMBER">Club Member</option>
              <option value="PHOTOGRAPHER">Photographer</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Club (optional)</label>
            <input className="input" value={form.clubName}
              onChange={(e) => setForm({ ...form, clubName: e.target.value })} placeholder="Photography Club" />
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
