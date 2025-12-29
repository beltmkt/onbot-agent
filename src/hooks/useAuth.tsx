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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // API call here
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            setUser(data.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
    }, []);

    const signup = useCallback(async (email: string, password: string, name: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });
            const data = await response.json();
            setUser(data.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
    };
};