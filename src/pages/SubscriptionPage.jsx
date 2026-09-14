// frontend/src/pages/SubscriptionPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_BACKEND_URL;

export default function SubscriptionPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [polling, setPolling] = useState(false);

  // M-Pesa payment
  async function handleMpesa() {
    if (!phone) return setMessage('Enter your M-Pesa phone number');
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/api/mpesa/stk-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Check your phone and enter M-Pesa PIN...');
        setPolling(true);
        pollMpesaStatus(data.checkoutRequestId);
      } else {
        setMessage('M-Pesa request failed. Try again.');
      }
    } catch {
      setMessage('Network error. Try again.');
    }
    setLoading(false);
  }

  // Poll for M-Pesa payment confirmation
  function pollMpesaStatus(checkoutRequestId) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await fetch(`${API}/api/mpesa/status/${checkoutRequestId}`);
      const data = await res.json();
      if (data.status === 'confirmed') {
        clearInterval(interval);
        setPolling(false);
        setMessage('Payment confirmed! Activating your account...');
        setTimeout(() => navigate('/'), 2000);
      } else if (data.status === 'failed' || attempts > 20) {
        clearInterval(interval);
        setPolling(false);
        setMessage('Payment failed or timed out. Try again.');
      }
    }, 3000);
  }

  // PayPal payment (opens PayPal in new tab for simplicity)
  async function handlePaypal() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      // Open PayPal checkout
      window.open(`https://www.sandbox.paypal.com/checkoutnow?token=${data.orderId}`, '_blank');
      setMessage('Complete payment in the PayPal window. Come back and refresh after payment.');
    } catch {
      setMessage('PayPal error. Try again.');
    }
    setLoading(false);
  }

  // Bank transfer submission
  async function handleBank() {
    if (!bankRef || !bankName) return setMessage('Enter bank name and reference number');
    setLoading(true);
    try {
      await fetch(`${API}/api/subscriptions/bank-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, referenceNumber: bankRef, bankName }),
      });
      setMessage('Bank transfer submitted! We will verify and activate within 24 hours. Check your email.');
    } catch {
      setMessage('Submission failed. Try again.');
    }
    setLoading(false);
  }

  const trialEnd = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString()
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>💻</div>
          <h1 style={{ margin: '12px 0 8px', fontSize: 24, fontWeight: 700 }}>Subscribe to TechSales</h1>
          {profile?.subscription_status === 'trial' ? (
            <p style={{ color: '#666', margin: 0 }}>
              Your free trial ends on <strong>{trialEnd}</strong>. Subscribe to continue.
            </p>
          ) : (
            <p style={{ color: '#d32f2f', margin: 0 }}>Your subscription has expired.</p>
          )}
          <div style={{ background: '#e8f5e9', borderRadius: 12, padding: '16px 24px', margin: '20px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#2e7d32' }}>$20</span>
            <span style={{ color: '#666' }}>/month</span>
          </div>
        </div>

        {/* Payment method selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['mpesa', 'paypal', 'bank'].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 8, border: '2px solid',
                borderColor: method === m ? '#1976d2' : '#e0e0e0',
                background: method === m ? '#e3f2fd' : 'white',
                cursor: 'pointer', fontWeight: method === m ? 600 : 400,
                color: method === m ? '#1976d2' : '#555', fontSize: 13,
              }}
            >
              {m === 'mpesa' ? '📱 M-Pesa' : m === 'paypal' ? '🌐 PayPal' : '🏦 Bank'}
            </button>
          ))}
        </div>

        {/* M-Pesa form */}
        {method === 'mpesa' && (
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>M-Pesa Phone Number</label>
            <input
              type="tel" placeholder="e.g. 0712345678"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>You will receive an STK push prompt on your phone.</p>
            <button
              onClick={handleMpesa}
              disabled={loading || polling}
              style={{ width: '100%', padding: 14, borderRadius: 8, background: '#4caf50', color: 'white', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
            >
              {loading ? 'Sending...' : polling ? 'Waiting for payment...' : 'Pay with M-Pesa'}
            </button>
          </div>
        )}

        {/* PayPal */}
        {method === 'paypal' && (
          <div>
            <p style={{ color: '#555', fontSize: 14, marginBottom: 16 }}>You will be redirected to PayPal to complete the $20 payment.</p>
            <button
              onClick={handlePaypal}
              disabled={loading}
              style={{ width: '100%', padding: 14, borderRadius: 8, background: '#0070ba', color: 'white', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'Opening PayPal...' : 'Pay with PayPal'}
            </button>
          </div>
        )}

        {/* Bank Transfer */}
        {method === 'bank' && (
          <div>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 13 }}>
              <strong>Bank Details:</strong><br />
              Bank: Equity Bank Kenya<br />
              Account Name: Your Business Name<br />
              Account Number: 1234567890<br />
              Branch: Kisii Branch<br />
              Amount: KES 2,600 (~$20 USD)<br />
              Reference: Your email address
            </div>
            <input
              type="text" placeholder="Bank name"
              value={bankName} onChange={(e) => setBankName(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, boxSizing: 'border-box', marginBottom: 8 }}
            />
            <input
              type="text" placeholder="Transaction reference number"
              value={bankRef} onChange={(e) => setBankRef(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, boxSizing: 'border-box' }}
            />
            <button
              onClick={handleBank}
              disabled={loading}
              style={{ width: '100%', padding: 14, borderRadius: 8, background: '#1976d2', color: 'white', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
            >
              {loading ? 'Submitting...' : 'Submit Bank Transfer'}
            </button>
          </div>
        )}

        {message && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#e3f2fd', color: '#1565c0', fontSize: 14, textAlign: 'center' }}>
            {message}
          </div>
        )}

        <button onClick={signOut} style={{ width: '100%', marginTop: 20, padding: 10, background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
