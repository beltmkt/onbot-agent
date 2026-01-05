import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRightLeft, Activity, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

export const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Obter user do contexto
  const userName = user?.user_metadata?.name || user?.email || 'Usuário'; // Fallback para 'Usuário'
  const navigate = useNavigate(); // Inicializar useNavigate

  const handleCardClick = (action: string) => {
    let initialPrompt = "";
    switch (action) {
      case 'Criar Usuário':
        initialPrompt = "Quero criar um novo usuário.";
        break;
      case 'Transferir Lead':
        initialPrompt = "Preciso transferir um lead.";
        break;
      case 'Status do Agente':
        initialPrompt = "Qual é o status do agente?";
        break;
      default:
        initialPrompt = "Olá, OnBot!";
    }
    navigate('/onbot-chat', { state: { initialPrompt } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Background Radial Gradient / Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-slate-950/50 to-slate-950 z-0"></div>

      {/* Aurora Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-fuchsia-500 to-purple-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse-slow delay-1000 z-0"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-7xl px-4">
        {/* Header de Boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 leading-tight">
            Olá, {userName}!
          </h1>
          <p className="text-xl text-slate-400">O OnBot está pronto. Qual a missão de hoje?</p>
        </motion.div>

        {/* Barra de Comando (O Hero Element) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-3xl relative mb-20"
        >
          <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 w-7 h-7" />
          <input
            type="text"
            placeholder="Digite um comando ou selecione uma ação..."
            disabled
            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl shadow-glass backdrop-blur-md
                       text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500/80
                       transition-all duration-300 ease-in-out text-lg"
          />
        </motion.div>

        {/* Grid de Ações Rápidas (Quick Actions) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
        >
          {/* Card A: Criar Usuário */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer relative overflow-hidden
                       backdrop-blur-xl shadow-glass hover:bg-white/10 hover:border-indigo-500/50
                       transition-all duration-300 ease-in-out"
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => handleCardClick('Criar Usuário')}
          >
            <UserPlus className="w-14 h-14 text-indigo-400 mb-5" />
            <h3 className="text-2xl font-bold text-white mb-2">Criar Usuário</h3>
            <p className="text-sm text-slate-300">Adicionar acesso ao sistema</p>
          </motion.div>

          {/* Card B: Transferir Contato */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer relative overflow-hidden
                       backdrop-blur-xl shadow-glass hover:bg-white/10 hover:border-fuchsia-500/50
                       transition-all duration-300 ease-in-out"
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => handleCardClick('Transferir Lead')}
          >
            <ArrowRightLeft className="w-14 h-14 text-fuchsia-400 mb-5" />
            <h3 className="text-2xl font-bold text-white mb-2">Transferir Contato</h3>
            <p className="text-sm text-slate-300">Transfira contatos no C2SGo.</p>
          </motion.div>

          {/* Card C: Status do Agente */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer relative overflow-hidden
                       backdrop-blur-xl shadow-glass hover:bg-white/10 hover:border-lime-500/50
                       transition-all duration-300 ease-in-out"
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => handleCardClick('Status do Agente')}
          >
            <Activity className="w-14 h-14 text-lime-400 mb-5" />
            <h3 className="text-2xl font-bold text-white mb-2">Status do Agente</h3>
            <p className="text-sm text-slate-300">Sistemas operacionais</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};