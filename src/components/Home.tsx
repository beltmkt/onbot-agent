import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Users, ArrowRightLeft, ScrollText, GitPullRequest } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [usersCreated, setUsersCreated] = useState(0);
  const [activeTeams, setActiveTeams] = useState(0);
  const [transfers, setTransfers] = useState(0);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const userName = toTitleCase(user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário');

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        // Fetch Users Created
        const { count: usersCount, error: usersError } = await supabase
          .from('activity_logs')
          .select('id', { count: 'exact' })
          .eq('action_type', 'user_creation');
        if (usersError) throw usersError;
        setUsersCreated(usersCount || 0);

        // Fetch Active Teams (assuming 'team_creation' actionType in audit logs)
        const { count: teamsCount, error: teamsError } = await supabase
          .from('activity_logs')
          .select('id', { count: 'exact' })
          .eq('action_type', 'team_creation');
        if (teamsError) throw teamsError;
        setActiveTeams(teamsCount || 0);

        // Fetch Transfers (assuming 'csv_upload' actionType in audit logs)
        const { count: transfersCount, error: transfersError } = await supabase
          .from('activity_logs')
          .select('id', { count: 'exact' })
          .eq('action_type', 'csv_upload');
        if (transfersError) throw transfersError;
        setTransfers(transfersCount || 0);

      } catch (error) {
        console.error("Error fetching metrics:", error);
        toast.error("Failed to load dashboard metrics.");
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();

    // Setup real-time listeners for activity_logs to update metrics
    const usersCreatedChannel = supabase
      .channel('users_created_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: 'action_type=eq.user_creation' }, () => {
        fetchMetrics();
      })
      .subscribe();

    const teamsCreatedChannel = supabase
      .channel('teams_created_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: 'action_type=eq.team_creation' }, () => {
        fetchMetrics();
      })
      .subscribe();

    const csvUploadChannel = supabase
      .channel('csv_upload_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: 'action_type=eq.csv_upload' }, () => {
        fetchMetrics();
      })
      .subscribe();


    return () => {
      supabase.removeChannel(usersCreatedChannel);
      supabase.removeChannel(teamsCreatedChannel);
      supabase.removeChannel(csvUploadChannel);
    };
  }, []);

  return (
    <div className="flex flex-col p-8 bg-gray-900 text-white min-h-screen">
      {/* Topo: Saudação */}
      <h1 className="text-4xl font-extrabold mb-8 text-white">
        Olá, {userName}
      </h1>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1: Usuários Criados */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg hover:border-blue-500 transition-all duration-300">
          <div className="flex items-center mb-3">
            <UserPlus className="text-blue-400 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-100">Usuários Criados</h2>
          </div>
          <p className="text-3xl font-bold text-white">{isLoadingMetrics ? '...' : usersCreated} <span className="text-lg font-normal text-gray-400">total</span></p>
        </div>

        {/* Card 2: Equipes Ativas */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg hover:border-green-500 transition-all duration-300">
          <div className="flex items-center mb-3">
            <Users className="text-green-400 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-100">Equipes Ativas</h2>
          </div>
          <p className="text-3xl font-bold text-white">{isLoadingMetrics ? '...' : activeTeams} <span className="text-lg font-normal text-gray-400">equipes</span></p>
        </div>

        {/* Card 3: Transferências */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg hover:border-purple-500 transition-all duration-300">
          <div className="flex items-center mb-3">
            <ArrowRightLeft className="text-purple-400 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-100">Transferências</h2>
          </div>
          <p className="text-3xl font-bold text-white">{isLoadingMetrics ? '...' : transfers} <span className="text-lg font-normal text-gray-400">realizadas</span></p>
        </div>
      </div>

      {/* Ações Rápidas */}
      import { navigationData } from '../data/navigation.tsx';

// ... (resto do código, incluindo a função toTitleCase)

// Ações Rápidas
<div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg mb-10">
  <h2 className="text-2xl font-semibold text-gray-100 mb-5">O que você deseja fazer?</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {navigationData
      .find(section => section.title === 'OPERACIONAL')
      ?.items.map(item => (
        <Link
          key={item.to}
          to={item.to}
          className="flex items-center justify-center px-6 py-4 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 text-white text-lg font-bold"
        >
          {item.icon} <span className="ml-3">{item.text}</span>
        </Link>
      ))}
  </div>
</div>

      {/* Espaço para futuros componentes ou informações adicionais */}
      <div className="flex-grow"></div> 
    </div>
  );
};
