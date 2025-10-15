import { useState, useEffect } from 'react';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'error' | 'success' | 'warning';
  message: string;
  data?: any;
}

// Criamos um EventTarget global para logs (não trava o React)
const debugBus = new EventTarget();

export const addDebugLog = (
  level: DebugLog['level'],
  message: string,
  data?: any
) => {
  const log: DebugLog = {
    timestamp: new Date().toLocaleTimeString(),
    level,
    message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
    data
  };
  debugBus.dispatchEvent(new CustomEvent('debug', { detail: log }));
};

export const DebugPanel = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleLog = (e: Event) => {
      const custom = e as CustomEvent<DebugLog>;
      setLogs(prev => [...prev.slice(-49), custom.detail]);
    };

    debugBus.addEventListener('debug', handleLog);
    return () => debugBus.removeEventListener('debug', handleLog);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600 text-sm font-medium transition-colors z-50"
      >
        Debug Logs
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-black/95 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Debug Logs</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-80 p-2 space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">No logs yet</p>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 rounded font-mono ${
                log.level === 'error' ? 'bg-red-500/10 text-red-400' :
                log.level === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                log.level === 'success' ? 'bg-green-500/10 text-green-400' :
                'bg-gray-800 text-gray-300'
              }`}
            >
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
