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

  const validateEmailDomain = (email: string): boolean => {
    return isAuthorizedDomain ? isAuthorizedDomain(email) : email.endsWith(ALLOWED_DOMAIN);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(newFormData);
    setError('');

    if (name === 'email' && validateEmailDomain(value)) {
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

    if (!validateEmailDomain(formData.email)) {
      setError(`Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await signIn(formData.email, formData.password);
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
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRequest = async () => {
    if (!validateEmailDomain(formData.email)) {
      setError(`Para registrar, use um email ${ALLOWED_DOMAIN}`);
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      const res = await signUp(formData.email, formData.password || Math.random().toString(36).slice(2, 10));
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
            className={formData.email && !validateEmailDomain(formData.email) ? 'invalid' : ''}
          />
          {formData.email && !validateEmailDomain(formData.email) && (
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
            disabled={isLoading || isRegistering || !validateEmailDomain(formData.email)}
            className="login-button"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          {showRegisterOption && (
            <button
              type="button"
              onClick={handleRegisterRequest}
              disabled={isLoading || isRegistering || !validateEmailDomain(formData.email)}
              className="register-button"
            >
              {isRegistering ? 'Enviando...' : 'Solicitar Cadastro'}
            </button>
          )}
        </div>

        <div className="form-footer">
          <p className="info-text">
            Apenas colaboradores com email {ALLOWED_DOMAIN} podem acessar o sistema. Novo usuário? Solicite registro acima.
          </p>
        </div>
      </form>
    </div>
  );
};