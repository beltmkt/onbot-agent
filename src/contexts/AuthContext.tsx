import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestRegistration: (email: string) => Promise<void>;
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

  // Função para validar domínio do email
  const validateEmailDomain = (email: string): boolean => {
    return email.endsWith(AUTHORIZED_DOMAIN);
  };

  // Função de login
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Valida domínio antes de fazer a requisição
      if (!validateEmailDomain(email)) {
        throw new Error(`Apenas emails do domínio ${AUTHORIZED_DOMAIN} são permitidos`);
      }

      // Aqui você faria a chamada real à API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer login');
      }

      const data = await response.json();
      
      // Salva token e informações do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para solicitar registro
  const requestRegistration = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Valida domínio antes de fazer a requisição
      if (!validateEmailDomain(email)) {
        throw new Error(`Apenas emails do domínio ${AUTHORIZED_DOMAIN} podem solicitar registro`);
      }

      const response = await fetch(`${API_URL}/auth/register-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao solicitar registro');
      }

      const data = await response.json();
      console.log('Registration request successful:', data);
    } catch (error) {
      console.error('Registration request error:', error);
      throw error;
    } finally {
      setIsLoading(false);
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

  // Valor do contexto
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    requestRegistration,
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
  const validateEmailDomain = (email: string): boolean => {
    return email.endsWith(AUTHORIZED_DOMAIN);
  };

  const getDomainValidationMessage = (email: string): string => {
    if (!email) return '';
    if (!validateEmailDomain(email)) {
      return `Por favor, use um email do domínio ${AUTHORIZED_DOMAIN}`;
    }
    return '';
  };

  return {
    validateEmailDomain,
    getDomainValidationMessage,
    AUTHORIZED_DOMAIN,
  };
};