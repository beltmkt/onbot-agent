import { useState } from 'react';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

interface TokenInputProps {
  onTokenChange: (token: string) => void;
  token: string;
}

export const TokenInput = ({ onTokenChange, token }: TokenInputProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    onTokenChange(newToken);
    
    // Limpa erro anterior
    if (error) setError(null);
    
    // Validação básica em tempo real
    if (newToken.trim() && newToken.length < 5) {
      setError('Token muito curto');
    } else if (newToken.trim() && !/^[a-zA-Z0-9-_]+$/.test(newToken)) {
      setError('Token contém caracteres inválidos');
    } else {
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Key className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Token da Empresa</h2>
        <p className="text-gray-400">
          Insira o token para habilitar o upload do arquivo
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="Cole seu token aqui..."
            className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {token && !error && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">
                ✅ Token inserido - Aguardando arquivo CSV
              </span>
            </div>
          </div>
        )}

        {/* Informações sobre o fluxo */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Key className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-400 text-sm font-medium mb-1">
                Como funciona:
              </p>
              <ul className="text-blue-300 text-xs space-y-1">
                <li>• Insira o token da sua empresa</li>
                <li>• Selecione o arquivo CSV</li>
                <li>• Clique em "Enviar para Processamento"</li>
                <li>• O token será validado junto com o arquivo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};