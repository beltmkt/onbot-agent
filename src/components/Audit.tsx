import React from 'react';

const mockData = [
  { id: 1, dateTime: '2025-12-30 10:30:00', user: 'alisson@c2sglobal.com', action: 'Criou Usuário', details: 'Usuário: john.doe@example.com' },
  { id: 2, dateTime: '2025-12-30 10:35:00', user: 'jane.doe@c2sglobal.com', action: 'Transferiu Contato', details: 'De: userA Para: userB' },
  { id: 3, dateTime: '2025-12-30 11:00:00', user: 'alisson@c2sglobal.com', action: 'Criou Equipe', details: 'Equipe: Vendas' },
];

export const Audit: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Auditoria</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Data/Hora</th>
              <th scope="col" className="px-6 py-3">Quem Solicitou</th>
              <th scope="col" className="px-6 py-3">Ação Realizada</th>
              <th scope="col" className="px-6 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((log) => (
              <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-6 py-4">{log.dateTime}</td>
                <td className="px-6 py-4">{log.user}</td>
                <td className="px-6 py-4">{log.action}</td>
                <td className="px-6 py-4">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
