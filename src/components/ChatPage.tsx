import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Sparkles, ArrowLeft, Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string; // Changed to string for sessionId
  sender: 'user' | 'bot';
  content: string; // Changed from text to content
}

export const ChatPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // URL do seu Webhook de Chat no N8N
  const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'SUA_URL_DO_N8N_AQUI'; 

  // Efeito para carregar o prompt inicial da Dashboard
  useEffect(() => {
    // Generate a new session ID if one doesn't exist
    if (!localStorage.getItem('chat_session_id')) {
      localStorage.setItem('chat_session_id', Date.now().toString());
    }

    const initialPrompt = (location.state as { initialPrompt?: string })?.initialPrompt;

    if (initialPrompt) {
      handleSend(initialPrompt);
      // Limpa o state para não reenviar ao recarregar
      window.history.replaceState({}, document.title);
    }
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend: string) => { // Renamed input to textToSend
    if (!textToSend.trim()) return;

    // 1. Adiciona mensagem do usuário visualmente
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Envia para o N8N
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chatInput: textToSend, 
            sessionId: localStorage.getItem('chat_session_id') || Date.now().toString() // Ensure sessionId is always present
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("RESPOSTA DO N8N:", data); // Debugging line

      // 3. Adiciona resposta do Bot (Ajuste conforme o retorno do seu n8n: data.output, data.text, etc)
      const botMsg: Message = { 
        id: Date.now().toString(), 
        sender: 'bot', 
        content: data.content || data.output || data.message || data.text || data.response || JSON.stringify(data)
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Erro ao enviar mensagem para o n8n:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', content: "Erro ao conectar com o agente. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend(input);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col">
      {/* Background Radial Gradient / Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-slate-950/50 to-slate-950 z-0"></div>

      {/* Aurora Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-l from-fuchsia-500 to-purple-500 rounded-full mix-blend-multiply filter blur-[150px] opacity-30 animate-pulse-slow delay-1000 z-0"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 grid-pattern"></div>

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-3xl mx-auto pt-4 pb-24"> {/* Added pb-24 for input space */}
        {/* Header with Back Button */}
        <div className="mb-4 px-4 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-bold ml-4">OnBot Chat</h2>
        </div>

        {/* Message History Area */}
        <div className="flex-1 overflow-y-auto space-y-4 px-4 custom-scrollbar">
          {messages.length === 0 && !((location.state as { initialPrompt?: string })?.initialPrompt) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Sparkles className="w-16 h-16 mb-4 text-indigo-400 animate-pulse" />
              <p className="text-lg">Comece a conversar com o OnBot!</p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`max-w-[75%] p-3 shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl rounded-tr-none'
                    : 'bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-xl rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                  <User size={18} />
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Bot size={18} />
              </div>
              <div className="max-w-[75%] p-3 shadow-lg bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-xl rounded-tl-none">
                <p>Digitando<span className="animate-pulse">...</span></p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-20">
        <div className="w-full max-w-3xl mx-auto flex items-center gap-2 bg-white/5 border border-white/10 rounded-full shadow-glass backdrop-blur-md px-4 py-3">
          <input
            type="text"
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
            placeholder={isLoading ? "Aguarde a resposta do OnBot..." : "Digite sua mensagem..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};