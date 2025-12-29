import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  sessionId: string; // 👈 Adicione esta prop
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, sessionId }) => {
  const [message, setMessage] = useState('');
  const webhookUrl = import.meta.env.VITE_CHAT_WEBHOOK_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Envia para o webhook com sessionId
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chatInput: message,
          sessionId: sessionId // 👈 Agora envia o sessionId
        }),
      });
      console.log('Mensagem enviada para o webhook! SessionId:', sessionId);
    } catch (error) {
      console.error('Erro ao enviar mensagem para o webhook:', error);
    }

    // Chama a função onSend local
    onSend(message);
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-gray-800 border-t border-gray-700"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite sua mensagem..."
        className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-xl focus:outline-none"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-white flex items-center justify-center"
      >
        <Send size={18} />
      </button>
    </form>
  );
};