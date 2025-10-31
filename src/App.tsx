import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
// AVISO: Estes componentes e serviços devem estar disponíveis nos caminhos definidos
import { TokenInput } from './components/TokenInput';
import { CSVUpload } from './components/CSVUpload';
import { uploadCSVToN8N } from './services/csvService';
import { OnBotChat } from './components/OnBotChat';

const App: React.FC = () => {
  // Estado para controlar a etapa do wizard (qual componente mostrar)
  const [step, setStep] = useState<'token' | 'upload'>('token');
  
  // Estados compartilhados
  const [token, setToken] = useState('');
  const [companyId] = useState('C2S'); // Você pode mudar isso se precisar
  
  // Estados de Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  // Estado do Chat
  const [showChat, setShowChat] = useState(false);

  // Lógica de Upload (chamada pelo CSVUpload)
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

  // Funções de Navegação do Wizard
  const handleTokenConfirm = () => {
    setStep('upload'); // Avança para a etapa de upload
  };

  const handleBack = () => {
    handleRemoveFile(); // Limpa o estado do upload
    setStep('token'); // Volta para a etapa de token
  };

  // Limpa o estado do upload (usado ao voltar ou ao enviar novo)
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadMessage(null);
    setFinished(false);
  };

  /**
   * NOVA FUNÇÃO: Reseta o estado de upload, o TOKEN e volta para a etapa 'token' (Home).
   */
  const handleFinishAndHome = () => {
    handleRemoveFile(); // Limpa todos os estados relacionados ao upload
    setToken(''); // LIMPA O TOKEN CONFORME SOLICITADO
    setStep('token'); // Volta para o passo inicial
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  // Renderiza o Chat em tela cheia se ativo
  if (showChat) {
    return (
      <div className="h-screen w-full bg-black text-white">
        <OnBotChat onClose={handleCloseChat} />
      </div>
    );
  }

  // Renderização principal (O Wizard)
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
      
      {/* O Card principal que serve como "palco" */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-[#0b0b0b] to-[#111] border border-blue-900/50 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)] p-8 max-w-lg w-full backdrop-blur-sm text-center"
      >
        {/* A AnimatePresence controla a transição suave */}
        <AnimatePresence mode="wait">
          {step === 'token' ? (
            // Etapa 1: Mostrar TokenInput
            <TokenInput
              key="tokenStep"
              token={token}
              onTokenChange={setToken}
              onConfirm={handleTokenConfirm}
            />
          ) : (
            // Etapa 2: Mostrar CSVUpload
            <CSVUpload
              key="uploadStep"
              onFileSelect={handleFileUpload}
              onBack={handleBack}
              onRemoveFile={handleRemoveFile}
              onFinishAndHome={handleFinishAndHome} // <--- FUNÇÃO DE HOME PASSADA AQUI
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

      {/* Botão flutuante do Chat */}
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

      {/* Status do sistema */}
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
