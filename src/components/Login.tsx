import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const ALLOWED_DOMAIN = '@c2sglobal.com';

export const Login: React.FC = () => {
  const { signIn, signUp, isAuthorizedDomain } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [showRegisterOption, setShowRegisterOption] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Função de validação simplificada
  const validateEmail = (email: string): boolean => {
    return isAuthorizedDomain ? isAuthorizedDomain(email) : email.toLowerCase().endsWith(ALLOWED_DOMAIN);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(newFormData);
    setError('');

    if (name === 'email' && validateEmail(value)) {
      setShowRegisterOption(true);
    } else {
      setShowRegisterOption(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError(`Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await signIn(formData.email, formData.password);
      if (res.error) {
        setError(res.error);
        // Mostra opção de registro se o usuário não existir
        if (res.error.toLowerCase().includes('não encontrado') || 
            res.error.toLowerCase().includes('not found')) {
          setShowRegisterOption(true);
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRequest = async () => {
    if (!validateEmail(formData.email)) {
      setError(`Para registrar, use um email ${ALLOWED_DOMAIN}`);
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      const res = await signUp(formData.email, formData.password);
      if (res.error) {
        setError(res.error);
      } else {
        setError('✅ Solicitação de registro enviada! Verifique seu email para confirmar.');
        setShowRegisterOption(false);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar registro');
    } finally {
      setIsRegistering(false);
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
            disabled={isLoading || isRegistering}
            placeholder={`seu-nome${ALLOWED_DOMAIN}`}
            className={formData.email && !validateEmail(formData.email) ? 'invalid' : ''}
          />
          {formData.email && !validateEmail(formData.email) && (
            <div className="domain-warning">⚠️ Use um email {ALLOWED_DOMAIN}</div>
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
            disabled={isLoading || isRegistering}
            placeholder="Sua senha"
          />
        </div>

        {error && <div className={`message ${error.startsWith('✅') ? 'success' : 'error'}`}>{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading || isRegistering || !validateEmail(formData.email)}
            className="login-button"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          {showRegisterOption && (
            <button
              type="button"
              onClick={handleRegisterRequest}
              disabled={isLoading || isRegistering || !validateEmail(formData.email)}
              className="register-button"
            >
              {isRegistering ? 'Enviando...' : 'Solicitar Cadastro'}
            </button>
          )}
        </div>

        <div className="form-footer">
          <p className="info-text">
            Apenas colaboradores com email {ALLOWED_DOMAIN} podem acessar o sistema.
          </p>
          
          {/* Botão de recuperação de senha */}
          {formData.email && validateEmail(formData.email) && (
            <button
              type="button"
              onClick={() => {
                setError('📧 Link de recuperação enviado para ' + formData.email);
                // Implemente: recoverPassword(formData.email);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#1a73e8',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '15px',
                textDecoration: 'underline'
              }}
            >
              Esqueceu sua senha?
            </button>
          )}
        </div>
      </form>
    </div>
  );
};