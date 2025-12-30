import React from 'react';
import { Clock } from 'lucide-react';

export const RemaxRequests: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
        <Clock className="w-16 h-16 mb-4 text-cyan-400" />
        <h1 className="text-3xl font-bold mb-2 text-white">Em Breve</h1>
        <p className="text-lg text-gray-400">A funcionalidade de Solicitações Remax estará disponível em breve.</p>
    </div>
  );
};
