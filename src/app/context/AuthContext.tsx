import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { api } from '../lib/api';
import { AuthUser } from '../lib/types';

// Singleton Supabase client for auth.
// persistSession + autoRefreshToken = session survives page reloads and
// the client silently renews the access token before it expires.
export const supabase: SupabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'afi-auth-session',
    },
  }
);

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  accessToken: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (session: Session | null) => {
    if (session) {
      setUser(session.user as unknown as AuthUser);
      setAccessToken(session.access_token);
    } else {
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    // Restore session from localStorage on every page load.
    // getSession() returns the stored session and auto-refreshes if close to expiry.
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      setLoading(false);
    });

    // Keep state in sync with token refresh events, tab focus, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // 1. Hit our server's REST endpoint — uses correct Authorization + apikey headers.
    //    This is the reliable path that avoids any Supabase JS-client quirks.
    const result = await api.auth.signin(email, password);

    const sess = result.session as {
      access_token: string;
      refresh_token: string;
    };

    if (!sess?.access_token || !sess?.refresh_token) {
      throw new Error('Sign-in failed: server returned an invalid session.');
    }

    // 2. Feed the tokens into the Supabase JS client.
    //    setSession() does two things:
    //      a) Writes access_token + refresh_token to localStorage (key: afi-auth-session)
    //         so the session survives page reloads automatically.
    //      b) Starts the auto-refresh timer so the access token is renewed before
    //         it expires — user never needs to re-login.
    const { data, error } = await supabase.auth.setSession({
      access_token: sess.access_token,
      refresh_token: sess.refresh_token,
    });

    if (error) throw new Error(error.message);
    applySession(data.session);
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Create the user via admin API (auto-confirms email, stores profile in KV).
    await api.auth.signup(email, password, name);
    // Sign in immediately so the user lands on the dashboard without extra steps.
    await signIn(email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
