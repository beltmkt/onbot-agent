import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface TokenInputProps {
  // 1. O token agora é controlado pelo pai
  token: string;
  onTokenChange: (token: string) => void;
  // 2. Nova prop para dizer ao pai para avançar
  onConfirm: () => void;
}

const messageVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const TokenInput = ({ token, onTokenChange, onConfirm }: TokenInputProps) => {
  const [error, setError] = useState<string | null>(null);

  // 3. Validação agora é um valor memoizado
  const isValid = useMemo(() => {
    if (!token) return false;
    if (token.length < 5) return false;
    if (!/^[a-zA-Z0-9-_]+$/.test(token)) return false;
    return true;
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value.trim();
    onTokenChange(newToken); // Atualiza o pai

    // Validação em tempo real
    if (newToken && newToken.length < 5) {
      setError('Token muito curto');
    } else if (newToken && !/^[a-zA-Z0-9-_]+$/.test(newToken)) {
      setError('Token contém caracteres inválidos');
    } else {
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  return (
    // 4. Wrapper de animação para a entrada do componente
    <motion.div
      key="token"
      initial={{ opacity: 0, x: -300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.4, ease: 'circOut' }}
      className="w-full"
    >
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
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
            <Key className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="Cole seu token aqui..."
            className={`w-full pl-10 pr-10 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all duration-200
              ${ error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                : isValid ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/50'
                : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500' }
            `}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <AnimatePresence>
              {error && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><AlertCircle className="w-5 h-5 text-red-400" /></motion.div>}
              {isValid && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="w-5 h-5 text-green-400" /></motion.div>}
            </AnimatePresence>
          </div>
        </div>

        {/* 5. Mensagem de erro (agora sem a de sucesso, o botão substitui) */}
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
          </AnimatePresence>
        </div>
        
        {/* 6. Botão de confirmação, só habilita se for válido */}
        <motion.button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.98 }}
        >
          Confirmar e Avançar <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};