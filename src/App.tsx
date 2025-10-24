// src/App.tsx - VERSÃO COMPLETA COM WEBSOCKET INTEGRADO
import React, { useState, useEffect } from 'react';
import { TokenInput } from './components/TokenInput';
import { CSVUpload } from './components/CSVUpload';
import { uploadCSVToN8N } from './services/csvService';
import { UploadCloud, CheckCircle, MessageCircle } from 'lucide-react';
import { OnBotChat } from './components/OnBotChat';
import WebSocketChatClient from './services/websocket-client';

const App: React.FC = () => {
  const [token, setToken] = useState('');
  const [companyId] = useState('C2S');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [wsClient, setWsClient] = useState<WebSocketChatClient | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // ✅ INICIALIZAR WEBSOCKET QUANDO O APP CARREGAR
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const sessionId = 'session_' + Date.now();
        const client = new WebSocketChatClient(sessionId);
        
        await client.connect();
        setWsClient(client);
        setIsWsConnected(true);
        
        console.log('✅ WebSocket conectado com sucesso!');
        
        // Configurar handler de mensagens
        client.onMessage((message) => {
          console.log('📨 Mensagem recebida via WebSocket:', message);
          // Aqui você pode processar mensagens do n8n se necessário
        });

      } catch (error) {
        console.error('❌ Erro ao conectar WebSocket:', error);
        setIsWsConnected(false);
      }
    };

    initializeWebSocket();

    // Cleanup na desmontagem
    return () => {
      if (wsClient) {
        wsClient.disconnect();
      }
    };
  }, []);

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
        
        // ✅ OPÇÃO: Enviar notificação via WebSocket se quiser
        if (wsClient && isWsConnected) {
          wsClient.sendMessage(`CSV enviado: ${file.name}`);
        }
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

  const handleOpenChat = () => {
    setShowChat(true);
    
    // ✅ Notificar via WebSocket que o chat foi aberto
    if (wsClient && isWsConnected) {
      wsClient.sendMessage('Usuário abriu o chat OnBot');
    }
  };

  if (showChat) {
    return (
      <div className="h-screen w-full bg-black text-white">
        <OnBotChat onClose={handleCloseChat} wsClient={wsClient} />
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

      {/* 🔥 BOTÃO FLUTUANTE DO CHAT - ATUALIZADO */}
      <button
        onClick={handleOpenChat}
        className={`fixed left-6 bottom-6 rounded-full p-3 shadow-lg transition-all z-50 flex items-center gap-2 group hover:scale-105 ${
          isWsConnected 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        {isWsConnected ? (
          <MessageCircle className="w-8 h-8 text-white" />
        ) : (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
            <span className="text-xs">⚡</span>
          </div>
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-white">
          {isWsConnected ? 'OnBot Chat' : 'Conectando...'}
        </span>
        
        {/* Indicador de status */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          isWsConnected ? 'bg-green-500' : 'bg-gray-500'
        }`}></div>
      </button>

      {/* 🔥 STATUS DO SISTEMA EM TEMPO REAL - ATUALIZADO */}
      <div className="fixed right-6 bottom-6 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 z-40">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isWsConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span>{isWsConnected ? 'WebSocket Conectado' : 'Conectando WebSocket...'}</span>
        </div>
      </div>
    </div>
  );
};

export default App;