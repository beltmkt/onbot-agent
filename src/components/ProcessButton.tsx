import { Loader2, Upload } from 'lucide-react';

interface ProcessButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export const ProcessButton = ({ onClick, isProcessing, disabled }: ProcessButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processando Usuários...
        </>
      ) : (
        <>
          <Upload className="w-5 h-5" />
          Processar e Criar Usuários
        </>
      )}
    </button>
  );
};
