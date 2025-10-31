// src/App.tsx - VERSÃO WIZARD CORRIGIDA
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { TokenInput } from './components/TokenInput';
import { CSVUpload } from './components/CSVUpload';
import { uploadCSVToN8N } from './services/csvService';
import { OnBotChat } from './components/OnBotChat';

const App: React.FC = () => {
  // ESTADOS DO WIZARD
  const [step, setStep] = useState<'token' | 'upload'>('token');
  const [token, setToken] = useState('');
  const [companyId] = useState('C2S');
  
  // ESTADOS DO UPLOAD
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const [showChat, setShowChat] = useState(false);

  // Lógica de upload
  const handleFileUpload = async (file: File) => {
    if (!token) {
      setUploadMessage('⚠️ Insira o token antes de enviar o CSV.');
      return;
    }
    
    setSelectedFile(file); 
    setIsUploading(true);
    setFinished(false);
    setUploadMessage('⏳ Enviando arquivo para o servidor...');

    try {
      const result = await uploadCSVToN8N(file, token);
      if (result.success) {
        setUploadMessage(`✅ ${result.mensagem || 'Arquivo processado com sucesso!'}`);
      } else {
        setUploadMessage(`❌ ${result.mensagem || 'Falha no envio do arquivo'}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadMessage('❌ Erro de conexão. Tente novamente.');
    } finally {
      setIsUploading(false);
      setFinished(true); 
    }
  };

  // FUNÇÕES DE NAVEGAÇÃO DO WIZARD
  const handleTokenConfirm = () => {
    setStep('upload');
  };

  const handleBack = () => {
    handleRemoveFile();
    setStep('token');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadMessage(null);
    setFinished(false);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  if (showChat) {
    return (
      <div className="h-screen w-full bg-black text-white">
        <OnBotChat onClose={handleCloseChat} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
      
      {/* O Card do Wizard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-blue-900/50 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)] p-8 max-w-lg w-full backdrop-blur-sm text-center"
      >
        <AnimatePresence mode="wait">
          {step === 'token' ? (
            <TokenInput
              key="tokenStep"
              token={token}
              onTokenChange={setToken}
              onConfirm={handleTokenConfirm}
            />
          ) : (
            <CSVUpload
              key="uploadStep"
              onFileSelect={handleFileUpload}
              onBack={handleBack}
              onRemoveFile={handleRemoveFile}
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadMessage={uploadMessage}
              finished={finished}
              token={token}
              companyId={companyId}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ✅ CORRIGIDO: Botão flutuante do Chat (com as classes corretas) */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed left-6 bottom-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all z-50 flex items-center gap-2 group hover:scale-105"
      >
        <img 
          src="/onbot-avatar.png" 
          alt="Falar com OnBot" 
          className="w-8 h-8 rounded-full object-cover border-2 border-white"
        />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
          OnBot Chat
        </span>
      </button>

      {/* ✅ CORRIGIDO: Status do sistema (com as classes corretas) */}
      <div className="fixed right-6 bottom-6 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 z-40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Sistema em tempo real</span>
        </div>
      </div>
    </div>
  );
};

export default App;