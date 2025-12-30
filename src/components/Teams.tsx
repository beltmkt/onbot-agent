import React from 'react';

export const Teams: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Criar Equipes</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg max-w-md">
        <form className="space-y-6">
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">Nome da Equipe</label>
            <input type="text" id="teamName" className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Digite o nome da equipe" />
          </div>
          <div>
            <label htmlFor="manager" className="block text-sm font-medium text-gray-300 mb-2">Gestor</label>
            <input type="text" id="manager" className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Selecione o gestor" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
            Criar Equipe
          </button>
        </form>
      </div>
    </div>
  );
};
