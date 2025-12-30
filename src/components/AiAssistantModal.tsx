import React from 'react';
import { Bot, X } from 'lucide-react';

interface AiAssistantModalProps {
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>
        <div className="flex items-center gap-4 mb-4">
          <Bot size={28} className="text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Assistente IA</h2>
        </div>
        <div className="text-gray-300">
          <p>Olá! Sou seu assistente de IA.</p>
          <p className="mt-2">Esta funcionalidade ainda está em desenvolvimento, mas em breve estarei aqui para ajudar a otimizar suas tarefas!</p>
        </div>
      </div>
    </div>
  );
};
