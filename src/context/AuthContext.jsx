import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.clear();
  }

  const ADMIN_EMAIL = 'munga2192@gmail.com';
  const isOwner = profile?.subscription_status === 'owner' || user?.email === ADMIN_EMAIL;
  const isActive = profile?.subscription_status === 'active' && profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date();
  const isSubscribed = isOwner || isActive;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, isOwner, isSubscribed, isActive }}>
      {children}
    </AuthContext.Provider>
  );
}