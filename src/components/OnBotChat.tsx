// src/components/OnBotChat.tsx - VERSÃO COM PLANILHA INTEGRADA
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, RefreshCw, Bot, User, Maximize2, Minimize2, Upload, FileText } from 'lucide-react';
import { sendMessageToOnbot, testOnbotConnection, processPlanilha } from '../services/onbotService';
import onbotAvatar from '/onbot-avatar.png';

interface OnBotChatProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  hasPlanilha?: boolean;
  planilhaData?: string[][];
}

export const OnBotChat: React.FC<OnBotChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: '👋 Olá! Sou o OnBot e vou te ajudar a criar novos usuários.\n\n📊 **Posso processar:**\n• Token de acesso\n• Dados de usuários em texto\n• Planilhas CSV\n• Múltiplos usuários de uma vez\n\n🔑 Para começar, me envie o token de acesso da sua empresa.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Verificar conexão ao inicializar
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      try {
        const result = await testOnbotConnection();
        if (result.status === 'success') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  // Scroll automático para novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages]);

  // ✅ Efeito de digitação mais suave
  const addTypingEffect = async (message: string, delay: number = 20) => {
    return new Promise<void>((resolve) => {
      let currentText = '';
      let index = 0;

      const typingMessageId = `typing_${Date.now()}`;
      setMessages(prev => [...prev, {
        id: typingMessageId,
        sender: 'bot',
        text: '',
        timestamp: new Date(),
        isTyping: true
      }]);

      const interval = setInterval(() => {
        if (index < message.length) {
          currentText += message[index];
          setMessages(prev => prev.map(msg => 
            msg.id === typingMessageId 
              ? { ...msg, text: currentText }
              : msg
          ));
          index++;
        } else {
          clearInterval(interval);
          setMessages(prev => prev.map(msg => 
            msg.id === typingMessageId 
              ? { ...msg, isTyping: false }
              : msg
          ));
          resolve();
        }
      }, delay);
    });
  };

  // ✅ Processar upload de planilha
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['.csv', '.xlsx', '.xls', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!validTypes.some(type => file.name.toLowerCase().includes(type) || file.type.includes(type))) {
      await addTypingEffect('❌ Formato não suportado. Use CSV.');
      return;
    }

    setLoading(true);

    try {
      // Mensagem do usuário mostrando o arquivo
      const userMessage: ChatMessage = { 
        id: `file_${Date.now()}`,
        sender: 'user', 
        text: `📎 Enviando planilha: ${file.name}`,
        timestamp: new Date(),
        hasPlanilha: true
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Ler arquivo como texto (simulação - em produção você processaria o CSV/Excel)
      const text = await file.text();
      const linhas = text.split('\n').filter(line => line.trim()).map(line => line.split(',').map(cell => cell.trim()));
      
      console.log('📊 Planilha processada:', { linhas: linhas.length, file: file.name });

      // Enviar para processamento
      const resultado = await processPlanilha(linhas, sessionId);
      
      await addTypingEffect(resultado);

    } catch (error) {
      console.error('❌ Erro ao processar planilha:', error);
      await addTypingEffect('❌ Erro ao processar planilha. Tente novamente.');
    } finally {
      setLoading(false);
      // Limpar input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ Tratamento de envio com melhor feedback
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Mensagem do usuário
    const userMessage: ChatMessage = { 
      id: `msg_${Date.now()}_user`,
      sender: 'user', 
      text: userMessageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('🚀 Enviando mensagem...', { 
        message: userMessageText, 
        sessionId
      });
      
      const botResponse = await sendMessageToOnbot(
        userMessageText, 
        sessionId
      );
      
      console.log('✅ Resposta recebida:', botResponse);
      
      // ✅ ADICIONA RESPOSTA COM EFEITO DE DIGITAÇÃO
      await addTypingEffect(botResponse);
      
    } catch (error) {
      console.error('❌ Erro na comunicação:', error);
      
      // ✅ MENSAGEM DE ERRO SIMPLES
      let errorMessage = '❌ Desculpe, ocorreu um erro. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = '🌐 Erro de conexão. Verifique sua internet.';
        } else if (error.message.includes('404')) {
          errorMessage = '🔧 Serviço temporariamente indisponível.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '⏰ Tempo esgotado. Tente novamente.';
        }
      }
      
      await addTypingEffect(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line.split('**').map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="text-cyan-300">{part}</strong> : part
        )}
      </div>
    ));
  };

  // ✅ Indicador de status de conexão
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />
            <span className="text-xs text-yellow-300">Conectando...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-300">Conectado</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-xs text-red-300">Offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  const chatDimensions = isExpanded 
    ? 'w-[500px] h-[700px]' 
    : 'w-[400px] h-[550px]';

  return (
    <div className={`fixed inset-0 m-auto ${chatDimensions} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-cyan-500/20 flex flex-col z-50 backdrop-blur-sm transition-all duration-300`}>
      
      {/* Header Tecnológico */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-t-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <img 
              src={onbotAvatar} 
              alt="OnBot" 
              className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
            />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
              connectionStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
            }`}></div>
          </div>
          <div>
            <span className="font-bold text-white text-sm drop-shadow-lg">OnBot AI</span>
            {renderConnectionStatus()}
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 backdrop-blur-sm"
            title={isExpanded ? "Reduzir" : "Expandir"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm backdrop-blur-sm border ${
                msg.sender === 'user'
                  ? msg.hasPlanilha
                    ? 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white shadow-lg border-purple-400/30'
                    : 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white shadow-lg border-blue-400/30'
                  : msg.sender === 'system'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/20'
                  : msg.isTyping
                  ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-100 border-gray-500/30'
                  : 'bg-gradient-to-r from-gray-750/80 to-gray-700/80 text-gray-100 border-gray-600/30 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {msg.sender === 'user' ? (
                  <div className="flex items-center gap-2">
                    {msg.hasPlanilha ? <FileText className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="text-xs opacity-70 font-medium">
                      {msg.hasPlanilha ? 'Planilha' : 'Você'}
                    </span>
                  </div>
                ) : msg.sender === 'system' ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-xs opacity-70 font-medium">Sistema</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs opacity-70 font-medium">OnBot AI</span>
                  </div>
                )}
                {msg.isTyping && (
                  <div className="flex gap-1 ml-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
              
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {formatMessageText(msg.text)}
              </div>

              {/* Preview da planilha se existir */}
              {msg.hasPlanilha && msg.planilhaData && (
                <div className="mt-2 p-2 bg-black/20 rounded-lg text-xs">
                  <div className="text-cyan-300 mb-1">📋 Preview (primeiras linhas):</div>
                  {msg.planilhaData.slice(0, 3).map((linha, idx) => (
                    <div key={idx} className="text-gray-300 font-mono">
                      {linha.join(' | ')}
                    </div>
                  ))}
                  {msg.planilhaData.length > 3 && (
                    <div className="text-cyan-200 mt-1">... e mais {msg.planilhaData.length - 3} linhas</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Área de Input - COM UPLOAD DE PLANILHA */}
      <div className="p-4 border-t border-cyan-500/20 bg-gradient-to-t from-gray-800 to-gray-900/80 backdrop-blur-sm rounded-b-2xl">
        {/* Botão de Upload */}
        <div className="flex gap-2 mb-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl px-3 py-2 text-xs text-white transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Upload Planilha
          </button>
          <div className="flex-1 text-xs text-cyan-300/70 flex items-center">
            📊 Suporta CSV
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite token, dados de usuários ou comandos... (Shift+Enter para nova linha)"
              className="w-full bg-gray-700/80 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-200 backdrop-blur-sm resize-none disabled:opacity-50"
              disabled={loading}
              rows={3}
              style={{ 
                minHeight: '60px',
                maxHeight: '120px'
              }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-cyan-300/50">
              {inputMessage.length}/500
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl p-3 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center mb-1 group"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};