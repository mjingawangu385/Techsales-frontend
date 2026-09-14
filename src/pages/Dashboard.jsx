// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ todayRevenue: 0, monthRevenue: 0, todaySalesCount: 0, monthSalesCount: 0, lowStockCount: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
      loadChartData();
    }
  }, [user]);

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [{ data: todaySales }, { data: monthSales }, { data: products }] = await Promise.all([
      supabase.from('sales').select('total_amount').eq('user_id', user.id).gte('created_at', today),
      supabase.from('sales').select('total_amount').eq('user_id', user.id).gte('created_at', thirtyDaysAgo),
      supabase.from('products').select('quantity_in_stock, low_stock_alert').eq('user_id', user.id),
    ]);

    setStats({
      todayRevenue: (todaySales || []).reduce((s, x) => s + x.total_amount, 0),
      monthRevenue: (monthSales || []).reduce((s, x) => s + x.total_amount, 0),
      todaySalesCount: todaySales?.length || 0,
      monthSalesCount: monthSales?.length || 0,
      lowStockCount: (products || []).filter(p => p.quantity_in_stock <= p.low_stock_alert).length,
    });
    setLoading(false);
  }

  async function loadChartData() {
    // Last 7 days sales
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const { data } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('user_id', user.id)
        .gte('created_at', dateStr)
        .lt('created_at', new Date(d.getTime() + 86400000).toISOString().split('T')[0]);
      
      days.push({
        day: d.toLocaleDateString('en', { weekday: 'short' }),
        revenue: (data || []).reduce((s, x) => s + x.total_amount, 0),
      });
    }
    setChartData(days);
  }

  const cards = [
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: '💵', color: '#e8f5e9', accent: '#4caf50' },
    { label: "Today's Sales", value: stats.todaySalesCount, icon: '🛒', color: '#e3f2fd', accent: '#1976d2' },
    { label: '30-Day Revenue', value: `$${stats.monthRevenue.toFixed(2)}`, icon: '📈', color: '#fff3e0', accent: '#f57c00' },
    { label: 'Low Stock Items', value: stats.lowStockCount, icon: '⚠️', color: '#fce4ec', accent: '#c62828' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24, fontSize: 22, fontWeight: 700 }}>Dashboard</h2>

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {cards.map((c) => (
              <div key={c.label} style={{ background: c.color, borderRadius: 12, padding: 20, borderLeft: `4px solid ${c.accent}` }}>
                <div style={{ fontSize: 28 }}>{c.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 4px', color: c.accent }}>{c.value}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Revenue — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Bar dataKey="revenue" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
