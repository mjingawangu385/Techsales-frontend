// frontend/src/pages/SubscriptionPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_BACKEND_URL;

export default function SubscriptionPage() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [polling, setPolling] = useState(false);

  // ===== PERMANENT ADMIN BYPASS - PUT IT HERE =====
  const ADMIN_EMAIL = 'munga2192@gmail.com';
  const isOwner = profile?.subscription_status === 'owner' || user?.email === ADMIN_EMAIL;
  const isActive = profile?.subscription_status === 'active' && profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date();
  const isSubscribed = isOwner || isActive;

  // If you are owner or active, don't show paywall - go to dashboard
  useEffect(() => {
    if (!authLoading && isSubscribed) {
      navigate('/', { replace: true });
    }
  }, [isSubscribed, authLoading, navigate]);

  // ===== FIXED SIGN OUT =====
  const handleSignOut = async () => {
    try {
      await signOut(); // this calls supabase.auth.signOut() in context
      localStorage.clear();
      navigate('/login', { replace: true });
      window.location.reload();
    } catch (err) {
      console.error('Sign out error', err);
    }
  };

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  // Don't render paywall for owner
  if (isSubscribed) {
    return null;
  }

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
}