import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', password2:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try { await register(form.username, form.email, form.password, form.password2); nav('/'); }
    catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.glow} />
      <div className={s.card}>
        <div className={s.logo}><span className={s.logoIcon}>◈</span><span className={s.logoText}>FileShare</span></div>
        <h1 className={s.heading}>Create account</h1>
        <p className={s.sub}>Start storing your files securely</p>
        <form onSubmit={submit} className={s.form}>
          {error && <div className={s.error}>{error}</div>}
          <div className={s.field}><label>Username</label><input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} required placeholder="johndoe" /></div>
          <div className={s.field}><label>Email</label><input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required placeholder="you@example.com" /></div>
          <div className={s.row}>
            <div className={s.field}><label>Password</label><input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required placeholder="••••••••" /></div>
            <div className={s.field}><label>Confirm</label><input type="password" value={form.password2} onChange={e=>setForm(p=>({...p,password2:e.target.value}))} required placeholder="••••••••" /></div>
          </div>
          <button className={s.submit} disabled={loading}>
            {loading ? <span className={s.spinner}/> : null}
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className={s.switch}>Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
