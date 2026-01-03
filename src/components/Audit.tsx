import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Download, Search } from 'lucide-react';
import { useRealtimeAudit } from '../hooks/useRealtimeAudit';

// Re-definindo a interface aqui para manter o componente auto-contido
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

// Componentes de UI locais para um design minimalista
const FilterInput = ({ value, onChange, placeholder, name }) => (
  <div className="relative w-full">
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full bg-gray-800/60 border border-gray-700 rounded-lg text-white px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
  </div>
);

export const Audit: React.FC = () => {
  const { logs, isLoading, filters, setFilters } = useRealtimeAudit({
    userEmail: '',
    actionType: '',
    startDate: null,
    endDate: null,
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
  };
  
  const formatActionType = (action: string) => {
    if (!action) return 'N/A';
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
        `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
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
  
  const actionTypes = [...new Set(logs.map(log => log.action_type).filter(Boolean))];

  return (
    <div className="p-4 md:p-8 text-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Auditoria</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-cyan-400 rounded-lg font-medium border border-gray-600"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/60 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FilterInput
            name="userEmail"
            placeholder="Filtrar por email..."
            value={filters.userEmail}
            onChange={handleFilterChange}
          />
          <select
            name="actionType"
            value={filters.actionType}
            onChange={handleFilterChange}
            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/60 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-900/40">
            <tr>
              <th scope="col" className="px-6 py-3">Data/Hora</th>
              <th scope="col" className="px-6 py-3">Usuário</th>
              <th scope="col" className="px-6 py-3">Ação</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Duração</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center p-8">Carregando...</td></tr>
            ) : currentLogs.length > 0 ? currentLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-700/40">
                <td className="px-6 py-4">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4">{log.user_email}</td>
                <td className="px-6 py-4">{formatActionType(log.action_type)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.status === 'success' ? 'bg-green-500/20 text-green-300' : 
                    log.status === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4">{log.duration_seconds ? `${log.duration_seconds}s` : '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center p-8">Nenhum log encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav className="flex justify-center mt-4">
          <ul className="flex items-center -space-x-px h-10 text-base">
            <li>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center px-4 h-10 ms-0 leading-tight border rounded-s-lg bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <li key={page}>
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`flex items-center justify-center px-4 h-10 leading-tight border bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white ${
                    currentPage === page ? 'text-white bg-blue-700 hover:bg-blue-800' : 'text-gray-400'
                  }`}
                >
                  {page}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center px-4 h-10 leading-tight border rounded-e-lg bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};
