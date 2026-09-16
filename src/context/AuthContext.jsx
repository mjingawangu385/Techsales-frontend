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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) {
        // create profile if missing
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const isAdmin = authUser.email === 'munga2192@gmail.com';
          const { data: newProfile } = await supabase.from('profiles').insert([{
            id: userId,
            email: authUser.email,
            subscription_status: isAdmin ? 'owner' : 'trial',
            subscription_expires_at: isAdmin ? '2099-12-31 23:59:59+00' : new Date(Date.now() + 14*24*60*60*1000).toISOString()
          }]).select().single();
          setProfile(newProfile);
          return;
        }
      }
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password) {
    return await supabase.auth.signUp({ email, password });
  }
  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  }
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const ADMIN_EMAIL = 'munga2192@gmail.com';
  const now = new Date();
  const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
  const notExpired = expiresAt ? expiresAt > now : false;

  const isOwner = profile?.subscription_status === 'owner' || user?.email === ADMIN_EMAIL;
  const isActive = profile?.subscription_status === 'active' && notExpired;
  const isTrial = profile?.subscription_status === 'trial' && notExpired;
  const isSubscribed = isOwner || isActive || isTrial;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, isOwner, isSubscribed, isActive, isTrial }}>
      {children}
    </AuthContext.Provider>
  );
}