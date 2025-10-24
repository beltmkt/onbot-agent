// src/services/onbotService.ts - VERSÃO CORRIGIDA PARA CHAT TRIGGER

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/4678ab47-cab4-4d6f-98cc-96ee92ed7ff6/chat',
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/54283140-3bf1-43e3-923c-6546241e6f7d/criar_conta_final',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || '',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
} as const;

// ==================== TIPOS ====================
interface WebhookPayload {
  sessionId: string;
  chatInput: string;
  fileData?: FileData;
}

interface ApiResponse {
  output?: string;
  response?: string;
  message?: string;
  text?: string;
  error?: string;
  success?: boolean;
  data?: any;
  executionStarted?: boolean;
  executionId?: string;
  // ✅ NOVOS CAMPOS PARA CHAT TRIGGER
  chatResponse?: string;
  result?: string;
  answers?: string[];
  reply?: string;
}

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  content: string;
}

// ==================== SERVIÇO PRINCIPAL ====================

/**
 * 🎯 ENVIA MENSAGEM PARA O ONBOT - VERSÃO CHAT TRIGGER
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 [Chat Trigger] Enviando mensagem:', { 
      message, 
      sessionId, 
      hasFile: !!file 
    });

    // ✅ FLUXO DE ARQUIVO
    if (file) {
      return await processFileUpload(file, sessionId, message);
    }

    // ✅ FLUXO DE MENSAGEM NORMAL - CHAT TRIGGER
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: message
    };

    console.log('📤 [Chat Trigger] Payload:', payload);
    const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    const result = await parseChatTriggerResponse(response, sessionId);
    
    console.log('✅ [Chat Trigger] Resposta final:', result);
    return result;

  } catch (error) {
    console.error('❌ [Chat Trigger] Erro crítico:', error);
    return handleError(error);
  }
};

/**
 * 📋 PARSE ESPECÍFICO PARA CHAT TRIGGER
 */
const parseChatTriggerResponse = async (response: Response, sessionId: string): Promise<string> => {
  try {
    const responseText = await response.text();
    console.log('📄 [Chat Trigger] Resposta bruta:', responseText);

    if (!responseText.trim()) {
      return '🤖 Olá! Como posso ajudá-lo hoje?';
    }

    let data: ApiResponse;
    try {
      data = JSON.parse(responseText);
      console.log('📊 [Chat Trigger] JSON parseado:', data);
    } catch (parseError) {
      console.log('📝 [Chat Trigger] Resposta não é JSON');
      return responseText.trim();
    }

    // ✅ TENTATIVA 1: Buscar resposta direta do Chat Trigger
    const directResponse = extractChatResponse(data);
    if (directResponse) {
      console.log('✅ [Chat Trigger] Resposta direta encontrada');
      return directResponse;
    }

    // ✅ TENTATIVA 2: Se for confirmação de execução, tentar buscar resultado
    if (data.executionStarted && data.executionId) {
      console.log('🔄 [Chat Trigger] Execução iniciada, tentando buscar output...');
      const executionResult = await tryGetExecutionOutput(data.executionId, sessionId);
      if (executionResult) {
        return executionResult;
      }
    }

    // ✅ TENTATIVA 3: Fallback para respostas comuns
    return getFallbackResponse(data, sessionId);

  } catch (error) {
    console.error('❌ [Chat Trigger] Erro no parse:', error);
    return '🤖 Mensagem recebida! Estou processando sua solicitação...';
  }
};

/**
 * 🔍 EXTRAI RESPOSTA DO CHAT TRIGGER
 */
const extractChatResponse = (data: ApiResponse): string | null => {
  // ✅ Padrões comuns de resposta do Chat Trigger
  if (data.chatResponse && typeof data.chatResponse === 'string') {
    return data.chatResponse;
  }
  if (data.response && typeof data.response === 'string') {
    return data.response;
  }
  if (data.output && typeof data.output === 'string') {
    return data.output;
  }
  if (data.message && typeof data.message === 'string') {
    return data.message;
  }
  if (data.text && typeof data.text === 'string') {
    return data.text;
  }
  if (data.reply && typeof data.reply === 'string') {
    return data.reply;
  }
  if (data.result && typeof data.result === 'string') {
    return data.result;
  }
  if (data.answers && Array.isArray(data.answers) && data.answers.length > 0) {
    return data.answers[0];
  }
  
  return null;
};

/**
 * 🔄 TENTA BUSCAR OUTPUT DA EXECUÇÃO
 */
const tryGetExecutionOutput = async (executionId: string, sessionId: string): Promise<string | null> => {
  try {
    console.log(`🔄 [Execution Output] Buscando output para: ${executionId}`);
    
    // Espera um pouco para o processamento
    await delay(1500);
    
    // Tenta buscar o resultado com um payload especial
    const payload = {
      sessionId: sessionId,
      chatInput: `get_output_${executionId}`,
      executionId: executionId,
      action: 'get_output'
    };

    const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    const responseText = await response.text();
    
    console.log('📄 [Execution Output] Resposta da busca:', responseText);
    
    if (responseText && !responseText.includes('executionStarted')) {
      return responseText;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ [Execution Output] Erro ao buscar output:', error);
    return null;
  }
};

/**
 * 🆘 RESPOSTA DE FALLBACK
 */
const getFallbackResponse = (data: ApiResponse, sessionId: string): string => {
  // Se tiver algum dado, tenta extrair
  if (data.data) {
    if (typeof data.data === 'string') return data.data;
    if (data.data.message) return data.data.message;
    if (data.data.response) return data.data.response;
  }
  
  // Se for sucesso sem dados específicos
  if (data.success === true) {
    return '✅ Solicitação processada com sucesso! Como posso ajudar em seguida?';
  }
  
  // Se tiver execution ID mas não conseguiu resposta
  if (data.executionId) {
    return `🔄 Processando sua solicitação (ID: ${data.executionId.substring(0, 8)}...)`;
  }
  
  // Fallback genérico
  return '🤖 Olá! Recebi sua mensagem. Em que posso ajudá-lo?';
};

// ==================== FUNÇÕES AUXILIARES (MANTIDAS) ====================

/**
 * 📁 PROCESSAMENTO DE ARQUIVO
 */
const processFileUpload = async (file: File, sessionId: string, message: string = ''): Promise<string> => {
  try {
    console.log('📁 [File Upload] Iniciando upload...');

    if (!file) throw new Error('Nenhum arquivo fornecido');
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    const fileContent = await readFileAsText(file);
    
    const payload = {
      sessionId: sessionId,
      chatInput: message || `Upload do arquivo: ${file.name}`,
      fileData: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        content: fileContent
      }
    };

    const response = await makeRequest(CONFIG.DATA_WEBHOOK_URL, payload);
    const result = await parseChatTriggerResponse(response, sessionId);
    
    return result;

  } catch (error) {
    console.error('❌ [File Upload] Erro no upload:', error);
    throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * 🌐 REQUISIÇÃO HTTP COM RETRY
 */
const makeRequest = async (url: string, payload: any, attempt: number = 1): Promise<Response> => {
  try {
    console.log(`🌐 [HTTP] Tentativa ${attempt} para:`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONFIG.JWT_TOKEN && { 'Authorization': `Bearer ${CONFIG.JWT_TOKEN}` })
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;

  } catch (error) {
    if (attempt < CONFIG.RETRY_ATTEMPTS && shouldRetry(error)) {
      await delay(1000 * attempt);
      return makeRequest(url, payload, attempt + 1);
    }
    throw error;
  }
};

/**
 * ⏰ DELAY PARA RETRY
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 🔄 DECIDE SE DEVE TENTAR NOVAMENTE
 */
const shouldRetry = (error: any): boolean => {
  if (error.name === 'AbortError') return true;
  if (error.message?.includes('Failed to fetch')) return true;
  if (error.message?.includes('Network')) return true;
  if (error.message?.includes('50')) return true;
  return false;
};

/**
 * 📖 LEITURA DE ARQUIVO
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Falha na leitura do arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * 🛑 TRATAMENTO DE ERROS
 */
const handleError = (error: any): string => {
  if (error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou muito para responder.';
  }
  if (error.message?.includes('Failed to fetch')) {
    return '🌐 Erro de conexão: Verifique sua internet.';
  }
  if (error.message?.includes('HTTP 5')) {
    return '🔧 Erro no servidor: Tente novamente em alguns instantes.';
  }
  return `❌ Erro: ${error.message || 'Erro desconhecido'}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

export const testConnection = async () => {
  try {
    const payload = {
      sessionId: 'health_check_' + Date.now(),
      chatInput: 'health_check'
    };

    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { 
        status: 'success', 
        message: '✅ Conexão com n8n estabelecida',
        timestamp: new Date().toISOString()
      };
    } else {
      return { 
        status: 'error', 
        message: `❌ Erro HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    return { 
      status: 'error', 
      message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    };
  }
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = sendMessageToOnbot;
export const testOnbotConnection = testConnection;

export type { WebhookPayload, ApiResponse, FileData };