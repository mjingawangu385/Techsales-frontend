// frontend/src/pages/CustomersPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const empty = { name: '', email: '', phone: '', address: '' };

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('name');
    setCustomers(data || []);
  }

  async function save() {
    if (!form.name) return alert('Name is required');
    if (editId) {
      await supabase.from('customers').update(form).eq('id', editId);
    } else {
      await supabase.from('customers').insert({ ...form, user_id: user.id });
    }
    setShowForm(false);
    setEditId(null);
    setForm(empty);
    load();
  }

  async function del(id) {
    if (!confirm('Delete this customer?')) return;
    await supabase.from('customers').delete().eq('id', id);
    load();
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Customers ({customers.length})</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }}
          style={{ padding: '10px 20px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Customer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {customers.map(c => (
          <div key={c.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#1976d2' }}>
                {c.name[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' }); setEditId(c.id); setShowForm(true); }}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #1976d2', color: '#1976d2', background: 'white', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                <button onClick={() => del(c.id)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d32f2f', color: '#d32f2f', background: 'white', cursor: 'pointer', fontSize: 12 }}>Del</button>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
              {c.phone && <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>📞 {c.phone}</div>}
              {c.email && <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>✉️ {c.email}</div>}
              {c.address && <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>📍 {c.address}</div>}
            </div>
          </div>
        ))}
        {customers.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#aaa' }}>No customers yet.</div>}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 440 }}>
            <h3 style={{ marginTop: 0 }}>{editId ? 'Edit Customer' : 'Add Customer'}</h3>
            {['name', 'email', 'phone', 'address'].map(f => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: '#555', textTransform: 'capitalize', display: 'block', marginBottom: 4 }}>{f}{f === 'name' ? ' *' : ''}</label>
                <input type="text" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', boxSizing: 'border-box', fontSize: 14 }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={save} style={{ flex: 1, padding: 12, background: '#1976d2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Save</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
