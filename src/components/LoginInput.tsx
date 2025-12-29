// src/components/LoginInput.tsx - Componente React correto
import React, { useState } from 'react';

interface LoginFormData {
    email: string;
    password: string;
}

interface LoginInputProps {
    onSubmit: (credentials: LoginFormData) => Promise<void>;
    onRegisterRequest?: (email: string) => Promise<void>;
    isLoading?: boolean;
}

const ALLOWED_DOMAIN = '@c2sglobal.com';

export const LoginInput: React.FC<LoginInputProps> = ({ 
    onSubmit, 
    onRegisterRequest,
    isLoading = false 
}) => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string>('');
    const [showRegisterOption, setShowRegisterOption] = useState<boolean>(false);
    const [isRegistering, setIsRegistering] = useState<boolean>(false);

    const validateEmailDomain = (email: string): boolean => {
        return email.endsWith(ALLOWED_DOMAIN);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        if (!validateEmailDomain(formData.email)) {
            setError(`Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`);
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        }
    };

    const handleRegisterRequest = async () => {
        if (!validateEmailDomain(formData.email)) {
            setError(`Para registrar, use um email ${ALLOWED_DOMAIN}`);
            return;
        }

        setIsRegistering(true);
        try {
            if (onRegisterRequest) {
                await onRegisterRequest(formData.email);
                setError('✅ Solicitação enviada! Verifique seu email.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao solicitar registro');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div style={{ 
            maxWidth: '400px', 
            margin: '50px auto', 
            padding: '2rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center', color: '#333' }}>Acesso Restrito</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
                Domínio permitido: <strong>{ALLOWED_DOMAIN}</strong>
            </p>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Email {ALLOWED_DOMAIN} *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={`seu-nome${ALLOWED_DOMAIN}`}
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                        required
                    />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Senha *
                    </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Sua senha"
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                        required
                    />
                </div>
                
                {error && (
                    <div style={{ 
                        padding: '1rem', 
                        marginBottom: '1.5rem',
                        borderRadius: '4px',
                        backgroundColor: error.startsWith('✅') ? '#d4edda' : '#f8d7da',
                        color: error.startsWith('✅') ? '#155724' : '#721c24',
                        border: `1px solid ${error.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                        {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        backgroundColor: '#1E3A5F',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500',
                        marginBottom: '1rem'
                    }}
                >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
                
                {onRegisterRequest && (
                    <button
                        type="button"
                        onClick={handleRegisterRequest}
                        disabled={isRegistering || !formData.email || !validateEmailDomain(formData.email)}
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        {isRegistering ? 'Enviando...' : 'Solicitar Cadastro'}
                    </button>
                )}
            </form>
        </div>
    );
};

// Exporte também como Login para compatibilidade
export { LoginInput as Login };