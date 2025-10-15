// src/components/OnBotChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Wifi, WifiOff, RefreshCw, Paperclip, FileText, Image } from 'lucide-react';
import { sendMessageToOnbot } from '../services/onbotService';

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

export const OnBotChat: React.FC<OnBotChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: 'Olá! Eu sou OnBot - Agente Digital de Onboarding! Vou te ajudar na criação de novos usuários. Para começar me envia o Token de acesso a empresa',
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    if ((!inputMessage.trim() && attachments.length === 0) || loading) return;

    const userMessage = { 
      id: `msg_${Date.now()}_user`,
      sender: 'user', 
      text: inputMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments.map(a => ({ name: a.name })) : undefined
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setAttachments([]);
    setLoading(true);

    try {
      let messageToSend = inputMessage;
      
      // Adiciona informações sobre arquivos à mensagem
      if (attachments.length > 0) {
        const fileInfo = attachments.map(a => `[Arquivo: ${a.name} (${a.size})]`).join(' ');
        messageToSend = inputMessage ? `${inputMessage} ${fileInfo}` : `Anexei ${attachments.length} arquivo(s): ${fileInfo}`;
      }

      console.log('🔄 Enviando mensagem para n8n...');
      const botResponse = await sendMessageToOnbot(messageToSend, sessionId);
      
      const botMessage = { 
        id: `msg_${Date.now()}_bot`,
        sender: 'bot', 
        text: botResponse,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, botMessage]);
      console.log('✅ Resposta recebida do n8n');
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      setMessages((prev) => [...prev, { 
        id: `msg_${Date.now()}_error`,
        sender: 'bot', 
        text: `Erro de comunicação: ${error instanceof Error ? error.message : 'Tente novamente'}`,
        timestamp: new Date()
      }]);
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

  return (
    <div className="fixed left-4 bottom-4 w-80 h-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col z-50">
      {/* Header - MANTIDO O AVATAR */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900 rounded-t-lg">
        <div className="flex items-center gap-2">
          <img 
            src="/onbot-avatar.png"  alt="OnBot" className="w-6 h-6 rounded"/>
          <div>
            <span className="font-semibold text-white text-sm">OnBot</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className="text-xs text-gray-400">
                {isConnected ? 'Online' : 'Offline'}
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {msg.text}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div className="text-xs opacity-80">
                    📎 {msg.attachments.length} arquivo(s) anexado(s)
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>OnBot está digitando...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Área de Anexos */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-700 bg-gray-750">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-gray-600 rounded-lg px-3 py-1 text-xs text-white"
              >
                {getFileIcon(attachment.type)}
                <span className="max-w-[120px] truncate">{attachment.name}</span>
                <span className="text-gray-400 text-xs">{attachment.size}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-gray-400 hover:text-white ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area com Botão de Anexar */}
      <div className="p-3 border-t border-gray-700">
        {/* Input de arquivo oculto */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept=".csv,.xlsx,.xls,.txt,.pdf,.jpg,.jpeg,.png"
        />
        
        <div className="flex gap-2">
          {/* Botão de Anexar - NOVO */}
          <button
            onClick={triggerFileInput}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg p-2 transition-colors flex items-center justify-center"
            title="Anexar arquivo"
            disabled={loading}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg p-2 transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};