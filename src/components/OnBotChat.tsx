// src/components/OnBotChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Wifi, WifiOff, RefreshCw, Paperclip, FileText, Image, Bot, User } from 'lucide-react';
import { sendMessageToOnbot } from '../services/onbotService';
import onbotAvatar from '/onbot-avatar.png';

// SERVIÇO MODERNO DE PROCESSAMENTO DE ARQUIVOS
const fileService = {
  processFile: async (file: File) => {
    console.log('🔄 Processando arquivo:', file.name, file.type);
    
    if (file.type.includes('csv') || file.name.includes('.csv')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const users: any[] = [];
            
            for (const line of lines) {
              // Suporte a CSV com vírgulas e ponto-e-vírgula
              const cells = line.split(/[,;]/).map(cell => 
                cell.trim().replace(/["']/g, '')
              ).filter(cell => cell);
              
              if (cells.length >= 2 && cells[1].includes('@')) {
                users.push({
                  name: cells[0],
                  email: cells[1],
                  phone: cells[2] || '',
                  company: cells[3] || ''
                });
              }
            }
            
            if (users.length > 0) {
              resolve({
                success: true,
                message: `📊 **${users.length} usuário(s) detectado(s)** no arquivo\n\n${users.map((user, index) => 
                  `${index + 1}. **${user.name}** - ${user.email}${user.phone ? ` - ${user.phone}` : ''}`
                ).join('\n')}\n\n**Deseja criar esses usuários?**`,
                data: users,
                totalItems: users.length
              });
            } else {
              resolve({
                success: false,
                message: "📊 **Arquivo CSV recebido**\n\nNão identifiquei dados de usuários no formato esperado.\n\n**Formato esperado:**\nNome, Email, Telefone (opcional)"
              });
            }
          } catch (error) {
            resolve({
              success: false,
              message: "❌ **Erro ao processar arquivo**\n\nO arquivo pode estar corrompido ou em formato não suportado."
            });
          }
        };
        reader.readAsText(file);
      });
    }
    
    else if (file.type.includes('spreadsheet') || file.name.match(/\.(xlsx|xls)$/)) {
      return {
        success: false,
        message: "📊 **Arquivo Excel detectado**\n\nPara melhor processamento, recomendo exportar como **CSV**.\n\nEnvie o arquivo convertido ou cole os dados diretamente no chat."
      };
    }
    else if (file.type.includes('pdf') || file.name.includes('.pdf')) {
      return {
        success: false,
        message: "📄 **Documento PDF recebido**\n\nPara criar usuários, preciso que você **cole os dados diretamente** no chat ou envie um arquivo CSV.\n\n**Formato:** Nome, Email, Telefone"
      };
    }
    else if (file.type.includes('image')) {
      return {
        success: false,
        message: "🖼️ **Imagem recebida**\n\nPara processar dados de usuários, **digite as informações** ou envie um arquivo CSV.\n\nPosso ajudar a formatar os dados!"
      };
    }
    else {
      return {
        success: false,
        message: `📎 **Arquivo ${file.name} recebido**\n\nPara criar usuários, preciso de dados em formato de texto.\n\n**Envie um arquivo CSV** ou **cole os dados** diretamente.`
      };
    }
  }
};

type UserData = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
};

interface OnBotChatProps {
  onClose: () => void;
}

interface FileAttachment {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  attachments?: { name: string }[];
  isTyping?: boolean;
}

export const OnBotChat: React.FC<OnBotChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: '👋 **Olá! Sou o OnBot - Seu Assistente de Onboarding**\n\nVou te ajudar a criar usuários de forma rápida e eficiente!\n\n🔑 **Para começar, envie seu Token de acesso**',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [processedData, setProcessedData] = useState<UserData[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Scroll automático para novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages]);

  // Efeito de digitação em tempo real
  const addTypingEffect = async (message: string, delay: number = 30) => {
    return new Promise<void>((resolve) => {
      let currentText = '';
      let index = 0;

      // Adiciona mensagem vazia com indicador de digitação
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
          // Remove o indicador de digitação
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      newAttachments.push({
        id: `file_${Date.now()}_${i}`,
        file,
        name: file.name,
        size: fileSize,
        type: file.type.split('/')[0]
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset do input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
    const removedAttachment = attachments.find(a => a.id === id);
    if (removedAttachment && removedAttachment.file === currentFile) {
      setProcessedData([]);
      setCurrentFile(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'text':
      case 'application':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && attachments.length === 0) || loading || isProcessingFile) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Mensagem do usuário
    const userMessage: ChatMessage = { 
      id: `msg_${Date.now()}_user`,
      sender: 'user', 
      text: userMessageText,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments.map(a => ({ name: a.name })) : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      let finalMessage = userMessageText;

      // 🔄 Processar arquivos se houver anexos
      if (attachments.length > 0 && processedData.length === 0) {
        setIsProcessingFile(true);
        const firstFile = attachments[0].file;
        setCurrentFile(firstFile);
        const result = await fileService.processFile(firstFile);
        
        await addTypingEffect(result.message);
        
        if (result.success && result.data) {
          setProcessedData(result.data);
          finalMessage += `\n[ARQUIVO: ${firstFile.name} - ${result.data.length} usuários detectados]`;
        }
        
        setIsProcessingFile(false);
        
        // Se detectou usuários, para aqui e aguarda confirmação
        if (result.data && result.data.length > 0) {
          setLoading(false);
          return;
        }
      }

      // 🔄 Enviar para Gemini/Backend
      console.log('🚀 Enviando para backend...');
      const botResponse = await sendMessageToOnbot(finalMessage, sessionId);
      
      // Adicionar resposta com efeito de digitação
      await addTypingEffect(botResponse);
      
      console.log('✅ Resposta recebida');

      // Limpar estado após processamento completo
      if (attachments.length > 0) {
        setAttachments([]);
        setProcessedData([]);
        setCurrentFile(null);
      }
      
    } catch (error) {
      console.error('❌ Erro:', error);
      await addTypingEffect(
        '⚠️ **Erro de comunicação**\n\nEstou tendo problemas para me conectar. Por favor, tente novamente em alguns instantes.'
      );
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index}>
        {line.split('**').map((part, i) => 
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </div>
    ));
  };

  return (
    <div className="fixed right-6 bottom-6 w-96 h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 flex flex-col z-50 backdrop-blur-sm">
      {/* Header Moderno */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={onbotAvatar} 
              alt="OnBot" 
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
          </div>
          <div>
            <span className="font-bold text-white text-sm">OnBot Assistant</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-300" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-300" />
              )}
              <span className="text-xs text-blue-100">
                {isConnected ? 'Conectado' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-850 to-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm backdrop-blur-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : msg.isTyping
                  ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 border border-gray-600'
                  : 'bg-gradient-to-r from-gray-750 to-gray-700 text-gray-100 border border-gray-600 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.sender === 'user' ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                <span className="text-xs opacity-70">
                  {msg.sender === 'user' ? 'Você' : 'OnBot'}
                </span>
                {msg.isTyping && (
                  <div className="flex gap-1 ml-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
              
              <div className="whitespace-pre-wrap leading-relaxed">
                {formatMessageText(msg.text)}
              </div>
              
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div className="text-xs opacity-80 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    {msg.attachments.length} arquivo(s) anexado(s)
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Área de Anexos */}
      {attachments.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {attachments.length} arquivo(s) pronto(s)
            </span>
            {processedData.length > 0 && (
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                ✅ {processedData.length} usuário(s)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-gray-700/50 rounded-xl px-3 py-2 text-xs text-white border border-gray-600 backdrop-blur-sm"
              >
                {getFileIcon(attachment.type)}
                <span className="max-w-[140px] truncate">{attachment.name}</span>
                <span className="text-gray-400 text-xs">{attachment.size}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-gray-400 hover:text-red-400 ml-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Área de Input Moderna */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm rounded-b-2xl">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept=".csv,.xlsx,.xls,.txt,.pdf,.jpg,.jpeg,.png"
        />
        
        <div className="flex gap-3">
          <button
            onClick={triggerFileInput}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl p-3 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            title="Anexar arquivo"
            disabled={loading || isProcessingFile}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm"
              disabled={loading || isProcessingFile}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || loading || isProcessingFile}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl p-3 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};