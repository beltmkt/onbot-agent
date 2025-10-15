import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

export const ErrorMessage = ({ message, onClose }: ErrorMessageProps) => {
  return (
    <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <div className="absolute inset-0 bg-red-400 blur-lg opacity-20"></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-red-300 font-medium mb-1">Erro na Validação</p>
        <p className="text-sm text-red-200/80">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
