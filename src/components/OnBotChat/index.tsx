// src/components/OnBotChat/index.tsx
import React from 'react';
import { X, Send, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeChat } from '../../../hooks/useRealtimeChat';
import { useChatScroll, useChatInput } from './hooks';
import { ChatMessage } from '../../../types/chat';

interface OnBotChatProps {
  onClose: () => void;
  sessionId?: string;
  userId?: string;
}

export const OnBotChat: React.FC<OnBotChatProps> = ({ 
  onClose, 
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  userId = 'user-' + Math.random().toString(36).substr(2, 9)
}) => {
  const {
    messages,
    isTyping,
    isConnected,
    error,
    sendMessage,
    clearError
  } = useRealtimeChat(sessionId, userId);

  const scrollRef = useChatScroll([messages, isTyping]);
  const {
    inputMessage,
    setInputMessage,
    inputRef,
    handleSend,
    handleKeyPress
  } = useChatInput(sendMessage, isTyping);

  // Mensagem de boas-vindas inicial
  const initialMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: 'Olá! Sou o OnBot, seu Agente Digital de Onboarding. Vou te ajudar a criar novos usuários. Para começar, preciso do seu token de acesso. 🔐',
    timestamp: new Date(),
    status: 'sent'
  };

  const displayMessages = messages.length > 0 ? messages : [initialMessage];

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (message.status === 'sending') {
      return <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />;
    }
    if (message.status === 'error') {
      return <div className="w-2 h-2 bg-red-500 rounded-full" />;
    }
    return null;
  };

  return (
    <div className="fixed left-4 bottom-4 w-80 h-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900 rounded-t-lg">
        <div className="flex items-center gap-2">
          <img 
            src="/onbot-icon.jpg" 
            alt="OnBot"
            className="w-6 h-6 rounded"
          />
          <div>
            <span className="font-semibold text-white text-sm">OnBot</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className="text-xs text-gray-400">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mensagens */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm relative ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Status da mensagem */}
              {message.role === 'user' && (
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                  {getMessageStatusIcon(message)}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Indicador de digitação */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>Digitando...</span>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400 max-w-[80%]">
              {error}
              <button 
                onClick={clearError}
                className="ml-2 text-red-300 hover:text-red-100"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={!isConnected || isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || !isConnected || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg p-2 transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};