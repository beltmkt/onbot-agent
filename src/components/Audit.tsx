import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Download } from 'lucide-react';
import { useRealtimeAudit } from '../hooks/useRealtimeAudit';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  action_type: string;
  metadata: any;
  duration_seconds?: number;
  status: string;
  error_message?: string;
}

export const Audit: React.FC = () => {
  const { logs, isLoading, filters, setFilters } = useRealtimeAudit({
    userEmail: '',
    actionType: '',
    startDate: null,
    endDate: null,
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
  };

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Status', 'Duração (s)', 'Detalhes'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${new Date(log.created_at).toLocaleString('pt-BR')}"`,
        `"${log.user_email}"`,
        `"${formatActionType(log.action_type)}"`,
        `"${log.status}"`,
        `"${log.duration_seconds || ''}"`,
        `"${formatMetadata(log).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatActionType = (action: string) => {
    if (!action) return '';
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatMetadata = (log: AuditLog) => {
    let details = '';
    if (log.metadata) {
      const { name, token_last4, ...rest } = log.metadata;
      if (name) details += `Nome: ${name}\n`;
      if (token_last4) details += `Token (final): ${token_last4}\n`;
      if (Object.keys(rest).length > 0) {
        details += JSON.stringify(rest, null, 2);
      }
    }
    if (log.error_message) {
      details += `\nErro: ${log.error_message}`;
    }
    return details || '-';
  }

  const actionTypes = [...new Set(logs.map(log => log.action_type))];

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Auditoria</h1>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            name="userEmail"
            placeholder="Filtrar por email..."
            value={filters.userEmail}
            onChange={handleFilterChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2"
          />
          <select
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2"
          >
            <option value="">Todas as ações</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{formatActionType(type)}</option>
            ))}
          </select>
          <DatePicker
            selectsRange
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
            isClearable
            placeholderText="Filtrar por data..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2"
          />
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Data/Hora</th>
              <th scope="col" className="px-6 py-3">Usuário</th>
              <th scope="col" className="px-6 py-3">Ação</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Duração</th>
              <th scope="col" className="px-6 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center p-8">Carregando logs...</td>
              </tr>
            ) : logs.length > 0 ? logs.map((log) => (
              <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4">{log.user_email}</td>
                <td className="px-6 py-4">{formatActionType(log.action_type)}</td>
                <td className="px-6 py-4">{log.status}</td>
                <td className="px-6 py-4">{formatDuration(log.duration_seconds)}</td>
                <td className="px-6 py-4 text-xs font-mono whitespace-pre-wrap">{formatMetadata(log)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center p-8">Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
