import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Key, Mail, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { auditService } from '../services/auditService';

export const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isSignUp ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');

        if (!isSignUp) {
          await auditService.logLogin(email);
        }
      }
    } catch (error) {
      toast.error('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 px-8 py-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Key className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              C<span className="text-blue-200">2</span>S CreateSeller
            </h2>
            <p className="text-blue-100 text-sm">
              Plataforma Corporativa Interna
            </p>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Acesso Restrito
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Apenas emails corporativos @contact2sale.com.br são permitidos nesta plataforma.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="seu.email@contact2sale.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isSignUp
                  ? 'Já tem uma conta? Fazer login'
                  : 'Não tem conta? Criar uma nova'}
              </button>
            </div>
          </div>

          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Sistema de gestão de usuários Contact2Sale
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
