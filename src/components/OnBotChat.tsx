// src/components/OnBotChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Bot, User, Maximize2, Minimize2, RefreshCw, Image, FileText } from 'lucide-react';
import { sendMessageToOnbot } from '../services/onbotService';
import onbotAvatar from '/onbot-avatar.png';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  attachments?: { name: string }[];
  isTyping?: boolean;
}

interface FileAttachment {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
}

interface OnBotChatProps {
  onClose: () => void;
}

export const OnBotChat: React.FC<OnBotChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', sender: 'bot', text: '👋 **Olá! Sou o OnBot - Seu Assistente de Onboarding**\n\nEnvie seu Token para começar.', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Scroll automático
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = Array.from(files).map((file, idx) => ({
      id: `file_${Date.now()}_${idx}`,
      file,
      name: file.name,
      size: file.size > 1024 * 1024 ? `${(file.size/(1024*1024)).toFixed(1)} MB` : `${Math.round(file.size/1024)} KB`,
      type: file.type.split('/')[0]
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

  const addTypingEffect = async (text: string) => {
    return new Promise<void>((resolve) => {
      let idx = 0, current = '';
      const typingId = `typing_${Date.now()}`;
      setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', timestamp: new Date(), isTyping: true }]);
      const interval = setInterval(() => {
        if (idx < text.length) {
          current += text[idx];
          setMessages(prev => prev.map(m => m.id === typingId ? { ...m, text: current } : m));
          idx++;
        } else {
          clearInterval(interval);
          setMessages(prev => prev.map(m => m.id === typingId ? { ...m, isTyping: false } : m));
          resolve();
        }
      }, 15);
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    const userMsg: ChatMessage = { id: `user_${Date.now()}`, sender: 'user', text: inputMessage.trim(), timestamp: new Date(), attachments: attachments.map(a => ({ name: a.name })) };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const botResponse = await sendMessageToOnbot(userMsg.text, sessionId, attachments.map(a => a.file));
      await addTypingEffect(botResponse);
      setAttachments([]);
    } catch (error) {
      await addTypingEffect('⚠️ Erro de comunicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const triggerFileInput = () => fileInputRef.current?.click();

  const chatDimensions = isExpanded ? 'w-[500px] h-[700px]' : 'w-[400px] h-[550px]';

  return (
    <div className={`fixed inset-0 m-auto ${chatDimensions} bg-gray-900 rounded-2xl shadow-2xl flex flex-col z-50 backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
        <div className="flex items-center space-x-2">
          <img src={onbotAvatar} className="w-8 h-8 rounded-full" />
          <span className="text-white font-semibold">OnBot</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsExpanded(prev => !prev)} className="text-white hover:text-cyan-400">{isExpanded ? <Minimize2 /> : <Maximize2 />}</button>
          <button onClick={onClose} className="text-white hover:text-red-500"><X /></button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-white'}`}>
              <div>{msg.text}</div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-1 text-sm space-y-1">
                  {msg.attachments.map((a, idx) => <div key={idx} className="flex items-center space-x-2"><FileText className="w-4 h-4" /> <span>{a.name}</span></div>)}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex flex-col border-t border-cyan-500/30 p-3 space-y-2">
        {attachments.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto">
            {attachments.map(a => (
              <div key={a.id} className="flex items-center bg-gray-800 text-white px-2 py-1 rounded-full text-sm">
                {a.name} <button onClick={() => removeAttachment(a.id)} className="ml-1 hover:text-red-500">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center space-x-2">
          <textarea
            value={inputMessage}
            onChange={e => e.target.value.length <= 500 && setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 resize-none p-2 rounded-xl bg-gray-800 text-white outline-none"
            rows={1}
          />
          <button onClick={triggerFileInput} className="text-white hover:text-cyan-400"><Paperclip /></button>
          <button onClick={handleSendMessage} disabled={loading} className="text-white hover:text-cyan-400"><Send /></button>
        </div>
        <div className="text-xs text-gray-400 text-right">{inputMessage.length}/500</div>
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      </div>
    </div>
  );
};
