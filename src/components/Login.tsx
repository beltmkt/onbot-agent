import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Rocket, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Key, Loader2 } from 'lucide-react';
// import './Login.css'; // Remover este import
import { Card } from './ui/Card'; // Importar o novo Card component
import { Input } from './ui/Input'; // Importar o novo Input component
import { Button } from './ui/Button'; // Importar o novo Button component


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
  const { signIn, signUp, recoverPassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
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

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');

  useEffect(() => {
    console.log('Login component mounted');
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'unauthorized_domain') {
      setError('Domínio não autorizado. Use seu e-mail corporativo.');
    }
  }, []);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!loginData.email.endsWith('@LABELTSERVICOSDIGITAIS.COM.BR') && !loginData.email.endsWith('@c2sglobal.com')) {
      setError('Acesso restrito apenas para contas corporativas.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(loginData.email, loginData.password);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Login realizado com sucesso!');
        navigate('/home');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!registerData.email.endsWith('@LABELTSERVICOSDIGITAIS.COM.BR') && !registerData.email.endsWith('@c2sglobal.com')) {
      setError('Acesso restrito apenas para contas corporativas.');
      setIsLoading(false);
      return;
    }

    try {
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


  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    // O container principal não precisa de 'login-container' CSS, Tailwind resolve
    <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Usando o novo componente Card */}
        <Card className="w-full max-w-md mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="flex flex-col items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="bg-white/5 p-3 rounded-full mb-3 border border-white/10 shadow-glass">
                <Rocket className="w-8 h-8 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Onboarding Tools</h1>
            </motion.div>
            <p className="text-sm text-slate-400">Central de Ações e Setup</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <Button
              variant={activeTab === 'login' ? 'primary-neon' : 'secondary-glass'}
              size="sm"
              onClick={() => setActiveTab('login')}
              disabled={isLoading}
            >
              Login com Email
            </Button>
            <Button
              variant={activeTab === 'register' ? 'primary-neon' : 'secondary-glass'}
              size="sm"
              onClick={() => setActiveTab('register')}
              disabled={isLoading}
            >
              Cadastro
            </Button>
          </div>

          {/* Formulários */}
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login"
                className="space-y-4" // Use Tailwind for spacing
                onSubmit={handleLogin}
                variants={formVariants}
                initial="hidden"
                animate="animate"
                exit="hidden"
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Email Corporativo"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="seu.email@LABELTSERVICOSDIGITAIS.COM.BR"
                  icon={<Mail className="w-5 h-5 text-slate-400" />} // Ícone dentro do Input
                  required
                />

                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Digite sua senha"
                  icon={<Key className="w-5 h-5 text-slate-400" />} // Ícone dentro do Input
                  passwordToggle // Adiciona prop para o toggle de senha
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                  required
                />
                
                <Button
                  type="submit"
                  variant="primary-neon"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>

                <Button
                  type="button"
                  variant="ghost" // Usar variante ghost para link
                  className="w-full text-sm text-slate-400 hover:text-white"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Esqueceu sua senha?
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                className="space-y-4" // Use Tailwind for spacing
                onSubmit={handleRegister}
                variants={formVariants}
                initial="hidden"
                animate="animate"
                exit="hidden"
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Nome"
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  icon={<User className="w-5 h-5 text-slate-400" />} // Ícone dentro do Input
                  required
                />

                <Input
                  label="Email Corporativo"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="seu.email@LABELTSERVICOSDIGITAIS.COM.BR"
                  icon={<Mail className="w-5 h-5 text-slate-400" />} // Ícone dentro do Input
                  required
                />

                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  icon={<Key className="w-5 h-5 text-slate-400" />} // Ícone dentro do Input
                  passwordToggle
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                  required
                />

                <Input
                  label="Confirmar Senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  icon={<Key className="w-5 h-5 text-slate-400" />} // Ícone dentro do Input
                  passwordToggle
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  showPassword={showConfirmPassword}
                  required
                />

                <Button
                  type="submit"
                  variant="primary-neon"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Conta <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Mensagens */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-6 flex items-center gap-2 text-sm bg-red-500/20 text-red-300 p-3 rounded-lg border border-red-400/50"
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
                className="mt-6 flex items-center gap-2 text-sm bg-green-500/20 text-green-300 p-3 rounded-lg border border-green-400/50"
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
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForgotPassword(false)}
              >
                <Card
                  className="w-full max-w-md relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold text-white mb-4">Recuperar Senha</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Digite seu email corporativo para receber instruções de recuperação.
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu.email@LABELTSERVICOSDIGITAIS.COM.BR"
                      icon={<Mail className="w-5 h-5 text-slate-400" />}
                      required
                    />

                    <div className="flex justify-end gap-3 mt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="primary-neon"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export { Login };
