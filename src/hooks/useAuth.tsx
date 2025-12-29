import { useState, useCallback, useContext, createContext, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    // ADICIONE ESTAS FUNÇÕES:
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string) => Promise<{ error?: string }>;
    isAuthorizedDomain?: (email: string) => boolean; // Opcional
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para validar email
const validateEmailDomain = (email: string): boolean => {
    // Verificação segura para evitar erro c.endsWith
    if (!email || typeof email !== 'string') {
        console.error('validateEmailDomain: email inválido', email);
        return false;
    }
    
    try {
        return email.toLowerCase().endsWith('@c2sglobal.com');
    } catch (err) {
        console.error('Erro em validateEmailDomain:', err);
        return false;
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Função signIn (renomeada para compatibilidade)
    const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
        console.log('signIn chamado com email:', email);
        
        // Validação do email antes de enviar
        if (!validateEmailDomain(email)) {
            return { error: `Apenas emails @c2sglobal.com são permitidos` };
        }
        
        setIsLoading(true);
        try {
            // API call here
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return { error: errorData.message || 'Erro ao fazer login' };
            }
            
            const data = await response.json();
            setUser(data.user);
            return {};
        } catch (error: any) {
            console.error('Erro no signIn:', error);
            return { error: error.message || 'Erro de conexão' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Função login (mantida para compatibilidade)
    const login = useCallback(async (email: string, password: string) => {
        const result = await signIn(email, password);
        if (result.error) {
            throw new Error(result.error);
        }
    }, [signIn]);

    // Função signUp (renomeada para compatibilidade)
    const signUp = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
        console.log('signUp chamado com email:', email);
        
        // Validação do email antes de enviar
        if (!validateEmailDomain(email)) {
            return { error: `Apenas emails @c2sglobal.com são permitidos` };
        }
        
        setIsLoading(true);
        try {
            // Para registro, você precisa do nome também
            const name = email.split('@')[0]; // Usa a parte antes do @ como nome
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password, 
                    name 
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return { error: errorData.message || 'Erro ao registrar' };
            }
            
            const data = await response.json();
            setUser(data.user);
            return {};
        } catch (error: any) {
            console.error('Erro no signUp:', error);
            return { error: error.message || 'Erro de conexão' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Função signup (mantida para compatibilidade)
    const signup = useCallback(async (email: string, password: string, name: string) => {
        const result = await signUp(email, password);
        if (result.error) {
            throw new Error(result.error);
        }
    }, [signUp]);

    const logout = useCallback(async () => {
        setUser(null);
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        // Exporte as novas funções
        signIn,
        signUp,
        isAuthorizedDomain: validateEmailDomain,
    };
};

// Hook useAuth atualizado
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};