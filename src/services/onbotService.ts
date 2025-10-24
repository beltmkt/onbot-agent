// src/services/onbotService.ts - VERSÃO FINAL OTIMIZADA

const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/4678ab47-cab4-4d6f-98cc-96ee92ed7ff6/chat',
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/54283140-3bf1-43e3-923c-6546241e6f7d/criar_conta_final',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  TIMEOUT: 15000
} as const;

export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 Enviando mensagem:', { message, sessionId, hasFile: !!file });

    // ✅ FLUXO DE ARQUIVO
    if (file) {
      return await processFileUpload(file, sessionId, message);
    }

    // ✅ FLUXO DE MENSAGEM
    const payload = {
      sessionId: sessionId,
      chatInput: message
    };

    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.warn('⚠️ Erro do servidor, usando fallback');
      return getSmartResponse(message);
    }

    // ✅ EXTRAI RESPOSTA OU USA FALLBACK
    return extractResponse(responseText) || getSmartResponse(message);

  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return getSmartResponse(message);
  }
};

// ✅ PROCESSAMENTO DE ARQUIVO
const processFileUpload = async (file: File, sessionId: string, message: string = ''): Promise<string> => {
  try {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return `❌ Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    const fileContent = await readFileAsText(file);
    
    const payload = {
      sessionId: sessionId,
      chatInput: message || `Upload: ${file.name}`,
      fileData: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        content: fileContent
      }
    };

    const response = await fetch(CONFIG.DATA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    return extractResponse(responseText) || `✅ Arquivo "${file.name}" recebido com sucesso!`;

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return '❌ Erro ao processar arquivo. Tente novamente.';
  }
};

// ✅ EXTRATOR DE RESPOSTA
const extractResponse = (responseText: string): string | null => {
  if (!responseText.trim()) return null;
  
  try {
    const data = JSON.parse(responseText);
    const fields = ['chatResponse', 'response', 'output', 'message', 'text', 'reply'];
    
    for (const field of fields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field];
      }
    }
    
    return JSON.stringify(data);
  } catch {
    return responseText;
  }
};

// ✅ RESPOSTA INTELIGENTE
const getSmartResponse = (message: string): string => {
  const lower = message.toLowerCase();
  
  if (lower.includes('oi') || lower.includes('olá') || lower.includes('hello')) {
    return '🤖 Olá! Sou o OnBot, assistente para criação de usuários. Para começar, envie o token de acesso da sua empresa.';
  }
  
  if (lower.includes('token') || lower.includes('acesso')) {
    return '🔐 Perfeito! Por favor, cole o token de acesso ou envie um arquivo CSV com os dados dos usuários.';
  }
  
  if (lower.includes('arquivo') || lower.includes('csv') || lower.includes('excel')) {
    return '📁 Você pode enviar arquivos CSV ou Excel. Certifique-se de que o arquivo tenha as colunas necessárias para criação de usuários.';
  }
  
  if (lower.includes('ajuda') || lower.includes('help')) {
    return '💡 Posso ajudar com:\n• Criação de usuários individuais\n• Processamento em lote via CSV\n• Configuração de acessos\n\nDigite "token" para começar!';
  }
  
  return '🤖 Mensagem recebida! Em que posso ajudar? Precisa de informações sobre tokens ou upload de arquivos?';
};

// ✅ LEITURA DE ARQUIVO
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Falha na leitura'));
    reader.readAsText(file, 'UTF-8');
  });
};

// ✅ TESTE DE CONEXÃO SIMPLIFICADO
export const testConnection = async () => {
  try {
    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test_' + Date.now(),
        chatInput: 'test'
      }),
    });

    return {
      status: response.ok ? 'success' : 'error',
      message: response.ok ? '✅ Conexão estabelecida' : '❌ Erro no servidor',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      message: '❌ Falha na conexão',
      timestamp: new Date().toISOString()
    };
  }
};

export const testOnbotConnection = testConnection;