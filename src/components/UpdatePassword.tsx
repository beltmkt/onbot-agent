import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Rocket, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (error) {
      toast.error(error.message || 'Não foi possível atualizar a senha. Tente novamente.');
    } else {
      toast.success('Senha atualizada com sucesso! Você pode fazer login agora.');
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950 relative overflow-hidden">
        {/* Efeitos de Fundo */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-slate-950/50 to-slate-950 z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse-slow z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-fuchsia-500 to-purple-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse-slow delay-1000 z-0"></div>
        <div className="absolute inset-0 z-0 grid-pattern"></div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto relative z-10"
        >
            <Card>
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
                        <h1 className="text-2xl font-bold text-white tracking-wide">Definir Nova Senha</h1>
                    </motion.div>
                    <p className="text-sm text-slate-400">Digite sua nova senha de acesso.</p>
                </div>

                <motion.form
                    className="space-y-6"
                    onSubmit={handleUpdatePassword}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Input
                        label="Nova Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        icon={<Key className="w-5 h-5 text-slate-400" />}
                        passwordToggle
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
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Salvar Senha <ArrowRight className="w-4 h-4 ml-2" /></>}
                    </Button>
                </motion.form>
            </Card>
        </motion.div>
    </div>
  );
};