import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRightLeft, Activity, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth

export const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Obter user do contexto
  const userName = user?.user_metadata?.name || user?.email || 'Usuário'; // Fallback para 'Usuário'

  // As funções de navegação e tratamento de clique para os cards
  // serão implementadas posteriormente, o foco agora é o design.
  const handleCardClick = (action: string) => {
    console.log(`Ação clicada: ${action}`);
    // Futuramente, aqui se navegaria para a tela específica ou abriria um modal
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center bg-gray-900 text-gray-100 p-4">
      {/* Header de Boas-vindas */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">
          Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{userName}</span>!
        </h1>
        <p className="text-lg text-gray-400">O OnBot está pronto. Qual a missão de hoje?</p>
      </motion.div>

      {/* Barra de Comando */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-2xl relative mb-12"
      >
        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6" />
        <input
          type="text"
          placeholder="Digite um comando ou selecione uma ação..."
          disabled
          className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg
                     text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500
                     transition-all duration-300 ease-in-out"
        />
      </motion.div>

      {/* Grid de Ações Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
      >
        {/* Card A: Criar Usuário */}
        <motion.div
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer
                     hover:bg-gray-700 hover:border-cyan-500 transition-all duration-300 ease-in-out
                     shadow-md hover:shadow-lg"
          whileHover={{ y: -5 }}
          onClick={() => handleCardClick('Criar Usuário')}
        >
          <UserPlus className="w-12 h-12 text-cyan-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Criar Usuário</h3>
          <p className="text-gray-400 text-sm">Adicionar acesso ao sistema</p>
        </motion.div>

        {/* Card B: Transferir Lead */}
        <motion.div
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer
                     hover:bg-gray-700 hover:border-purple-500 transition-all duration-300 ease-in-out
                     shadow-md hover:shadow-lg"
          whileHover={{ y: -5 }}
          onClick={() => handleCardClick('Transferir Lead')}
        >
          <ArrowRightLeft className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Transferir Lead</h3>
          <p className="text-gray-400 text-sm">Mover contato para sua carteira</p>
        </motion.div>

        {/* Card C: Status do Agente */}
        <motion.div
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer
                     hover:bg-gray-700 hover:border-green-500 transition-all duration-300 ease-in-out
                     shadow-md hover:shadow-lg"
          whileHover={{ y: -5 }}
          onClick={() => handleCardClick('Status do Agente')}
        >
          <Activity className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Status do Agente</h3>
          <p className="text-gray-400 text-sm">Sistemas operacionais</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
