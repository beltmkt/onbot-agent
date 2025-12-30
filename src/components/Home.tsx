import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho conforme necessário

export const Home: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Bom dia';
    }
    if (hour < 18) {
      return 'Boa tarde';
    }
    return 'Boa noite';
  };

  const greeting = getGreeting();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        {greeting}, {userName}!
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400">
        Seja bem-vindo ao Onboard Tools.
      </p>
    </div>
  );
};
