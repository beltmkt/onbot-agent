import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Importe o CSS

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

  const handleForgotPassword = () => {
    if (validateEmail(formData.email)) {
      setError('📧 Link de recuperação enviado para seu email!');
      // Implementar: recoverPassword(formData.email);
    } else {
      setError('Digite um email válido para recuperar a senha');
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
            disabled={isLoading || isRegistering}
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
            disabled={isLoading || isRegistering || !validateEmail(formData.email)}
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
              disabled={isLoading || isRegistering || !validateEmail(formData.email)}
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
            className="forgot-password-button"
          >
            Esqueceu sua senha?
          </button>
        </div>
      </form>
    </div>
  );
};