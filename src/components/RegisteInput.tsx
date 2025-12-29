import React, { useState, useEffect } from 'react';

interface ActionLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: Date;
    details?: string;
}

export const RegisterInput: React.FC = () => {
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [filterUser, setFilterUser] = useState('');

    const addLog = (userId: string, userName: string, action: string, details?: string) => {
        const newLog: ActionLog = {
            id: Date.now().toString(),
            userId,
            userName,
            action,
            timestamp: new Date(),
            details,
        };
        setLogs([newLog, ...logs]);
    };

    const filteredLogs = logs.filter(log =>
        filterUser ? log.userId.includes(filterUser) : true
    );

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Dashboard de Logs</h1>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Filtrar por ID do usuário"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    style={{ padding: '8px', width: '200px' }}
                />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Usuário</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Ação</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Detalhes</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Hora</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLogs.map(log => (
                        <tr key={log.id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.userName}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.action}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{log.details}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                {log.timestamp.toLocaleString('pt-BR')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RegisterInput;