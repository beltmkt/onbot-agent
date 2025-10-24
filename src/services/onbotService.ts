// src/services/onbotService.ts
// ✅ VERSÃO COMPLETA E CORRIGIDA - DEPLOY READY

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  // ✅ URL CORRETA DO CHAT WEBHOOK
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/4678ab47-cab4-4d6f-98cc-96ee92ed7ff6/chat',
  
  // ✅ URL para upload de arquivos
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
  // ✅ APENAS campos que o n8n espera
}

interface ApiResponse {
  output?: string;
  response?: string;
  message?: string;
  error?: string;
  success?: boolean;
}

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  content: string;
}

// ==================== SERVIÇO PRINCIPAL ====================

/**
 * 🎯 ENVIA MENSAGEM PARA O ONBOT
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 Enviando para OnBot:', { 
      message: message.substring(0, 100), 
      sessionId, 
      hasFile: !!file 
    });

    // ✅ FLUXO DE ARQUIVO
    if (file) {
      return await processFileUpload(file, sessionId, message);
    }

    // ✅ FLUXO DE MENSAGEM NORMAL
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: message
    };

    const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    return parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no OnBot:', error);
    return handleError(error);
  }
};

/**
 * 📁 PROCESSAMENTO DE ARQUIVO
 */
const processFileUpload = async (file: File, sessionId: string, message: string = ''): Promise<string> => {
  try {
    // 🔒 VALIDAÇÃO
    if (!file) throw new Error('Nenhum arquivo fornecido');
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 📖 LEITURA
    const fileContent = await readFileAsText(file);
    
    console.log('✅ Arquivo lido:', {
      fileName: file.name,
      size: file.size,
      contentLength: fileContent.length
    });

    // 🚀 PAYLOAD
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

    const response = await makeRequest(CONFIG.DATA_WEBHOOK_URL, payload);
    return parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * 🌐 REQUISIÇÃO HTTP COM RETRY
 */
const makeRequest = async (url: string, payload: any, attempt: number = 1): Promise<Response> => {
  try {
    console.log(`🌐 Tentativa ${attempt} para:`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

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
      console.warn(`🔄 Retentativa ${attempt + 1} após erro:`, error);
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
  if (error.message?.includes('50')) return true;
  return false;
};

/**
 * 📋 PARSE DA RESPOSTA
 */
const parseResponse = async (response: Response): Promise<string> => {
  const data: ApiResponse = await response.json();
  
  console.log('📊 Resposta parseada:', data);
  
  if (data.output) return data.output;
  if (data.response) return data.response;
  if (data.message) return data.message;
  if (data.success === false && data.error) return data.error;
  
  return '✅ Processado com sucesso!';
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
    return '⏰ Timeout: O servidor demorou muito para responder. Tente novamente.';
  }

  if (error.message?.includes('Failed to fetch')) {
    return '🌐 Erro de conexão: Verifique sua internet e tente novamente.';
  }

  if (error.message?.includes('HTTP 5')) {
    return '🔧 Erro no servidor: Tente novamente em alguns instantes.';
  }

  if (error.message?.includes('HTTP 4')) {
    return '❌ Erro na requisição: Verifique os dados e tente novamente.';
  }

  return `❌ Erro: ${error.message || 'Erro desconhecido'}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

/**
 * 🧪 TESTE DE CONEXÃO
 */
export const testConnection = async (): Promise<{ 
  status: 'success' | 'error'; 
  message: string; 
  timestamp: string 
}> => {
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
        message: '✅ Conexão com n8n estabelecida com sucesso',
        timestamp: new Date().toISOString()
      };
    } else {
      return { 
        status: 'error', 
        message: `❌ Erro HTTP ${response.status}: ${response.statusText}`,
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

/**
 * 📊 ESTATÍSTICAS DO SERVIÇO
 */
export const getServiceStats = () => {
  return {
    maxFileSize: CONFIG.MAX_FILE_SIZE,
    timeout: CONFIG.TIMEOUT,
    retryAttempts: CONFIG.RETRY_ATTEMPTS,
    webhookUrl: CONFIG.CHAT_WEBHOOK_URL,
    version: '2.0.0'
  };
};

// ==================== COMPATIBILIDADE ====================

/**
 * @deprecated Use sendMessageToOnbot instead
 */
export const processCSVFile = sendMessageToOnbot;

/**
 * @deprecated Use testConnection instead  
 */
export const testOnbotConnection = testConnection;

// Exportação dos tipos para uso externo
export type { WebhookPayload, ApiResponse, FileData };