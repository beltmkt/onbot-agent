// src/App.tsx - VERSÃO WIZARD
import React, { useState } from 'react';
// ✅ Importe o AnimatePresence
import { motion, AnimatePresence } from 'framer-motion'; 
import { TokenInput } from './components/TokenInput';
import { CSVUpload } from './components/CSVUpload';
import { uploadCSVToN8N } from './services/csvService';
import { OnBotChat } from './components/OnBotChat';

const App: React.FC = () => {
  // ✅ ESTADOS DO WIZARD
  const [step, setStep] = useState<'token' | 'upload'>('token');
  const [token, setToken] = useState('');
  const [companyId] = useState('C2S');
  
  // ✅ ESTADOS DO UPLOAD (MAIS DETALHADOS)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const [showChat, setShowChat] = useState(false);

  // Lógica de upload (como a sua, mas atualizando os novos estados)
  const handleFileUpload = async (file: File) => {
    if (!token) {
      setUploadMessage('⚠️ Insira o token antes de enviar o CSV.');
      return;
    }
    
    setSelectedFile(file); // Mostra o painel de status
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
      setFinished(true); // Terminou o processo
    }
  };

  // ✅ FUNÇÕES DE NAVEGAÇÃO DO WIZARD
  const handleTokenConfirm = () => {
    // Aqui você poderia validar o token contra uma API se quisesse
    setStep('upload');
  };

  const handleBack = () => {
    // Limpa tudo ao voltar
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
    // O "palco" principal
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
      
      {/* O Card do Wizard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-blue-900/50 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)] p-8 max-w-lg w-full backdrop-blur-sm text-center"
      >
        {/* ✅ A MÁGICA DO WIZARD ACONTECE AQUI */}
        {/* 'mode="wait"' garante que um saia antes do outro entrar */}
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
              // Props de controle
              onFileSelect={handleFileUpload}
              onBack={handleBack}
              onRemoveFile={handleRemoveFile}
              // Props de estado
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadMessage={uploadMessage}
              finished={finished}
              // Props de dados
              token={token}
              companyId={companyId}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Botão flutuante do Chat (sem alteração) */}
      <button onClick={() => setShowChat(true)} ...>
        <img src="/onbot-avatar.png" ... />
        <span ...>OnBot Chat</span>
      </button>

      {/* Status do sistema (sem alteração) */}
      <div className="fixed right-6 bottom-6 ...">
        ...
      </div>
    </div>
  );
};

export default App;