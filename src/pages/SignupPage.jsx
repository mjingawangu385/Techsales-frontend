// frontend/src/pages/SignupPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', businessName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.businessName);
    if (error) setError(error.message);
    else navigate('/');
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 44 }}>💻</div>
          <h1 style={{ margin: '12px 0 4px', fontSize: 24, fontWeight: 700 }}>Get Started Free</h1>
          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>14-day free trial • $20/month after</p>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', key: 'fullName', type: 'text' },
            { label: 'Business Name', key: 'businessName', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Password', key: 'password', type: 'password' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={set(f.key)} required
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
          ))}
          {error && <div style={{ color: '#d32f2f', fontSize: 14, marginBottom: 16, padding: 10, background: '#fce4ec', borderRadius: 8 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 14, background: '#4caf50', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Start Free Trial →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#1976d2', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
