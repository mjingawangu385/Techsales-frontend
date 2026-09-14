// frontend/src/pages/ReportsPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#1976d2', '#4caf50', '#f57c00', '#9c27b0'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(30);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => { if (user) loadReports(); }, [user, period]);

  async function loadReports() {
    const since = new Date(Date.now() - period * 86400000).toISOString();

    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at');

    const total = (sales || []).reduce((s, x) => s + x.total_amount, 0);
    setTotalRevenue(total);

    // Group by day
    const byDay = {};
    (sales || []).forEach(s => {
      const day = s.created_at.split('T')[0];
      byDay[day] = (byDay[day] || 0) + s.total_amount;
    });
    setSalesData(Object.entries(byDay).map(([date, revenue]) => ({ date: date.slice(5), revenue })));

    // Sales by payment method
    const { data: salesWithMethod } = await supabase
      .from('sales')
      .select('payment_method, total_amount')
      .eq('user_id', user.id)
      .gte('created_at', since);

    const byMethod = {};
    (salesWithMethod || []).forEach(s => {
      byMethod[s.payment_method] = (byMethod[s.payment_method] || 0) + s.total_amount;
    });
    setCategoryData(Object.entries(byMethod).map(([name, value]) => ({ name, value: +value.toFixed(2) })));

    // Top products by revenue
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('product_name, quantity, total_price, sales!inner(user_id, created_at)')
      .eq('sales.user_id', user.id)
      .gte('sales.created_at', since);

    const byProduct = {};
    (saleItems || []).forEach(i => {
      if (!byProduct[i.product_name]) byProduct[i.product_name] = { revenue: 0, quantity: 0 };
      byProduct[i.product_name].revenue += i.total_price;
      byProduct[i.product_name].quantity += i.quantity;
    });
    setTopProducts(Object.entries(byProduct)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5));
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Reports & Analytics</h2>
        <select value={period} onChange={e => setPeriod(+e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14 }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #1976d2, #42a5f5)', borderRadius: 12, padding: 24, color: 'white', marginBottom: 24 }}>
        <div style={{ fontSize: 14, opacity: 0.85 }}>Total Revenue ({period} days)</div>
        <div style={{ fontSize: 40, fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `$${v.toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#1976d2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Revenue by Payment Method</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `$${v}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#aaa', textAlign: 'center' }}>No data yet</p>}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Top Products by Revenue</h3>
        {topProducts.length === 0 ? <p style={{ color: '#aaa' }}>No sales data yet</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['Product', 'Units Sold', 'Revenue'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#666', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.name} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ marginRight: 8, fontWeight: 700, color: ['🥇','🥈','🥉','4️⃣','5️⃣'][i] ? '#333' : '#333' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                    {p.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#555' }}>{p.quantity}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1976d2' }}>${p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
