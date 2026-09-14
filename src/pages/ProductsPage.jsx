// frontend/src/pages/ProductsPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const empty = { name: '', category: 'hardware', description: '', sku: '', purchase_price: '', selling_price: '', quantity_in_stock: 0, low_stock_alert: 5 };

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadProducts(); }, [user]);

  async function loadProducts() {
    let query = supabase.from('products').select('*').eq('user_id', user.id).order('name');
    if (category !== 'all') query = query.eq('category', category);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    setProducts(data || []);
  }

  useEffect(() => { if (user) loadProducts(); }, [search, category]);

  async function save() {
    if (!form.name || !form.selling_price) return alert('Name and selling price are required');
    setSaving(true);
    const payload = { ...form, user_id: user.id, selling_price: +form.selling_price, purchase_price: +(form.purchase_price || 0), quantity_in_stock: +form.quantity_in_stock };

    if (editId) {
      await supabase.from('products').update(payload).eq('id', editId);
    } else {
      await supabase.from('products').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(empty);
    loadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
  }

  function startEdit(p) {
    setForm({ name: p.name, category: p.category, description: p.description || '', sku: p.sku || '', purchase_price: p.purchase_price, selling_price: p.selling_price, quantity_in_stock: p.quantity_in_stock, low_stock_alert: p.low_stock_alert });
    setEditId(p.id);
    setShowForm(true);
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Products & Inventory</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }} style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14 }} />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14 }}>
          <option value="all">All Categories</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="accessory">Accessory</option>
        </select>
      </div>

      {/* Product table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Name', 'Category', 'SKU', 'Buy Price', 'Sell Price', 'Stock', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: p.category === 'hardware' ? '#e3f2fd' : p.category === 'software' ? '#e8f5e9' : '#fff3e0', color: p.category === 'hardware' ? '#1565c0' : p.category === 'software' ? '#2e7d32' : '#e65100' }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{p.sku || '—'}</td>
                <td style={{ padding: '12px 16px' }}>${p.purchase_price?.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1976d2' }}>${p.selling_price.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ color: p.quantity_in_stock <= p.low_stock_alert ? '#d32f2f' : '#333', fontWeight: p.quantity_in_stock <= p.low_stock_alert ? 700 : 400 }}>
                    {p.quantity_in_stock} {p.quantity_in_stock <= p.low_stock_alert && '⚠️'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => startEdit(p)} style={{ marginRight: 8, padding: '5px 12px', borderRadius: 6, border: '1px solid #1976d2', background: 'white', color: '#1976d2', cursor: 'pointer', fontSize: 13 }}>Edit</button>
                  <button onClick={() => deleteProduct(p.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #d32f2f', background: 'white', color: '#d32f2f', cursor: 'pointer', fontSize: 13 }}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No products found. Add your first product!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editId ? 'Edit Product' : 'Add Product'}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Product Name *', key: 'name', type: 'text' },
                { label: 'SKU / Code', key: 'sku', type: 'text' },
                { label: 'Purchase Price ($)', key: 'purchase_price', type: 'number' },
                { label: 'Selling Price ($) *', key: 'selling_price', type: 'number' },
                { label: 'Stock Quantity', key: 'quantity_in_stock', type: 'number' },
                { label: 'Low Stock Alert', key: 'low_stock_alert', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', boxSizing: 'border-box', fontSize: 14 }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14 }}>
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', boxSizing: 'border-box', fontSize: 14, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: 12, background: '#1976d2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
