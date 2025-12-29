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
};/* Tema escuro completo para Login */

:root {
  --bg-dark: #121212;
  --bg-card: #1e1e1e;
  --bg-input: #2d2d2d;
  --bg-input-focus: #3d3d3d;
  --bg-button: #3a86ff;
  --bg-button-hover: #2a76ef;
  --bg-button-disabled: #555555;
  --bg-register: #2ed573;
  --bg-register-hover: #28b463;
  --bg-forgot: transparent;
  --bg-forgot-hover: rgba(58, 134, 255, 0.1);
  
  --border-color: #404040;
  --border-focus: #3a86ff;
  --border-error: #ff4757;
  --border-success: #2ed573;
  
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #888888;
  --text-error: #ff4757;
  --text-success: #2ed573;
  --text-warning: #ffa502;
  --text-required: #ff6b6b;
  
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-button: 0 2px 8px rgba(58, 134, 255, 0.3);
  --shadow-input: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
  
  --border-radius: 8px;
  --border-radius-button: 6px;
}

/* Container principal */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-dark) 0%, #1a1a1a 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Formulário principal */
.login-form {
  background: var(--bg-card);
  border-radius: var(--border-radius);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  transition: var(--transition-normal);
}

.login-form:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Cabeçalho do formulário */
.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.domain-info {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  font-weight: 500;
}

/* Grupos de formulário */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.required {
  color: var(--text-required);
  margin-left: 4px;
}

/* Inputs */
.login-form input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 16px;
  transition: var(--transition-fast);
  box-sizing: border-box;
}

.login-form input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-input-focus);
  box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.1);
}

.login-form input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-form input::placeholder {
  color: var(--text-muted);
}

.login-form input.invalid {
  border-color: var(--border-error);
  background: rgba(255, 71, 87, 0.05);
}

/* Aviso de domínio */
.domain-warning {
  display: flex;
  align-items: center;
  margin-top: 8px;
  color: var(--text-warning);
  font-size: 14px;
  font-weight: 500;
}

.domain-warning span {
  margin-right: 6px;
  font-size: 16px;
}

/* Mensagens */
.message {
  padding: 12px 16px;
  border-radius: var(--border-radius);
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.message.error {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid var(--border-error);
  color: var(--text-error);
}

.message.success {
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid var(--border-success);
  color: var(--text-success);
}

/* Ações do formulário */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

/* Botões */
.login-form button {
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius-button);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.login-form button:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.login-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Botão de login */
.login-button {
  background: var(--bg-button);
  color: white;
  box-shadow: var(--shadow-button);
}

.login-button:hover:not(:disabled) {
  background: var(--bg-button-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(58, 134, 255, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Botão de registro */
.register-button {
  background: var(--bg-register);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 213, 115, 0.3);
}

.register-button:hover:not(:disabled) {
  background: var(--bg-register-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 213, 115, 0.4);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Botão de recuperação de senha */
.forgot-password-button {
  background: var(--bg-forgot);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}

.forgot-password-button:hover:not(:disabled) {
  background: var(--bg-forgot-hover);
  color: var(--text-primary);
  border-color: var(--border-focus);
}

/* Spinner de loading */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Rodapé do formulário */
.form-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.info-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

/* Responsividade */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-form {
    padding: 24px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-actions {
    gap: 8px;
  }
  
  .login-form button {
    padding: 14px 20px;
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .login-form {
    padding: 20px;
  }
  
  .form-header h2 {
    font-size: 22px;
  }
  
  .login-form input {
    padding: 14px 16px;
  }
}

/* Acessibilidade */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --bg-card: #000000;
    --bg-input: #000000;
    --border-color: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #ffffff;
  }
}

/* Focus visible para navegação por teclado */
.login-form button:focus-visible,
.login-form input:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}/* Tema escuro completo para Login */

:root {
  --bg-dark: #121212;
  --bg-card: #1e1e1e;
  --bg-input: #2d2d2d;
  --bg-input-focus: #3d3d3d;
  --bg-button: #3a86ff;
  --bg-button-hover: #2a76ef;
  --bg-button-disabled: #555555;
  --bg-register: #2ed573;
  --bg-register-hover: #28b463;
  --bg-forgot: transparent;
  --bg-forgot-hover: rgba(58, 134, 255, 0.1);
  
  --border-color: #404040;
  --border-focus: #3a86ff;
  --border-error: #ff4757;
  --border-success: #2ed573;
  
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #888888;
  --text-error: #ff4757;
  --text-success: #2ed573;
  --text-warning: #ffa502;
  --text-required: #ff6b6b;
  
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-button: 0 2px 8px rgba(58, 134, 255, 0.3);
  --shadow-input: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
  
  --border-radius: 8px;
  --border-radius-button: 6px;
}

/* Container principal */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-dark) 0%, #1a1a1a 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Formulário principal */
.login-form {
  background: var(--bg-card);
  border-radius: var(--border-radius);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  transition: var(--transition-normal);
}

.login-form:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Cabeçalho do formulário */
.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.domain-info {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  font-weight: 500;
}

/* Grupos de formulário */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.required {
  color: var(--text-required);
  margin-left: 4px;
}

/* Inputs */
.login-form input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 16px;
  transition: var(--transition-fast);
  box-sizing: border-box;
}

.login-form input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-input-focus);
  box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.1);
}

.login-form input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-form input::placeholder {
  color: var(--text-muted);
}

.login-form input.invalid {
  border-color: var(--border-error);
  background: rgba(255, 71, 87, 0.05);
}

/* Aviso de domínio */
.domain-warning {
  display: flex;
  align-items: center;
  margin-top: 8px;
  color: var(--text-warning);
  font-size: 14px;
  font-weight: 500;
}

.domain-warning span {
  margin-right: 6px;
  font-size: 16px;
}

/* Mensagens */
.message {
  padding: 12px 16px;
  border-radius: var(--border-radius);
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.message.error {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid var(--border-error);
  color: var(--text-error);
}

.message.success {
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid var(--border-success);
  color: var(--text-success);
}

/* Ações do formulário */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

/* Botões */
.login-form button {
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius-button);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.login-form button:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.login-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Botão de login */
.login-button {
  background: var(--bg-button);
  color: white;
  box-shadow: var(--shadow-button);
}

.login-button:hover:not(:disabled) {
  background: var(--bg-button-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(58, 134, 255, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Botão de registro */
.register-button {
  background: var(--bg-register);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 213, 115, 0.3);
}

.register-button:hover:not(:disabled) {
  background: var(--bg-register-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 213, 115, 0.4);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Botão de recuperação de senha */
.forgot-password-button {
  background: var(--bg-forgot);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}

.forgot-password-button:hover:not(:disabled) {
  background: var(--bg-forgot-hover);
  color: var(--text-primary);
  border-color: var(--border-focus);
}

/* Spinner de loading */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Rodapé do formulário */
.form-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.info-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

/* Responsividade */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-form {
    padding: 24px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-actions {
    gap: 8px;
  }
  
  .login-form button {
    padding: 14px 20px;
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .login-form {
    padding: 20px;
  }
  
  .form-header h2 {
    font-size: 22px;
  }
  
  .login-form input {
    padding: 14px 16px;
  }
}

/* Acessibilidade */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;    import React, { useState, useEffect } from 'react';
    import { useAuth } from '../contexts/AuthContext';
    import './Login.css'; // Importe o CSS
    
    interface LoginFormData {
      email: string;
      password: string;
    }
    
    const ALLOWED_DOMAIN = '@c2sglobal.com';
    
    export const Login: React.FC = () => {
      const { signIn, signUp, isAuthorizedDomain, recoverPassword } = useAuth();
      const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
      });
      const [error, setError] = useState<string>('');
      const [showRegisterOption, setShowRegisterOption] = useState<boolean>(false);
      const [isRegistering, setIsRegistering] = useState<boolean>(false);
      const [isLoading, setIsLoading] = useState<boolean>(false);
      const [isRecovering, setIsRecovering] = useState<boolean>(false);
    
      // Debug: log quando o componente monta
      useEffect(() => {
        console.log('Login component mounted');
        console.log('isAuthorizedDomain function exists:', typeof isAuthorizedDomain === 'function');
      }, []);
    
      // Função de validação com debug
      const validateEmail = (email: string): boolean => {
        console.log('Validando email:', email);
        
        if (!email || typeof email !== 'string') {
          console.log('Email inválido ou não é string');
          return false;
        }
        
        if (isAuthorizedDomain) {
          try {
            const result = isAuthorizedDomain(email);
            console.log('Resultado de isAuthorizedDomain:', result);
            return result;
          } catch (err) {
            console.error('Erro em isAuthorizedDomain:', err);
            return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
          }
        }
        
        return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
      };
    
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log(`Campo ${name} alterado para:`, value);
        
        const newFormData = {
          ...formData,
          [name]: value,
        };
    
        setFormData(newFormData);
        setError('');
    
        if (name === 'email') {
          const isValid = validateEmail(value);
          console.log('Email válido?', isValid);
          setShowRegisterOption(isValid);
        }
      };
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Tentando login com:', formData.email);
    
        if (!formData.email || !formData.password) {
          setError('Por favor, preencha todos os campos');
          return;
        }
    
        const emailValid = validateEmail(formData.email);
        console.log('Validação final do email:', emailValid);
        
        if (!emailValid) {
          setError(`Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`);
          return;
        }
    
        setIsLoading(true);
        setError('');
    
        try {
          console.log('Chamando signIn...');
          const res = await signIn(formData.email, formData.password);
          console.log('Resposta do signIn:', res);
          
          if (res.error) {
            setError(res.error);
            if (
              res.error.toLowerCase().includes('não encontrado') || 
              res.error.toLowerCase().includes('not found') ||
              res.error.toLowerCase().includes('usuário não existe')
            ) {
              setShowRegisterOption(true);
            }
          }
        } catch (err: any) {
          console.error('Erro no catch do login:', err);
          setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally {
          setIsLoading(false);
        }
      };
    
      const handleRegisterRequest = async () => {
        console.log('Solicitando registro para:', formData.email);
        
        if (!validateEmail(formData.email)) {
          setError(`Para registrar, use um email ${ALLOWED_DOMAIN}`);
          return;
        }
    
        setIsRegistering(true);
        setError('');
    
        try {
          console.log('Chamando signUp...');
          const res = await signUp(formData.email, formData.password);
          console.log('Resposta do signUp:', res);
          
          if (res.error) {
            setError(res.error);
          } else {
            setError('✅ Solicitação de registro enviada! Verifique seu email para confirmar.');
            setShowRegisterOption(false);
          }
        } catch (err: any) {
          console.error('Erro no catch do registro:', err);
          setError(err instanceof Error ? err.message : 'Erro ao solicitar registro');
        } finally {
          setIsRegistering(false);
        }
      };
    
      const handleForgotPassword = async () => {
        if (!validateEmail(formData.email)) {
          setError('Digite um email válido para recuperar a senha');
          return;
        }
    
        setIsRecovering(true);
        setError('');
    
        try {
          const res = await recoverPassword(formData.email);
          if (res.success) {
            setError('📧 ' + res.message);
          } else {
            setError(res.message);
          }
        } catch (err: any) {
          console.error('Erro na recuperação de senha:', err);
          setError('Erro ao solicitar recuperação de senha');
        } finally {
          setIsRecovering(false);
        }
      };
    
      return (
        <div className="login-container">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-header">
              <h2>Acesso Restrito</h2>
              <p className="domain-info">
                <strong>Domínio permitido:</strong> {ALLOWED_DOMAIN}
              </p>
            </div>
    
            <div className="form-group">
              <label htmlFor="email">
                Email {ALLOWED_DOMAIN}
                <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading || isRegistering || isRecovering}
                placeholder={`seu.nome${ALLOWED_DOMAIN}`}
                className={formData.email && !validateEmail(formData.email) ? 'invalid' : ''}
              />
              {formData.email && !validateEmail(formData.email) && (
                <div className="domain-warning">
                  <span>⚠️</span> Use um email {ALLOWED_DOMAIN}
                </div>
              )}
            </div>
    
            <div className="form-group">
              <label htmlFor="password">
                Senha
                <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading || isRegistering || isRecovering}
                placeholder="Digite sua senha"
              />
            </div>
    
            {error && (
              <div className={`message ${error.startsWith('✅') || error.startsWith('📧') ? 'success' : 'error'}`}>
                {error}
              </div>
            )}
    
            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading || isRegistering || isRecovering || !validateEmail(formData.email)}
                className="login-button"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
    
              {showRegisterOption && (
                <button
                  type="button"
                  onClick={handleRegisterRequest}
                  disabled={isLoading || isRegistering || isRecovering || !validateEmail(formData.email)}
                  className="register-button"
                >
                  {isRegistering ? (
                    <>
                      <span className="loading-spinner"></span>
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Cadastro'
                  )}
                </button>
              )}
            </div>
    
            <div className="form-footer">
              <p className="info-text">
                Apenas colaboradores com email {ALLOWED_DOMAIN} podem acessar o sistema. 
                Novo usuário? Solicite registro acima.
              </p>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isRecovering}
                className="forgot-password-button"
              >
                {isRecovering ? (
                  <>
                    <span className="loading-spinner"></span>
                    Enviando...
                  </>
                ) : (
                  'Esqueceu sua senha?'
                )}
              </button>
            </div>
          </form>
        </div>
      );
    };
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --bg-card: #000000;
    --bg-input: #000000;
    --border-color: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #ffffff;
  }
}

/* Focus visible para navegação por teclado */
.login-form button:focus-visible,
.login-form input:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}/* Tema escuro completo para Login */

:root {
  --bg-dark: #121212;
  --bg-card: #1e1e1e;
  --bg-input: #2d2d2d;
  --bg-input-focus: #3d3d3d;
  --bg-button: #3a86ff;
  --bg-button-hover: #2a76ef;
  --bg-button-disabled: #555555;
  --bg-register: #2ed573;
  --bg-register-hover: #28b463;
  --bg-forgot: transparent;
  --bg-forgot-hover: rgba(58, 134, 255, 0.1);
  
  --border-color: #404040;
  --border-focus: #3a86ff;
  --border-error: #ff4757;
  --border-success: #2ed573;
  
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #888888;
  --text-error: #ff4757;
  --text-success: #2ed573;
  --text-warning: #ffa502;
  --text-required: #ff6b6b;
  
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-button: 0 2px 8px rgba(58, 134, 255, 0.3);
  --shadow-input: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
  
  --border-radius: 8px;
  --border-radius-button: 6px;
}

/* Container principal */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-dark) 0%, #1a1a1a 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Formulário principal */
.login-form {
  background: var(--bg-card);
  border-radius: var(--border-radius);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  transition: var(--transition-normal);
}

.login-form:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Cabeçalho do formulário */
.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.domain-info {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  font-weight: 500;
}

/* Grupos de formulário */
.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.required {
  color: var(--text-required);
  margin-left: 4px;
}

/* Inputs */
.login-form input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 16px;
  transition: var(--transition-fast);
  box-sizing: border-box;
}

.login-form input:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-input-focus);
  box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.1);
}

.login-form input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-form input::placeholder {
  color: var(--text-muted);
}

.login-form input.invalid {
  border-color: var(--border-error);
  background: rgba(255, 71, 87, 0.05);
}

/* Aviso de domínio */
.domain-warning {
  display: flex;
  align-items: center;
  margin-top: 8px;
  color: var(--text-warning);
  font-size: 14px;
  font-weight: 500;
}

.domain-warning span {
  margin-right: 6px;
  font-size: 16px;
}

/* Mensagens */
.message {
  padding: 12px 16px;
  border-radius: var(--border-radius);
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-fast);
}

.message.error {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid var(--border-error);
  color: var(--text-error);
}

.message.success {
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid var(--border-success);
  color: var(--text-success);
}

/* Ações do formulário */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

/* Botões */
.login-form button {
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius-button);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.login-form button:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.login-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Botão de login */
.login-button {
  background: var(--bg-button);
  color: white;
  box-shadow: var(--shadow-button);
}

.login-button:hover:not(:disabled) {
  background: var(--bg-button-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(58, 134, 255, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Botão de registro */
.register-button {
  background: var(--bg-register);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 213, 115, 0.3);
}

.register-button:hover:not(:disabled) {
  background: var(--bg-register-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 213, 115, 0.4);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

/* Botão de recuperação de senha */
.forgot-password-button {
  background: var(--bg-forgot);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}

.forgot-password-button:hover:not(:disabled) {
  background: var(--bg-forgot-hover);
  color: var(--text-primary);
  border-color: var(--border-focus);
}

/* Spinner de loading */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Rodapé do formulário */
.form-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.info-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

/* Responsividade */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-form {
    padding: 24px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-actions {
    gap: 8px;
  }
  
  .login-form button {
    padding: 14px 20px;
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .login-form {
    padding: 20px;
  }
  
  .form-header h2 {
    font-size: 22px;
  }
  
  .login-form input {
    padding: 14px 16px;
  }
}

/* Acessibilidade */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --bg-card: #000000;
    --bg-input: #000000;
    --border-color: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #ffffff;
  }
}

/* Focus visible para navegação por teclado */
.login-form button:focus-visible,
.login-form input:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Importe o CSS

interface LoginFormData {
  email: string;
  password: string;
}

const ALLOWED_DOMAIN = '@c2sglobal.com';

export const Login: React.FC = () => {
  const { signIn, signUp, isAuthorizedDomain, recoverPassword } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [showRegisterOption, setShowRegisterOption] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Debug: log quando o componente monta
  useEffect(() => {
    console.log('Login component mounted');
    console.log('isAuthorizedDomain function exists:', typeof isAuthorizedDomain === 'function');
  }, []);

  // Função de validação com debug
  const validateEmail = (email: string): boolean => {
    console.log('Validando email:', email);
    
    if (!email || typeof email !== 'string') {
      console.log('Email inválido ou não é string');
      return false;
    }
    
    if (isAuthorizedDomain) {
      try {
        const result = isAuthorizedDomain(email);
        console.log('Resultado de isAuthorizedDomain:', result);
        return result;
      } catch (err) {
        console.error('Erro em isAuthorizedDomain:', err);
        return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
      }
    }
    
    return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Campo ${name} alterado para:`, value);
    
    const newFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(newFormData);
    setError('');

    if (name === 'email') {
      const isValid = validateEmail(value);
      console.log('Email válido?', isValid);
      setShowRegisterOption(isValid);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tentando login com:', formData.email);

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const emailValid = validateEmail(formData.email);
    console.log('Validação final do email:', emailValid);
    
    if (!emailValid) {
      setError(`Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Chamando signIn...');
      const res = await signIn(formData.email, formData.password);
      console.log('Resposta do signIn:', res);
      
      if (res.error) {
        setError(res.error);
        if (
          res.error.toLowerCase().includes('não encontrado') || 
          res.error.toLowerCase().includes('not found') ||
          res.error.toLowerCase().includes('usuário não existe')
        ) {
          setShowRegisterOption(true);
        }
      }
    } catch (err: any) {
      console.error('Erro no catch do login:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRequest = async () => {
    console.log('Solicitando registro para:', formData.email);
    
    if (!validateEmail(formData.email)) {
      setError(`Para registrar, use um email ${ALLOWED_DOMAIN}`);
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      console.log('Chamando signUp...');
      const res = await signUp(formData.email, formData.password);
      console.log('Resposta do signUp:', res);
      
      if (res.error) {
        setError(res.error);
      } else {
        setError('✅ Solicitação de registro enviada! Verifique seu email para confirmar.');
        setShowRegisterOption(false);
      }
    } catch (err: any) {
      console.error('Erro no catch do registro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao solicitar registro');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(formData.email)) {
      setError('Digite um email válido para recuperar a senha');
      return;
    }

    setIsRecovering(true);
    setError('');

    try {
      const res = await recoverPassword(formData.email);
      if (res.success) {
        setError('📧 ' + res.message);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      console.error('Erro na recuperação de senha:', err);
      setError('Erro ao solicitar recuperação de senha');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-header">
          <h2>Acesso Restrito</h2>
          <p className="domain-info">
            <strong>Domínio permitido:</strong> {ALLOWED_DOMAIN}
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email {ALLOWED_DOMAIN}
            <span className="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading || isRegistering || isRecovering}
            placeholder={`seu.nome${ALLOWED_DOMAIN}`}
            className={formData.email && !validateEmail(formData.email) ? 'invalid' : ''}
          />
          {formData.email && !validateEmail(formData.email) && (
            <div className="domain-warning">
              <span>⚠️</span> Use um email {ALLOWED_DOMAIN}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Senha
            <span className="required">*</span>
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading || isRegistering || isRecovering}
            placeholder="Digite sua senha"
          />
        </div>

        {error && (
          <div className={`message ${error.startsWith('✅') || error.startsWith('📧') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading || isRegistering || isRecovering || !validateEmail(formData.email)}
            className="login-button"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {showRegisterOption && (
            <button
              type="button"
              onClick={handleRegisterRequest}
              disabled={isLoading || isRegistering || isRecovering || !validateEmail(formData.email)}
              className="register-button"
            >
              {isRegistering ? (
                <>
                  <span className="loading-spinner"></span>
                  Enviando...
                </>
              ) : (
                'Solicitar Cadastro'
              )}
            </button>
          )}
        </div>

        <div className="form-footer">
          <p className="info-text">
            Apenas colaboradores com email {ALLOWED_DOMAIN} podem acessar o sistema. 
            Novo usuário? Solicite registro acima.
          </p>
          
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isRecovering}
            className="forgot-password-button"
          >
            {isRecovering ? (
              <>
                <span className="loading-spinner"></span>
                Enviando...
              </>
            ) : (
              'Esqueceu sua senha?'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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