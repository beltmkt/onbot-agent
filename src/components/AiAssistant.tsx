import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Para obter o user.email para sessionId
import { v4 as uuidv4 } from 'uuid'; // Para gerar sessionId único se não houver email

// Definir o tipo para as mensagens do chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  options?: { label: string; value: string; action?: string }[]; // Novo campo
}

const N8N_WEBHOOK_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/c3f08451-1847-461c-9ba0-a0f6d0bac603/chat';

interface AiAssistantProps {
  onClose: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false); // Novo estado para controlar a expansão
  
    // Gerar um sessionId único ou usar o ID do usuário, mantendo-o estável
    const sessionIdRef = useRef(user?.id || `anon-${uuidv4()}`);
  
    // Mensagem de boas-vindas inicial
    useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'Olá! Sou o OnBot, seu Agente Digital de Onboarding. Para começar, por favor, me diga o que você precisa! 🚀',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Scroll automático para o final do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (messageContent?: string) => {
    const messageToSend = messageContent || inputMessage.trim();
    if (messageToSend === '') return;

    const newUserMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage(''); // Sempre limpa o input após enviar, seja manual ou quick reply
    setIsTyping(true);
    setError(null); // Limpar erro anterior

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: messageToSend,
          sessionId: sessionIdRef.current,
          userEmail: user?.email || "teste@c2s.com",
          userName: user?.user_metadata?.full_name || user?.user_metadata?.name || "Visitante",
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botResponseContent = data.output || data.content || data.message || 'Desculpe, não consegui processar sua solicitação.';

      const newBotMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: botResponseContent,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);

    } catch (err) {
      console.error('Erro ao enviar mensagem para o n8n:', err);
      setError('Erro ao conectar com o assistente. Tente novamente mais tarde.');
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: uuidv4(),
          role: 'error',
          content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReplyClick = (value: string) => {
    handleSendMessage(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isTyping) {
      handleSendMessage();
    }
  };

  return (
    <div
      className={`fixed bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-700 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? 'top-4 left-4 right-4 bottom-4' : 'bottom-20 right-4 w-80 h-[480px]'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="font-semibold text-white text-sm">Onbot Assistant</span>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={isExpanded ? 'Minimizar chat' : 'Expandir chat'}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm relative ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'assistant'
                  ? 'bg-gray-700 text-gray-100'
                  : 'bg-red-700/20 text-red-300 border border-red-500' // Estilo para mensagens de erro
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.role === 'assistant' && message.options && message.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.options.map((option, index) => (
                    <button
                      key={index}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => handleQuickReplyClick(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="absolute bottom-1 right-2 text-xs text-gray-400 opacity-60">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>Digitando...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400 max-w-[90%] text-center">
              {error}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-700 bg-gray-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg p-2 transition-colors"
            aria-label="Enviar mensagem"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};