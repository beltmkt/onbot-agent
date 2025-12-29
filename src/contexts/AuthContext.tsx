import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestRegistration: (email: string) => Promise<void>;
  
  // Funções específicas para o Login.tsx
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  isAuthorizedDomain: (email: string) => boolean;
  
  // Funções adicionais
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_DOMAIN = '@c2sglobal.com';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicialização - Verifica se há usuário salvo
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Verifica se o token é válido
            const isValid = await validateToken(token);
            if (isValid) {
              setUser(parsedUser);
            } else {
              // Token inválido ou expirado
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Validação de token
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

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

  // Função signIn (requerida pelo Login.tsx)
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('signIn chamado com:', { email });
    
    // Validação básica
    if (!email || !password) {
      return { error: 'Email e senha são obrigatórios' };
    }
    
    // Valida domínio
    if (!isAuthorizedDomain(email)) {
      return { error: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos` };
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          error: data.message || data.error || 'Erro ao fazer login. Verifique suas credenciais.' 
        };
      }
      
      // Login bem-sucedido
      const authData: AuthResponse = data;
      
      // Salva no localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      // Atualiza estado
      setUser(authData.user);
      
      return {}; // Sucesso
      
    } catch (error: any) {
      console.error('Login API error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
      }
      
      return { error: 'Erro interno do servidor. Tente novamente mais tarde.' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorizedDomain]);

  // Função signUp (requerida pelo Login.tsx)
  const signUp = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('signUp chamado com:', { email });
    
    // Validação básica
    if (!email || !password) {
      return { error: 'Email e senha são obrigatórios' };
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
      // Extrai nome do email (parte antes do @)
      const name = email.split('@')[0] || 'Usuário';
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password,
          name
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          error: data.message || data.error || 'Erro ao criar conta. Tente novamente.' 
        };
      }
      
      // Registro bem-sucedido
      return {}; // Sucesso
      
    } catch (error: any) {
      console.error('SignUp API error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
      }
      
      return { error: 'Erro interno do servidor. Tente novamente mais tarde.' };
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
    const result = await signUp(email, Math.random().toString(36).slice(2, 12)); // Senha temporária
    if (result.error) {
      throw new Error(result.error);
    }
  };

  // Função de recuperação de senha
  const recoverPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (!isAuthorizedDomain(email)) {
      return { 
        success: false, 
        message: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos` 
      };
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/recover-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || data.error || 'Erro ao solicitar recuperação de senha' 
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
        message: 'Erro de conexão. Tente novamente mais tarde.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para resetar senha
  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (newPassword.length < 6) {
      return { 
        success: false, 
        message: 'A nova senha deve ter pelo menos 6 caracteres' 
      };
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || data.error || 'Erro ao redefinir senha' 
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
        message: 'Erro de conexão. Tente novamente mais tarde.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = (): void => {
    // Limpa localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpa estado
    setUser(null);
    
    // Redireciona para login
    window.location.href = '/login';
  };

  // Monitora expiração do token
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      
      if (token && user) {
        try {
          // Decodifica JWT (parte do payload)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = payload.exp * 1000;
          
          if (Date.now() > expirationTime - 30000) { // 30 segundos antes de expirar
            console.log('Token expirando, renovando...');
            // Aqui você pode implementar renovação automática do token
          }
        } catch (error) {
          console.error('Error checking token:', error);
        }
      }
    };

    const interval = setInterval(checkTokenExpiration, 30000); // Verifica a cada 30 segundos
    
    return () => clearInterval(interval);
  }, [user]);

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

// Hook para validação de email (opcional, para outros componentes)
export const useEmailValidation = () => {
  const { isAuthorizedDomain } = useAuth();
  
  const validateEmailWithMessage = (email: string): { isValid: boolean; message: string } => {
    if (!email || email.trim() === '') {
      return { isValid: false, message: 'Email é obrigatório' };
    }
    
    if (!isAuthorizedDomain(email)) {
      return { 
        isValid: false, 
        message: `Use um email com domínio ${AUTHORIZED_DOMAIN}` 
      };
    }
    
    // Validação de formato básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Formato de email inválido' };
    }
    
    return { isValid: true, message: '' };
  };

  return {
    validateEmailDomain: isAuthorizedDomain,
    validateEmailWithMessage,
    AUTHORIZED_DOMAIN,
  };
};

// Hook para verificar permissões (opcional)
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => user?.role === role);
  };
  
  return {
    hasRole,
    hasAnyRole,
    userRole: user?.role,
  };
};