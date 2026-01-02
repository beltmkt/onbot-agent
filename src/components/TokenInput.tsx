import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface TokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
  onConfirm: () => void;
  errorMessage: string | null; // Adiciona prop para mensagem de erro externa
}

const messageVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const TokenInput = ({ token, onTokenChange, onConfirm, errorMessage }: TokenInputProps) => {
  const isValid = useMemo(() => {
    return token.length > 0 && !errorMessage; // Considera o erro externo na validação
  }, [token, errorMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTokenChange(e.target.value);
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  const displayError = errorMessage || (token.length === 0 ? 'Token é obrigatório' : null);

  return (
    <motion.div
      key="token"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'circOut' }}
      className="w-full"
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Key className="w-14 h-14 text-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" strokeWidth={1.5} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tighter">
        <span className="text-blue-500">C2S</span> – Create Sellers
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Insira o token da empresa para continuar.
      </p>

      <div className="space-y-3">
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Key className="w-5 h-5" /></span>
          <input
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="Cole seu token aqui..."
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            className={`w-full pl-12 pr-10 py-3 bg-black/40 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all duration-200 ${
              displayError
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                : isValid && token.length > 0
                ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/50'
                : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <AnimatePresence>
              {displayError && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </motion.div>
              )}
              {isValid && token.length > 0 && ( // Verifica token.length > 0 para mostrar CheckCircle apenas quando há input e é válido
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="h-12 pt-1">
          <AnimatePresence mode="wait">
            {displayError && (
              <motion.div
                key="error"
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{displayError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={handleConfirm}
          disabled={!isValid || token.length === 0} // Desabilita se não for válido ou se o token estiver vazio
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.98 }}
        >
          Avançar <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TokenInput;
