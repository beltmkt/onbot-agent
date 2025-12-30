import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  action_type: string;
  metadata: any;
}

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erro ao buscar logs de auditoria:", error);
        toast.error("Falha ao carregar os logs.");
        setLogs([]);
      } else {
        setLogs(data || []);
      }
      setIsLoading(false);
    };

    fetchLogs();
  }, []);

  const formatActionType = (action: string) => {
    if (!action) return '';
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return '-';
    // Exclui campos que não queremos mostrar
    const { token, ...rest } = metadata;
    return JSON.stringify(rest);
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Auditoria</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Data/Hora</th>
              <th scope="col" className="px-6 py-3">Usuário</th>
              <th scope="col" className="px-6 py-3">Ação</th>
              <th scope="col" className="px-6 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center p-8">Carregando logs...</td>
              </tr>
            ) : logs.length > 0 ? logs.map((log) => (
              <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4">{log.user_email}</td>
                <td className="px-6 py-4">{formatActionType(log.action_type)}</td>
                <td className="px-6 py-4 text-xs font-mono">{formatMetadata(log.metadata)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center p-8">Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
