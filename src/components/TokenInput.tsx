// src/components/TokenInput.tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface TokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
  // ✅ NOVA PROP: Função para ser chamada ao confirmar
  onConfirm: () => void;
}

const messageVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const TokenInput = ({ token, onTokenChange, onConfirm }: TokenInputProps) => {
  const [error, setError] = useState<string | null>(null);

  // Validação em tempo real
  const isValid = useMemo(() => {
    if (!token) return false;
    if (token.length < 5) return false;
    if (!/^[a-zA-Z0-9-_]+$/.test(token)) return false;
    return true;
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value.trim();
    onTokenChange(newToken); // Atualiza o pai (App.tsx)

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
      onConfirm(); // Diz ao App.tsx para avançar
    }
  };

  return (
    // Wrapper de animação para o componente
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

      <h2 className="text-2xl font-semibold text-white mb-2 tracking-wide">
        Token da Empresa
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Insira o token para continuar.
      </p>

      <div className="space-y-3">
        {/* Input e ícones internos... */}
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Key className="w-5 h-5" /></span>
          <input
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="Cole seu token aqui..."
            className={`w-full pl-10 pr-10 py-3 bg-black/40 border rounded-xl text-white ... ${ error ? 'border-red-500/50 ...' : isValid ? 'border-green-500/50 ...' : 'border-gray-700 ...' }`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <AnimatePresence>
              {error && <motion.div ...><AlertCircle className="w-5 h-5 text-red-400" /></motion.div>}
              {isValid && <motion.div ...><CheckCircle className="w-5 h-5 text-green-400" /></motion.div>}
            </AnimatePresence>
          </div>
        </div>

        {/* Mensagem de erro */}
        <div className="h-12 pt-1">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" variants={messageVariants} ...>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* ✅ BOTÃO DE CONFIRMAR */}
        <motion.button
          onClick={handleConfirm}
          disabled={!isValid}
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