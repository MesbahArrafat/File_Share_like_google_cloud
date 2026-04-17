import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from './AuthPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.glow} />
      <div className={s.card}>
        <div className={s.logo}>
          <span className={s.logoIcon}>◈</span>
          <span className={s.logoText}>FileShare</span>
        </div>
        <h1 className={s.heading}>Welcome back</h1>
        <p className={s.sub}>Sign in to your cloud storage</p>
        <form onSubmit={submit} className={s.form}>
          {error && <div className={s.error}>{error}</div>}
          <div className={s.field}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required placeholder="you@example.com" />
          </div>
          <div className={s.field}>
            <label>Password</label>
            <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required placeholder="••••••••" />
          </div>
          <button className={s.submit} disabled={loading}>
            {loading ? <span className={s.spinner}/> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className={s.switch}>No account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  );
}
