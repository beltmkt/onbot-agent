import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { auditService } from '../services/auditService';
import { C2S_USERS_DB } from '../data/c2sUsers';

interface AuthUser extends User {
  c2sId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestRegistration: (email: string) => Promise<void>;

  // Funções específicas para o Login.tsx
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  isFallbackMode?: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  isAuthorizedDomain: (email: string) => boolean;

  // Funções adicionais
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (data: { name?: string; phone?: string }) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_DOMAIN = '@c2sglobal.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginTime, setLoginTime] = useState<number | null>(null);

  const isAuthorizedDomain = useCallback((email: any): boolean => {
    if (email === null || email === undefined) {
      console.warn('Email é null ou undefined');
      return false;
    }
    if (typeof email !== 'string') {
      console.warn('Email não é uma string:', typeof email, email);
      return false;
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail === '') {
      return false;
    }
    try {
      const emailLower = trimmedEmail.toLowerCase();
      const domainLower = AUTHORIZED_DOMAIN.toLowerCase();
      return emailLower.endsWith(domainLower);
    } catch (error) {
      console.error('Error in isAuthorizedDomain:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (user && loginTime) {
      const duration = Math.round((Date.now() - loginTime) / 1000);
      await auditService.createLog({
        userEmail: user.email!,
        actionType: 'CHECK_OUT',
        status: 'success',
        metadata: { user_id: user.id, name: user.user_metadata.name },
        duration_seconds: duration,
      });
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [user, loginTime]);

  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        logout();
      }
    };
    const intervalId = setInterval(checkMidnight, 60000); 

    return () => clearInterval(intervalId);
  }, [logout]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isNewLogin = !user && session?.user;

      if (_event === 'SIGNED_IN' && session?.user) {
        if (!isAuthorizedDomain(session.user.email)) {
          supabase.auth.signOut();
          setUser(null);
          return;
        }

        setUser(session.user);
        
        if (isNewLogin) {
          setLoginTime(Date.now());
          auditService.createLog({
            userEmail: session.user.email!,
            actionType: 'CHECK_IN',
            status: 'success',
            metadata: {
              user_id: session.user.id,
              name: session.user.user_metadata.name,
              provider: session?.user?.app_metadata?.provider || 'email',
            },
          });
        }
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
      } else if (_event === 'INITIAL_SESSION' && session?.user) {
        setUser(session.user)
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthorizedDomain, user]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('signIn chamado com:', { email });

    if (!email || !password) {
      await auditService.createLog({
        userEmail: email,
        actionType: 'login_attempt',
        status: 'error',
        metadata: { reason: 'missing_credentials' }
      });
      return { error: 'Email e senha são obrigatórios' };
    }

    if (!isAuthorizedDomain(email)) {
      await auditService.createLog({
        userEmail: email,
        actionType: 'login_attempt',
        status: 'error',
        metadata: { reason: 'unauthorized_domain' }
      });
      return { error: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos` };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          await auditService.createLog({
            userEmail: email,
            actionType: 'login_attempt',
            status: 'error',
            metadata: { reason: 'invalid_credentials' }
          });
          return { error: 'Email ou senha incorretos' };
        } else if (error.message.includes('Email not confirmed')) {
          await auditService.createLog({
            userEmail: email,
            actionType: 'login_attempt',
            status: 'error',
            metadata: { reason: 'email_not_confirmed' }
          });
          return { error: 'Email não confirmado. Verifique sua caixa de entrada.' };
        } else {
          await auditService.createLog({
            userEmail: email,
            actionType: 'login_attempt',
            status: 'error',
            metadata: { reason: error.message }
          });
          return { error: error.message || 'Erro ao fazer login' };
        }
      }

      if (data.user) {
        setUser(data.user);
        setLoginTime(Date.now());
        return {}; // Sucesso
      } else {
        await auditService.createLog({
          userEmail: email,
          actionType: 'login_attempt',
          status: 'error',
          metadata: { reason: 'unexpected_error' }
        });
        return { error: 'Erro inesperado durante o login' };
      }

    } catch (error: any) {
      console.error('Login error:', error);
      await auditService.createLog({
        userEmail: email,
        actionType: 'login_attempt',
        status: 'error',
        metadata: { reason: 'internal_error', error: error.message }
      });
      return { error: 'Erro interno. Tente novamente mais tarde.' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorizedDomain]);

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            hd: 'c2sglobal.com',
          },
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        return { error: error.message || 'Erro ao fazer login com Google' };
      }

      return {};
    } catch (error: any) {
      console.error('Google sign in error:', error);
      return { error: 'Erro interno. Tente novamente mais tarde.' };
    }
  };

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    console.log('signUp chamado com:', { email, name });

    if (!email || !password || !name) {
      return { error: 'Nome, email e senha são obrigatórios' };
    }

    if (!isAuthorizedDomain(email)) {
      return { error: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos` };
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
        console.error('Supabase sign up error:', error);
        if (error.message.includes('User already registered')) {
          return { error: 'Este email já está cadastrado' };
        } else {
          return { error: error.message || 'Erro ao criar conta' };
        }
      }

      if (data.user) {
        return {};
      } else {
        return { error: 'Erro inesperado durante o cadastro' };
      }

    } catch (error: any) {
      console.error('SignUp error:', error);
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
        message: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos`
      };
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Supabase reset password error:', error);
        return {
          success: false,
          message: error.message || 'Erro ao enviar email de recuperação'
        };
      }

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso. Verifique sua caixa de entrada.'
      };

    } catch (error: any) {
      console.error('Recover password error:', error);
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
        console.error('Supabase update password error:', error);
        return {
          success: false,
          message: error.message || 'Erro ao redefinir senha'
        };
      }

      return {
        success: true,
        message: 'Senha redefinida com sucesso! Você já pode fazer login.'
      };

    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente mais tarde.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: { name?: string; phone?: string }): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.updateUser({ data });
    if (error) {
      console.error("Error updating user:", error);
      return { error: error.message };
    }
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    return {};
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (newPassword.length < 6) {
      return { error: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Error updating password:", error);
      return { error: error.message };
    }
    return {};
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    requestRegistration,
    signIn,
    signInWithGoogle,
    signUp,
    isAuthorizedDomain,
    recoverPassword,
    resetPassword,
    updateUser,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook useAuth
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};