import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

import { auditService } from '../services/auditService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestRegistration: (email: string) => Promise<void>;

  // Funções específicas para o Login.tsx
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  isFallbackMode?: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  isAuthorizedDomain: (email: string) => boolean;

  // Funções adicionais
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_DOMAIN = '@c2sglobal.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicialização - Verifica sessão do Supabase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Obtém sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Função de validação de domínio SEGURA
  const isAuthorizedDomain = useCallback((email: any): boolean => {
    // Verificação completa de tipo
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
      // Converte para minúsculas e verifica o domínio
      const emailLower = trimmedEmail.toLowerCase();
      const domainLower = AUTHORIZED_DOMAIN.toLowerCase();

      return emailLower.endsWith(domainLower);
    } catch (error) {
      console.error('Error in isAuthorizedDomain:', error);
      return false;
    }
  }, []);

  // Função signIn (login com Supabase)
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('signIn chamado com:', { email });

    // Validação básica
    if (!email || !password) {
      await auditService.createLog({
        userEmail: email,
        actionType: 'login_attempt',
        status: 'error',
        metadata: { reason: 'missing_credentials' }
      });
      return { error: 'Email e senha são obrigatórios' };
    }

    // Valida domínio
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

        // Trata erros específicos do Supabase
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
        await auditService.createLog({
          userEmail: email,
          actionType: 'login',
          status: 'success',
          metadata: { user_id: data.user.id }
        });
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

  // Função signUp (cadastro com Supabase)
  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    console.log('signUp chamado com:', { email, name });

    // Validação básica
    if (!email || !password || !name) {
      return { error: 'Nome, email e senha são obrigatórios' };
    }

    // Valida domínio
    if (!isAuthorizedDomain(email)) {
      return { error: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos` };
    }

    // Valida força da senha
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

        // Trata erros específicos
        if (error.message.includes('User already registered')) {
          return { error: 'Este email já está cadastrado' };
        } else {
          return { error: error.message || 'Erro ao criar conta' };
        }
      }

      if (data.user) {
        // Usuário criado com sucesso, mas precisa confirmar email
        return {}; // Sucesso - usuário será redirecionado após confirmação
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

  // Função login (mantida para compatibilidade)
  const login = async (email: string, password: string): Promise<void> => {
    const result = await signIn(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  // Função requestRegistration (mantida para compatibilidade)
  const requestRegistration = async (email: string): Promise<void> => {
    const result = await signUp(email, Math.random().toString(36).slice(2, 12), 'Usuário'); // Senha temporária
    if (result.error) {
      throw new Error(result.error);
    }
  };

  // Função de recuperação de senha (Supabase)
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

  // Função para resetar senha (Supabase)
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

  // Função de logout
  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      // O listener onAuthStateChange cuidará de limpar o estado do usuário
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && isInitialized,
    isLoading,
    requestRegistration,
    signIn,
    signUp,
    isAuthorizedDomain,
    recoverPassword,
    resetPassword,
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