import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';

export const Teams: React.FC = () => {
  const { user } = useAuth();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const teamName = (event.currentTarget.elements.namedItem('teamName') as HTMLInputElement).value;
    
    // Simulação da criação da equipe
    toast.success(`Equipe "${teamName}" criada com sucesso (simulação)!`);

    if (user?.email) {
      auditService.createLog({
        userEmail: user.email,
        actionType: 'team_creation',
        status: 'success',
        metadata: {
          team_name: teamName,
        }
      });
    }
    
    event.currentTarget.reset();
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Criar Equipes</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-2">Nome da Equipe</label>
            <input type="text" id="teamName" name="teamName" required className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Digite o nome da equipe" />
          </div>
          <div>
            <label htmlFor="manager" className="block text-sm font-medium text-gray-300 mb-2">Gestor</label>
            <input type="text" id="manager" name="manager" required className="w-full pl-4 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Selecione o gestor" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
            Criar Equipe (Simulação)
          </button>
        </form>
      </div>
    </div>
  );
};
