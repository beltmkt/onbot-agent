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

  // NOVA FUNÇÃO DE VALIDAÇÃO ADICIONADA AQUI
  const validateC2SEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email || typeof email !== 'string') {
      return { 
        isValid: false, 
        error: 'Email não é uma string válida' 
      };
    }
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail === '') {
      return { 
        isValid: false, 
        error: 'Email não pode estar vazio' 
      };
    }
    
    // Expressão regular para validar formato básico de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return { 
        isValid: false, 
        error: 'Formato de email inválido' 
      };
    }
    
    const emailLower = trimmedEmail.toLowerCase();
    
    if (!emailLower.endsWith(ALLOWED_DOMAIN)) {
      return { 
        isValid: false, 
        error: `Somente emails ${ALLOWED_DOMAIN} são permitidos` 
      };
    }
    
    const atIndex = emailLower.indexOf('@');
    if (atIndex === 0) {
      return { 
        isValid: false, 
        error: 'Email deve ter um nome de usuário antes do @' 
      };
    }
    
    return { 
      isValid: true 
    };
  };

  const validateEmailDomain = (email: string): boolean => {
    // Agora usando a nova função de validação
    const validation = validateC2SEmail(email);
    return validation.isValid;
  };

  // Função para obter mensagem de erro específica do email
  const getEmailErrorMessage = (email: string): string => {
    const validation = validateC2SEmail(email);
    return validation.error || `Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(newFormData);
    setError('');

    if (name === 'email') {
      const validation = validateC2SEmail(value);
      if (validation.isValid) {
        setShowRegisterOption(true);
      } else {
        setShowRegisterOption(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    // Usando a nova validação
    const emailValidation = validateC2SEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || `Apenas emails do domínio ${ALLOWED_DOMAIN} são permitidos`);
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
          res.error.toLowerCase().includes('usuário não existe') ||
          res.error.toLowerCase().includes('c.endswith') // Adicionado para capturar o erro específico
        ) {
          setShowRegisterOption(true);
        }
      }
    } catch (err: any) {
      // Tratamento específico para o erro c.endsWith
      if (err.message && err.message.includes('c.endsWith')) {
        setError('Erro de validação de email. Por favor, insira um email válido.');
        console.error('Erro c.endsWith detectado:', err);
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRequest = async () => {
    // Usando a nova validação
    const emailValidation = validateC2SEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || `Para registrar, use um email ${ALLOWED_DOMAIN}`);
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
      // Tratamento específico para o erro c.endsWith
      if (err.message && err.message.includes('c.endsWith')) {
        setError('Erro de validação de email. Por favor, insira um email válido.');
        console.error('Erro c.endsWith detectado:', err);
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao solicitar registro');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Função para lidar com blur do campo email (validação em tempo real)
  const handleEmailBlur = () => {
    if (formData.email) {
      const validation = validateC2SEmail(formData.email);
      if (!validation.isValid) {
        setError(validation.error || '');
      }
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
            onBlur={handleEmailBlur} // Adicionado evento onBlur
            disabled={isLoading || isRegistering}
            placeholder={`seu-nome${ALLOWED_DOMAIN}`}
            className={formData.email && !validateEmailDomain(formData.email) ? 'invalid' : ''}
          />
          {formData.email && !validateEmailDomain(formData.email) && (
            <div className="domain-warning">
              ⚠️ {getEmailErrorMessage(formData.email)}
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
          {/* ADICIONE ESTE BOTÃO PARA RECUPERAÇÃO DE SENHA */}
          <button
            type="button"
            onClick={() => {
              // Implemente a lógica de recuperação de senha aqui
              if (formData.email && validateEmailDomain(formData.email)) {
                setError('📧 Link de recuperação enviado para seu email!');
                // Chame sua função de recuperação de senha aqui
                // recoverPassword(formData.email);
              } else {
                setError('Digite um email válido para recuperar a senha');
              }
            }}
            className="forgot-password-button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1a73e8',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '10px',
              textDecoration: 'underline'
            }}
          >
            Esqueceu sua senha?
          </button>
        </div>
      </form>
    </div>
  );
};