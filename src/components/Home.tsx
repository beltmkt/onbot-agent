import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho conforme necessário

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  
  const userName = toTitleCase(user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário');

  return (
    <div className="flex flex-col p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-white">
        Olá, {userName}
      </h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg">
        <p className="text-lg text-gray-300">
          Esta é uma ferramenta para uso do Onboarding com o objetivo de facilitar atividades repetitivas, melhorando a experiência do cliente e a otimização do tempo do agente.
        </p>
      </div>
      <div className="flex-grow mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Espaço reservado para futuros cards de métricas ou informações */}
      </div>
    </div>
  );
};
