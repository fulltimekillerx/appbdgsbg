
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signup = async (email, password, name) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });
  };

  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    return await supabase.auth.signOut();
  };

  const passwordReset = async (email) => {
    // Note: Supabase password reset requires a redirect URL.
    // You can configure this in your Supabase project settings.
    return await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://appbdgsbg-26846956-157ae.firebaseapp.com/' });
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    passwordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
