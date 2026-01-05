import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

export const OnBotChat: React.FC = () => {
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{ id: 1, sender: 'user', text: initialMessage }]);
      // Simulate AI response for the initial message
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: 2, sender: 'bot', text: `Olá! Você disse: "${initialMessage}". Como posso ajudar hoje?` },
        ]);
      }, 1000);
    }
  }, [initialMessage, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const newMessage: Message = { id: messages.length + 1, sender: 'user', text: inputMessage };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, sender: 'bot', text: `Entendi: "${inputMessage}". Processando...` },
      ]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Effects (from Dashboard) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      {/* Main Chat Container */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col h-[calc(100vh-64px)] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 md:p-6">
        
        {/* Message History Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.length === 0 && !initialMessage && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Sparkles className="w-16 h-16 mb-4 text-indigo-400 animate-pulse" />
              <p className="text-lg">Comece a conversar com o OnBot!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-white rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
              </div>
              {msg.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="mt-4 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite sua mensagem..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSendMessage}
            className="p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};