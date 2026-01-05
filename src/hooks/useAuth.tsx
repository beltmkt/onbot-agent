
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { auditService } from '../services/auditService';
import { C2S_USERS_DB } from '../data/c2sUsers';

interface AuthContextType {
  user: (User & { c2sId?: string }) | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestRegistration: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  isFallbackMode?: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  isAuthorizedDomain: (email: string) => boolean;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (data: { name?: string; phone?: string }) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>; // Adicionado
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_DOMAIN = '@c2sglobal.com';
const GOOGLE_HD_DOMAIN = 'c2sglobal.com'; // Domínio para queryParams do Google OAuth

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { c2sId?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const findC2sId = (email: string | undefined) => {
    if (!email) return undefined;
    const matchedUser = C2S_USERS_DB.find(u => u.email.toLowerCase() === email.toLowerCase());
    return matchedUser?.c2sId;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const c2sId = findC2sId(session.user.email);
          setUser({ ...session.user, c2sId });
        } else {
          setUser(null);
        }
        setIsLoading(false);

        if (_event === 'INITIAL_SESSION' && session?.user) {
          auditService.createLog({
            userEmail: session.user.email!,
            actionType: 'session_restored',
            status: 'success',
            metadata: { user_id: session.user.id }
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthorizedDomain = useCallback((email: any): boolean => {
    if (email === null || email === undefined) return false;
    if (typeof email !== 'string') return false;
    const trimmedEmail = email.trim();
    if (trimmedEmail === '') return false;
    try {
      return trimmedEmail.toLowerCase().endsWith(AUTHORIZED_DOMAIN.toLowerCase());
    } catch (error) {
      return false;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (!email || !password) {
      return { error: 'Email e senha são obrigatórios' };
    }

    if (!isAuthorizedDomain(email)) {
      await auditService.createLog({
        userEmail: email,
        actionType: 'login_attempt',
        status: 'error',
        metadata: { reason: 'unauthorized_domain' }
      });
      return { error: 'Acesso restrito apenas para contas corporativas (@c2sglobal.com)' };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { error: 'Email ou senha incorretos' };
      }

      if (data.user) {
        const c2sId = findC2sId(data.user.email);
        setUser({ ...data.user, c2sId });
        
        await auditService.createLog({
          userEmail: email,
          actionType: 'login',
          status: 'success',
          metadata: { user_id: data.user.id }
        });
        return {};
      } else {
        return { error: 'Erro inesperado durante o login' };
      }

    } catch (error: any) {
      return { error: 'Erro interno. Tente novamente mais tarde.' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorizedDomain]);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    if (!email || !password || !name) {
      return { error: 'Nome, email e senha são obrigatórios' };
    }

    if (!isAuthorizedDomain(email)) {
      return { error: 'Acesso restrito apenas para contas corporativas (@c2sglobal.com)' };
    }

    if (password.length < 6) {
      return { error: 'A senha deve ter pelo menos 6 caracteres' };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (error) {
        return { error: 'Este email já está cadastrado' };
      }

      if (data.user) {
        return {};
      } else {
        return { error: 'Erro inesperado durante o cadastro' };
      }

    } catch (error: any) {
      return { error: 'Erro interno. Tente novamente mais tarde.' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorizedDomain]);

  const login = async (email: string, password: string): Promise<void> => {
    const result = await signIn(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  const requestRegistration = async (email: string): Promise<void> => {
    const result = await signUp(email, Math.random().toString(36).slice(2, 12), 'Usuário');
    if (result.error) {
      throw new Error(result.error);
    }
  };

  const recoverPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!isAuthorizedDomain(email)) {
      return {
        success: false,
        message: 'Acesso restrito apenas para contas corporativas (@c2sglobal.com)'
      };
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          message: 'Erro ao enviar email de recuperação'
        };
      }

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso. Verifique sua caixa de entrada.'
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Erro interno. Tente novamente mais tarde.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (_token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'A nova senha deve ter pelo menos 6 caracteres'
      };
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          message: 'Erro ao redefinir senha'
        };
      }

      return {
        success: true,
        message: 'Senha redefinida com sucesso! Você já pode fazer login.'
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Erro interno. Tente novamente mais tarde.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (data: { name?: string; phone?: string }): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.updateUser({ data });
    if (error) {
      return { error: error.message };
    }
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if(updatedUser) {
        const c2sId = findC2sId(updatedUser.email);
        setUser({ ...updatedUser, c2sId });
    }
    return {};
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (newPassword.length < 6) {
      return { error: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  // Nova função para login com Google
  const signInWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: GOOGLE_HD_DOMAIN, // Restringe ao domínio corporativo
          },
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        return { error: error.message };
      }

      // Supabase trata o redirecionamento automaticamente
      return {};

    } catch (error: any) {
      console.error('Unexpected error signing in with Google:', error);
      return { error: 'Erro inesperado ao tentar logar com o Google.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    requestRegistration,
    signIn,
    signUp,
    isAuthorizedDomain,
    recoverPassword,
    resetPassword,
    updateUser,
    updatePassword,
    signInWithGoogle, // Adicionado
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
