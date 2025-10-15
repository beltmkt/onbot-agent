import React, { useState } from 'react';
import { TokenInput } from './components/TokenInput';
import { CSVUpload } from './components/CSVUpload';
import { uploadCSVToN8N } from './services/csvService';
import { UploadCloud, CheckCircle, MessageSquare } from 'lucide-react';
import { OnBotChat } from './components/OnBotChat';
import { ChatInput } from './components/ChatInput';

const App: React.FC = () => {
  const [token, setToken] = useState('');
  const [companyId] = useState('C2S');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!token) {
      setUploadStatus('⚠️ Insira o token antes de enviar o CSV.');
      return;
    }

    setUploadStatus('⏳ Enviando arquivo para o servidor...');
    try {
      const result = await uploadCSVToN8N(file, token);

      if (result.success) {
        setUploadStatus(`✅ ${result.mensagem || 'Arquivo processado com sucesso!'}`);
      } else {
        setUploadStatus(`❌ ${result.mensagem || 'Falha no envio do arquivo'}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('❌ Erro de conexão. Tente novamente.');
    }
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 space-y-10">
      {/* 🔹 Cabeçalho */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <UploadCloud className="w-14 h-14 text-blue-400" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-full"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold">C2S - Create Sellers</h1>
        <p className="text-gray-400 text-sm">
          Envie o token e o arquivo CSV para criar usuários automaticamente.
        </p>
      </div>

      {/* 🔹 Corpo */}
      <div className="w-full max-w-md space-y-8">
        {/* Token */}
        <TokenInput token={token} onTokenChange={setToken} />

        {/* Upload CSV */}
        <CSVUpload token={token} companyId={companyId} onFileSelect={handleFileUpload} />

        {/* Status do upload */}
        {uploadStatus && (
          <div
            className={`p-4 rounded-xl text-center transition-all duration-300 ${
              uploadStatus.startsWith('✅')
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : uploadStatus.startsWith('⚠️')
                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{uploadStatus}</span>
            </div>
          </div>
        )}
      </div>

    {/* 🔥 BOTÃO FLUTUANTE NA LATERAL ESQUERDA */}
<button
  onClick={() => setShowChat(true)}
  className="fixed left-6 bottom-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all z-50 flex items-center gap-2 group hover:scale-105"
>
  <img 
    src="onbot-avatar.png" 
    alt="Falar com OnBot" 
    className="w-8 h-8 rounded-full object-cover border-2 border-white"
  />
  <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
    OnBot Chat
  </span>
</button>

      {/* 🔥 STATUS DO SISTEMA EM TEMPO REAL (NOVO) */}
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