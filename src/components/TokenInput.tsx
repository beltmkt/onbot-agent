import { useState } from 'react';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

interface TokenInputProps {
  onTokenChange: (token: string) => void;
  token: string;
}

export const TokenInput = ({ onTokenChange, token }: TokenInputProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value.trim();
    onTokenChange(newToken);

    if (error) setError(null);

    if (newToken && newToken.length < 5) {
      setError('Token muito curto');
    } else if (newToken && !/^[a-zA-Z0-9-_]+$/.test(newToken)) {
      setError('Token contém caracteres inválidos');
    } else {
      setError(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[50vh] px-6">
      <div className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-[#1f1f1f] rounded-2xl shadow-lg p-8 max-w-lg w-full text-center backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Key className="w-14 h-14 text-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20"></div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-2 tracking-wide">
          <span className="text-blue-500 font-bold">C2S</span> – Token da Empresa
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Insira o token para habilitar o envio do arquivo CSV
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="Cole seu token aqui..."
            className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {token && !error && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">
                ✅ Token válido — pronto para envio do CSV
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Exportação padrão para compatibilidade
export default TokenInput;
