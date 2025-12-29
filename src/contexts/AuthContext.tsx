import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  // Mantenha as funções originais
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestRegistration: (email: string) => Promise<void>;
  
  // ADICIONE ESTAS FUNÇÕES QUE O Login.tsx PRECISA
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  isAuthorizedDomain: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTHORIZED_DOMAIN = '@c2sglobal.com';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se há usuário salvo no localStorage ao carregar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  // ADICIONE ESTA FUNÇÃO (renomeada para isAuthorizedDomain)
  const isAuthorizedDomain = useCallback((email: string): boolean => {
    if (!email || typeof email !== 'string') {
      return false;
    }
    return email.toLowerCase().endsWith(AUTHORIZED_DOMAIN);
  }, []);

  // Função para validar domínio do email (mantida para compatibilidade)
  const validateEmailDomain = (email: string): boolean => {
    return isAuthorizedDomain(email);
  };

  // ADICIONE ESTA FUNÇÃO signIn (compatível com Login.tsx)
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isAuthorizedDomain(email)) {
        return { error: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos` };
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Erro ao fazer login' };
      }

      const data = await response.json();
      
      // Salva token e informações do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      return {};
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { error: error.message || 'Erro de conexão' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorizedDomain]);

  // ADICIONE ESTA FUNÇÃO signUp (compatível com Login.tsx)
  const signUp = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isAuthorizedDomain(email)) {
        return { error: `Apenas emails do domínio ${AUTHORIZED_DOMAIN} podem solicitar registro` };
      }

      const name = email.split('@')[0]; // Usa parte do email como nome
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Erro ao registrar' };
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      return {};
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { error: error.message || 'Erro de conexão' };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorizedDomain]);

  // Mantenha a função login original (pode ser um wrapper da signIn)
  const login = async (email: string, password: string): Promise<void> => {
    const result = await signIn(email, password);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  // Mantenha a função requestRegistration (pode usar signUp internamente)
  const requestRegistration = async (email: string): Promise<void> => {
    const result = await signUp(email, Math.random().toString(36).slice(2, 10)); // Senha temporária
    if (result.error) {
      throw new Error(result.error);
    }
  };

  // Função de logout
  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Redirecionar para a página de login se necessário
    window.location.href = '/login';
  };

  // Verifica token expirado periodicamente
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decodifica o token JWT (simplificado)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = payload.exp * 1000; // Convertendo para milissegundos
          
          if (Date.now() > expirationTime) {
            logout();
          }
        } catch (error) {
          console.error('Error checking token expiration:', error);
          logout();
        }
      }
    };

    // Verifica a cada minuto
    const interval = setInterval(checkTokenExpiration, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Valor do contexto - ADICIONE AS NOVAS FUNÇÕES
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    requestRegistration,
    // Adicione estas novas funções
    signIn,
    signUp,
    isAuthorizedDomain,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook para validar email (pode ser usado em outros componentes)
export const useEmailValidation = () => {
  const { isAuthorizedDomain } = useAuth();
  
  const getDomainValidationMessage = (email: string): string => {
    if (!email) return '';
    if (!isAuthorizedDomain(email)) {
      return `Por favor, use um email do domínio ${AUTHORIZED_DOMAIN}`;
    }
    return '';
  };

  return {
    validateEmailDomain: isAuthorizedDomain,
    getDomainValidationMessage,
    AUTHORIZED_DOMAIN,
  };
};