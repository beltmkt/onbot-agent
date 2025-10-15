import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ProcessingProgressProps {
  current: number;
  total: number;
  status: 'processing' | 'completed' | 'idle';
  results?: {
    created: number;
    failed: number;
  };
}

export const ProcessingProgress = ({ current, total, status, results }: ProcessingProgressProps) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (status === 'idle') return null;

  return (
    <div className="bg-gradient-to-br from-black/60 to-black/40 border border-gray-700 rounded-xl p-6 space-y-4 backdrop-blur-sm">
      {status === 'processing' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-white font-medium">Processando usuários...</span>
            </div>
            <span className="text-sm text-gray-400">
              {current} / {total}
            </span>
          </div>

          <div className="relative h-3 bg-black/60 rounded-full overflow-hidden border border-gray-800">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-2xl font-bold text-blue-400">{percentage}%</span>
          </div>
        </>
      )}

      {status === 'completed' && results && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div className="absolute inset-0 bg-green-400 blur-lg opacity-30"></div>
            </div>
            <span className="text-white font-semibold text-lg">Processamento Concluído!</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-300 font-medium">Criados</span>
              </div>
              <p className="text-3xl font-bold text-green-400">{results.created}</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-300 font-medium">Falharam</span>
              </div>
              <p className="text-3xl font-bold text-red-400">{results.failed}</p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-300">
              Relatório enviado ao N8n automaticamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
