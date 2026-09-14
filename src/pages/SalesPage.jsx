// frontend/src/pages/SalesPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const API = import.meta.env.VITE_BACKEND_URL;

export default function SalesPage() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // list | new
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSales();
      loadProducts();
      loadCustomers();
    }
  }, [user]);

  async function loadSales() {
    const { data } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setSales(data || []);
  }

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).gt('quantity_in_stock', 0).order('name');
    setProducts(data || []);
  }

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('name');
    setCustomers(data || []);
  }

  function addItem(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      setItems(items.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { product_id: product.id, product_name: product.name, unit_price: product.selling_price, quantity: 1 }]);
    }
  }

  function updateQty(productId, qty) {
    if (qty <= 0) setItems(items.filter(i => i.product_id !== productId));
    else setItems(items.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal - (+discount || 0);

  async function completeSale() {
    if (items.length === 0) return alert('Add items to the sale');
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/invoices/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, customerId: customerId || null, items, discount: +discount || 0, paymentMethod, notes }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sale saved! Invoice: ${data.invoiceNumber}`);
        setItems([]);
        setDiscount(0);
        setCustomerId('');
        setNotes('');
        setView('list');
        loadSales();
      } else {
        alert('Failed to save sale');
      }
    } catch {
      alert('Network error');
    }
    setSaving(false);
  }

  if (view === 'new') return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>New Sale</h2>
        <button onClick={() => setView('list')} style={{ padding: '8px 16px', background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Back</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Product picker */}
        <div>
          <h3 style={{ marginTop: 0 }}>Add Products</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {products.map(p => (
              <div key={p.id} onClick={() => addItem(p.id)}
                style={{ background: 'white', borderRadius: 10, padding: 14, cursor: 'pointer', border: '1.5px solid #e0e0e0', transition: 'border-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#1976d2'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e0e0e0'}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{p.category}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: '#1976d2', fontWeight: 700 }}>${p.selling_price.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: p.quantity_in_stock <= p.low_stock_alert ? '#d32f2f' : '#888' }}>Stock: {p.quantity_in_stock}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Cart</h3>
          {items.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Click products to add</p>
          ) : (
            items.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.product_name}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>${item.unit_price.toFixed(2)} each</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateQty(item.product_id, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', fontSize: 16 }}>-</button>
                  <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', fontSize: 16 }}>+</button>
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#555' }}>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#555' }}>Discount ($)</span>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0', textAlign: 'right' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginBottom: 16, paddingTop: 8, borderTop: '2px solid #e0e0e0' }}>
              <span>Total</span>
              <span style={{ color: '#1976d2' }}>${total.toFixed(2)}</span>
            </div>

            <select value={customerId} onChange={e => setCustomerId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', marginBottom: 8, fontSize: 14 }}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', marginBottom: 8, fontSize: 14 }}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>

            <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', boxSizing: 'border-box', resize: 'none', fontSize: 14, marginBottom: 12 }} />

            <button onClick={completeSale} disabled={saving || items.length === 0}
              style={{ width: '100%', padding: 14, background: '#4caf50', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Complete Sale ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sales History</h2>
        <button onClick={() => setView('new')} style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + New Sale
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Invoice', 'Customer', 'Date', 'Payment', 'Total', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{s.invoice_number}</td>
                <td style={{ padding: '12px 16px' }}>{s.customers?.name || 'Walk-in'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{s.payment_method}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1976d2' }}>${s.total_amount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: s.payment_status === 'paid' ? '#e8f5e9' : '#fff3e0', color: s.payment_status === 'paid' ? '#2e7d32' : '#e65100' }}>
                    {s.payment_status}
                  </span>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No sales yet. Create your first sale!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
