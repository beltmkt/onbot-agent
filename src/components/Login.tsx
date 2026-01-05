import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Rocket, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Key } from 'lucide-react';
import './Login.css';

// Adicione um ícone do Google
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.244 44 30.027 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Login: React.FC = () => {
  const { signIn, signUp, recoverPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Estados para controle de abas
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Estados para formulários
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Estados de UI
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');

  // Debug: log quando o componente monta
  useEffect(() => {
    console.log('Login component mounted');
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'unauthorized_domain') {
      setError('Domínio não autorizado. Use seu e-mail @c2sglobal.com.');
    }
  }, []);

  // Limpa mensagens quando muda de aba
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  // Handler para login com Google
  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // O redirecionamento será tratado pelo AuthContext
    } catch (err) {
      setError('Erro inesperado ao tentar logar com o Google. Tente novamente.');
      setIsLoading(false);
    }
  };

  // Handler para login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!loginData.email.endsWith('@c2sglobal.com')) {
      setError('Acesso restrito apenas para contas corporativas (@c2sglobal.com)');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(loginData.email, loginData.password);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Login realizado com sucesso!');
        // Redirecionar para a nova página Home
        navigate('/home');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para cadastro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!registerData.email.endsWith('@c2sglobal.com')) {
      setError('Acesso restrito apenas para contas corporativas (@c2sglobal.com)');
      setIsLoading(false);
      return;
    }

    try {
      // Validações adicionais
      if (registerData.password !== registerData.confirmPassword) {
        setError('As senhas não coincidem');
        setIsLoading(false);
        return;
      }

      if (registerData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        setIsLoading(false);
        return;
      }

      const result = await signUp(registerData.email, registerData.password, registerData.name);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmação.');
        // Limpa formulário
        setRegisterData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para recuperação de senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await recoverPassword(forgotEmail);

      if (result.success) {
        setSuccess(result.message);
        setForgotEmail('');
        setShowForgotPassword(false);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Animações
  const tabVariants = {
    inactive: { opacity: 0.7, scale: 0.95 },
    active: { opacity: 1, scale: 1 },
  };

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="login-header">
          <motion.div
            className="logo-section"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="logo-icon">
              <Rocket className="w-8 h-8" />
            </div>
            <h1 className="logo-text">C2S Onboarding Tools</h1>
          </motion.div>
          <p className="login-subtitle">Central de Ações e Setup</p>
        </div>

        {/* Botão de Login com Google */}
        <div className="google-login-section">
          <motion.button
            onClick={handleGoogleLogin}
            className="google-login-button"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <GoogleIcon />
                Entrar com Google
              </>
            )}
          </motion.button>
        </div>

        {/* Divisor */}
        <div className="divider">
          <span>OU</span>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <motion.button
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            variants={tabVariants}
            animate={activeTab === 'login' ? 'active' : 'inactive'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Login com Email
          </motion.button>
          <motion.button
            className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
            variants={tabVariants}
            animate={activeTab === 'register' ? 'active' : 'inactive'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cadastro
          </motion.button>
        </div>

        {/* Formulários */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form
              key="login"
              className="login-form"
              onSubmit={handleLogin}
              variants={formVariants}
              initial="hidden"
              animate="animate"
              exit="hidden"
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label className="form-label">Email Corporativo <Mail className="input-icon-label" /></label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu.email@c2sglobal.com"
                    className="form-input pl-14"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha <Key className="input-icon-label" /></label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Digite sua senha"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="submit-button"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueceu sua senha?
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              className="login-form"
              onSubmit={handleRegister}
              variants={formVariants}
              initial="hidden"
              animate="animate"
              exit="hidden"
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label className="form-label">Nome <User className="input-icon-label" /></label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Corporativo <Mail className="input-icon-label" /></label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="seu.email@c2sglobal.com"
                    className="form-input pl-14"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha <Key className="input-icon-label" /></label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Senha <Key className="input-icon-label" /></label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Digite a senha novamente"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="submit-button register-button"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    Criar Conta
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Mensagens */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="message error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="message success-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Esqueci Senha */}
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPassword(false)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="modal-title">Recuperar Senha</h3>
                <p className="modal-description">
                  Digite seu email corporativo para receber instruções de recuperação.
                </p>

                <form onSubmit={handleForgotPassword} className="modal-form">
                  <div className="form-group">
                    <div className="input-wrapper">
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu.email@c2sglobal.com"
                        className="form-input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Cancelar
                    </button>
                    <motion.button
                      type="submit"
                      className="submit-button"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? <div className="loading-spinner" /> : 'Enviar'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export { Login };