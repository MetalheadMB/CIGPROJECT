import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
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
        <h2>Welcome back</h2>
        <p>Sign in to upload, interact, and find your photos.</p>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@club.dev" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </div>
        <div className="divider" />
        <p className="small center">Demo: admin@cig.dev / password123</p>
      </form>
    </div>
  );
}
