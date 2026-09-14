// frontend/src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: '📊 Dashboard', end: true },
  { to: '/products', label: '📦 Products' },
  { to: '/sales', label: '🛒 Sales' },
  { to: '/customers', label: '👥 Customers' },
  { to: '/reports', label: '📈 Reports' },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#1a237e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>💻 TechSales</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{profile?.business_name || 'My Business'}</div>
        </div>

        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'block', padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              })}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{profile?.full_name}</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>{profile?.subscription_status === 'active' ? '✅ Active' : '⏳ Trial'}</div>
          <button onClick={handleSignOut}
            style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, background: '#f8f9fa', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
