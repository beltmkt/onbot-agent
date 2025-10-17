// src/components/FileUploadChat.tsx
import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Send } from 'lucide-react';
import { sendMessageToOnbot } from '../services/onbotService';

interface FileUploadChatProps {
  sessionId: string;
  onMessageSent: (message: string, file?: File) => void;
  onClose: () => void;
}

export const FileUploadChat: React.FC<FileUploadChatProps> = ({
  sessionId,
  onMessageSent,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setFile(files[0]);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!message.trim() && !file) || loading) return;

    setLoading(true);
    
    try {
      await sendMessageToOnbot(message, sessionId, file || undefined);
      onMessageSent(message, file || undefined);
      setMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('❌ Erro no upload:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-5 h-5" />;
    return file.type.startsWith('image/') 
      ? <Image className="w-5 h-5" />
      : <FileText className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 m-auto w-96 h-64 bg-gray-800 rounded-xl shadow-2xl border border-cyan-500/20 flex flex-col z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-cyan-600 rounded-t-xl">
        <span className="font-bold text-white">Enviar Arquivo</span>
        <button onClick={onClose} className="text-white hover:bg-white/20 rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".csv,.xlsx,.xls,.txt,.pdf,.jpg,.jpeg,.png"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 text-sm text-white transition-colors"
          >
            {getFileIcon()}
            <span>Selecionar Arquivo</span>
          </button>

          {file && (
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 text-sm">
              <span className="text-cyan-300 truncate max-w-32">{file.name}</span>
              <button onClick={removeFile} className="text-gray-400 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem para o Gemini (opcional)..."
          className="w-full bg-gray-700 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-400"
          rows={2}
        />
      </div>

      <div className="p-4 border-t border-cyan-500/20 bg-gray-750 rounded-b-xl">
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !file) || loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg py-2 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Enviar para Gemini
        </button>
      </div>
    </div>
  );
};