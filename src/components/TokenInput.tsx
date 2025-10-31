import { useState } from 'react';
// 1. Importando motion e AnimatePresence para animações
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

interface TokenInputProps {
  onTokenChange: (token: string) => void;
  token: string;
}

// 2. Variantes de animação para as mensagens
const messageVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const TokenInput = ({ onTokenChange, token }: TokenInputProps) => {
  // --- Lógica original mantida ---
  const [error, setError] = useState<string | null>(null);
  const isValid = token && !error;

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
  // --- Fim da lógica original ---

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[50vh] px-6">
      <div className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-[#1f1f1f] rounded-2xl shadow-lg p-8 max-w-lg w-full text-center backdrop-blur-sm">
        
        {/* 3. Animação sutil no ícone principal */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <Key className="w-14 h-14 text-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20"></div>
          </div>
        </motion.div>

        <h2 className="text-2xl font-semibold text-white mb-2 tracking-wide">
          <span className="text-blue-500 font-bold">C2S</span> – Token da Empresa
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Insira o token para habilitar o envio do arquivo CSV.
        </p>

        <div className="space-y-3">
          {/* 4. Wrapper relativo para o input e seus ícones internos */}
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <Key className="w-5 h-5" />
            </span>

            <input
              type="text" // Considere type="password" se for sensível
              value={token}
              onChange={handleChange}
              placeholder="Cole seu token aqui..."
              // 5. Classes dinâmicas para borda e padding
              className={`w-full pl-10 pr-10 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all duration-200
                ${
                  error
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                    : isValid
                    ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/50'
                    : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                }
              `}
            />
            
            {/* 6. Ícone de status dinâmico dentro do input (direita) */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </motion.div>
                )}
                {isValid && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 7. Wrapper com altura fixa para evitar "pulo" de layout */}
          <div className="h-12 pt-1">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}

              {isValid && (
                <motion.div
                  key="success"
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-sm">
                    Token em formato válido.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenInput;