import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthorizedDomain: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_DOMAIN = '@contact2sale.com.br';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthorizedDomain = (email: string): boolean => {
    return email.toLowerCase().endsWith(AUTHORIZED_DOMAIN);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (!isAuthorizedDomain(session.user.email || '')) {
          supabase.auth.signOut();
          toast.error('Acesso negado: apenas emails @contact2sale.com.br são permitidos');
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session.user);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (!isAuthorizedDomain(session.user.email || '')) {
          supabase.auth.signOut();
          toast.error('Acesso negado: apenas emails @contact2sale.com.br são permitidos');
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session.user);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isAuthorizedDomain(email)) {
      return {
        error: 'Apenas emails @contact2sale.com.br são permitidos nesta plataforma',
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    if (!isAuthorizedDomain(email)) {
      return {
        error: 'Apenas emails @contact2sale.com.br são permitidos nesta plataforma',
      };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthorizedDomain,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
