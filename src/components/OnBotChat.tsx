import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, RefreshCw, Bot, User, Maximize2, Minimize2, Upload, FileText, CheckCircle } from 'lucide-react';
// CORREÇÃO: Funções de serviço simuladas (mock) para resolver o erro de dependência.
// Em produção, essas funções viriam do arquivo '../services/onbotService'.

// URL de Avatar Simulado para corrigir o erro de importação
const onbotAvatar = 'https://placehold.co/32x32/1E293B/A5F3FC/png?text=Bot'; 

// Funções de Serviço Simuladas
const testOnbotConnection = async () => ({ status: 'connected' });
const sendMessageToOnbot = async (message: string, sessionId: string): Promise<string> => {
    // Simulação de resposta do agente/backend (incluindo o JSON de sucesso para o teste de UX)
    if (message.toLowerCase().includes('token') && !message.includes('bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5')) {
        return "Token inválido. Tente novamente.";
    }
    if (message.toLowerCase().includes('sucesso')) {
         // Simulação de JSON de sucesso (Lei Suprema do Fluxo)
        return `Perfeito! Os dados estão prontos. Enviando para a automação... \`\`\`json { \t"final_creation_payload": true, \t"company_id": "309bacc2e1f3ba32317a015ee6670435", \t"company_name": "Onboarding | BotChat", \t"auth_token": "bf18117f82dfafb9354109b4b4b4f8cc1804d8cecca2e8dad5", \t"usuarios": [ \t\t{ "name": "Usuário Teste", "email": "user@test.com", "phone": "11999999999", "is_master": "sim" } \t] } \`\`\``;
    }
    if (message.length > 50) {
        return "Dados brutos recebidos. Processando...";
    }
    return "Obrigado! Por favor, envie os dados dos usuários (Nome, Email, Telefone, É Master) ou anexe uma planilha.";
};
const processPlanilha = async (data: any, sessionId: string): Promise<string> => "Planilha recebida e dados extraídos. Enviando para validação final.";

interface OnBotChatProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  hasPlanilha?: boolean;
}

// Componente para notificação de sucesso flutuante (Toast)
const SuccessToast: React.FC<{ companyName: string, onDismiss: () => void }> = React.memo(({ companyName, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 6000); // Desaparece após 6 segundos
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 p-4 bg-gradient-to-r from-green-600 to-cyan-600 text-white rounded-xl shadow-2xl z-50 border border-green-400/50 flex items-center gap-3 animate-fade-down cursor-pointer" onClick={onDismiss}>
            <CheckCircle className="w-6 h-6" />
            <div>
                <strong className="block text-lg">✅ Automação Iniciada com Sucesso!</strong>
                <p className="text-sm">A criação de usuários para **{companyName}** começou em segundo plano.</p>
            </div>
        </div>
    );
});


export const OnBotChat: React.FC<OnBotChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: '👋 Olá! Sou o OnBot e vou te ajudar a criar novos usuários.\n\n📊 **Posso processar:**\n• Token de acesso\n• Dados de usuários em texto\n• Planilhas CSV/Excel\n\n🔑 Para começar, me envie o token de acesso da sua empresa.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // NOVO ESTADO: Controla o Toast de sucesso
  const [workflowSuccess, setWorkflowSuccess] = useState<{ status: boolean, companyName: string }>({ status: false, companyName: '' });


  // ✅ Verificar conexão ao inicializar
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      try {
        const result = await testOnbotConnection();
        if (result.status === 'connected') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('error');
      }
    };
    checkConnection();
  }, []);

  // Scroll automático para novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages]);

  // ✅ Efeito de digitação mais suave (usando useCallback para estabilidade)
  const addTypingEffect = useCallback(async (message: string, delay: number = 20) => {
    return new Promise<void>((resolve) => {
      let currentText = '';
      let index = 0;

      const typingMessageId = `typing_${Date.now()}`;
      setMessages(prev => [...prev, {
        id: typingMessageId,
        sender: 'bot',
        text: '',
        timestamp: new Date(),
        isTyping: true
      } as ChatMessage]);

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
          setMessages(prev => prev.map(msg => 
            msg.id === typingMessageId 
              ? { ...msg, isTyping: false }
              : msg
          ));
          resolve();
        }
      }, delay);
    });
  }, [setMessages]);


  // ✅ Processar upload de planilha (Lógica mantida, apenas refatorada para useCallback)
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['.csv', '.xlsx', '.xls', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.some(type => file.name.toLowerCase().includes(type) || file.type.includes(type))) {
      await addTypingEffect('❌ Formato não suportado. Use CSV ou Excel.');
      return;
    }

    setLoading(true);

    try {
      const userMessage: ChatMessage = { 
        id: `file_${Date.now()}`,
        sender: 'user', 
        text: `📎 Enviando planilha: ${file.name}`,
        timestamp: new Date(),
        hasPlanilha: true
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Leitura do arquivo como texto (para enviar ao n8n/Agente)
      const text = await file.text();
      // Simulação de dados para preview
      // const linhas = text.split('\n').filter(line => line.trim()).map(line => line.split(',').map(cell => cell.trim()));
      
      // Enviar o texto CSV bruto para o serviço (simulação)
      const resultado = await processPlanilha(text, sessionId);
      
      await addTypingEffect(resultado);

    } catch (error) {
      console.error('❌ Erro ao processar planilha:', error);
      await addTypingEffect('❌ Erro ao processar planilha. Tente novamente.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [addTypingEffect, sessionId]);

  // ✅ Tratamento de envio (Lógica de detecção de sucesso)
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessageText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    const userMessage: ChatMessage = { 
      id: `msg_${Date.now()}_user`,
      sender: 'user', 
      text: userMessageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const botResponse = await sendMessageToOnbot(userMessageText, sessionId);
      
      // 🚨 LÓGICA DE DETECÇÃO DE SUCESSO (UX OTIMIZADA)
      // Detecta o JSON de finalização gerado pelo Agente
      const jsonMatch = botResponse.match(/```json\s*([\s\S]*?)```/);
      const responseText = jsonMatch ? JSON.parse(jsonMatch[1].trim()) : {};
      
      if (responseText.final_creation_payload) {
        // O Agente enviou o JSON de sucesso (final_creation_payload)
        
        // 1. Aciona o Toast (Feedback Visual Instantâneo)
        setWorkflowSuccess({
          status: true,
          companyName: responseText.company_name || 'Automação'
        });

        // 2. Resposta do Bot (Feedback Conversacional)
        const finalMessage = `🎉 Recebi o lote de ${responseText.usuarios.length} usuários! A automação para **${responseText.company_name}** foi disparada com sucesso. Você pode me enviar o próximo token ou precisar de ajuda com outra tarefa?`;
        await addTypingEffect(finalMessage);

      } else {
        // Resposta normal ou passo intermediário do Agente (solicitação de token/empresa)
        await addTypingEffect(botResponse);
      }
      
    } catch (error) {
      console.error('❌ Erro na comunicação:', error);
      let errorMessage = '❌ Desculpe, ocorreu um erro. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = '⏰ Tempo esgotado. A automação não respondeu.';
        }
      }
      await addTypingEffect(errorMessage);
      
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

  const formatMessageText = (text: string) => {
    // Função para processar formatação Markdown (negrito)
    return text.split('\n').map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line.split('**').map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="text-cyan-300">{part}</strong> : part
        )}
      </div>
    ));
  };

  const renderConnectionStatus = () => {
    // Lógica de status de conexão (mantida)
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />
            <span className="text-xs text-yellow-300">Conectando...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-300">Conectado</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-xs text-red-300">Offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  const chatDimensions = isExpanded 
    ? 'w-[500px] h-[700px]' 
    : 'w-[400px] h-[550px]';

  return (
    <>
      {/* Renderiza o Toast de Sucesso se o workflow foi acionado */}
      {workflowSuccess.status && (
        <SuccessToast 
          companyName={workflowSuccess.companyName} 
          onDismiss={() => setWorkflowSuccess({ status: false, companyName: '' })} 
        />
      )}

      <div className={`fixed inset-0 m-auto ${chatDimensions} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-cyan-500/20 flex flex-col z-50 backdrop-blur-sm transition-all duration-300`}>
        
        {/* Header Tecnológico (Mantido) */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <img 
                src={onbotAvatar} 
                alt="OnBot" 
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 bg-green-400 animate-pulse"></div>
            </div>
            <div>
              <span className="font-bold text-white text-sm drop-shadow-lg">OnBot AI</span>
              {renderConnectionStatus()}
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 backdrop-blur-sm"
              title={isExpanded ? "Reduzir" : "Expandir"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área de Mensagens (Mantida) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm backdrop-blur-sm border ${
                  msg.sender === 'user'
                    ? msg.hasPlanilha
                      ? 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white shadow-lg border-purple-400/30'
                      : 'bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white shadow-lg border-blue-400/30'
                    : msg.sender === 'system'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/20'
                    : msg.isTyping
                    ? 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-100 border-gray-500/30'
                    : 'bg-gradient-to-r from-gray-750/80 to-gray-700/80 text-gray-100 border-gray-600/30 shadow-lg'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {msg.sender === 'user' ? (
                    <div className="flex items-center gap-2">
                      {msg.hasPlanilha ? <FileText className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      <span className="text-xs opacity-70 font-medium">
                        {msg.hasPlanilha ? 'Planilha' : 'Você'}
                      </span>
                    </div>
                  ) : msg.sender === 'system' ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-xs opacity-70 font-medium">Sistema</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-xs opacity-70 font-medium">OnBot AI</span>
                    </div>
                  )}
                  {msg.isTyping && (
                    <div className="flex gap-1 ml-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
                
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {formatMessageText(msg.text)}
                </div>
              </div>
            </div>
          ))}
        <div ref={chatEndRef} />
        </div>

        {/* Área de Input - COM UPLOAD DE PLANILHA (Mantida) */}
        <div className="p-4 border-t border-cyan-500/20 bg-gradient-to-t from-gray-800 to-gray-900/80 backdrop-blur-sm rounded-b-2xl">
          {/* Botão de Upload (Mantido) */}
          <div className="flex gap-2 mb-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl px-3 py-2 text-xs text-white transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Upload Planilha
            </button>
            <div className="flex-1 text-xs text-cyan-300/70 flex items-center">
              📊 Suporta CSV e Excel
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite token, dados de usuários ou comandos... (Shift+Enter para nova linha)"
                className="w-full bg-gray-700/80 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-200 backdrop-blur-sm resize-none disabled:opacity-50"
                disabled={loading}
                rows={3}
                style={{ 
                  minHeight: '60px',
                  maxHeight: '120px'
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-cyan-300/50">
                {inputMessage.length}/500
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl p-3 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center mb-1 group"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};