import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CSVUpload } from './CSVUpload';
import { OnBotChat } from './OnBotChat';
import { uploadCSVToN8N } from '../services/csvService';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!user?.email) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setFinished(false);
    setUploadMessage('Enviando arquivo para o servidor...');

    const token = user.id || 'user-token';

    await auditService.logCSVUpload(
      user.email,
      user.id,
      file.name,
      file.size,
      'pending',
      undefined,
      { started_at: new Date().toISOString() }
    );

    try {
      const result = await uploadCSVToN8N(file, token);

      if (result.success) {
        setUploadMessage(`Arquivo processado com sucesso!`);
        toast.success('CSV enviado com sucesso!');

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'success',
          undefined,
          { completed_at: new Date().toISOString() }
        );
      } else {
        setUploadMessage(`Falha no envio do arquivo`);
        toast.error('Erro ao enviar CSV');

        await auditService.logCSVUpload(
          user.email,
          user.id,
          file.name,
          file.size,
          'error',
          result.mensagem
        );
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadMessage('Erro de conexão. Tente novamente.');
      toast.error('Erro de conexão');

      await auditService.logCSVUpload(
        user.email,
        user.id,
        file.name,
        file.size,
        'error',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setIsUploading(false);
      setFinished(true);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadMessage(null);
    setFinished(false);
  };

  const handleFinishAndHome = () => {
    handleRemoveFile();
  };

  if (showChat) {
    return (
      <div className="h-screen w-full bg-gray-950 dark:bg-black text-white">
        <OnBotChat onClose={() => setShowChat(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg p-8"
        >
          <AnimatePresence mode="wait">
            <CSVUpload
              key="uploadStep"
              onFileSelect={handleFileUpload}
              onBack={() => {}}
              onRemoveFile={handleRemoveFile}
              onFinishAndHome={handleFinishAndHome}
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadMessage={uploadMessage}
              finished={finished}
              token={user?.id || ''}
              companyId="C2S"
            />
          </AnimatePresence>
        </motion.div>
      </div>

      <button
        onClick={() => setShowChat(true)}
        className="fixed left-6 bottom-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all z-50 flex items-center gap-2 group hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
          OnBot Chat
        </span>
      </button>

      <div className="fixed right-6 bottom-6 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300 z-40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Sistema em tempo real</span>
        </div>
      </div>
    </div>
  );
};
