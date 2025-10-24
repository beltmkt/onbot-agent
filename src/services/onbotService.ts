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
}

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  content: string;
}

interface ConnectionTestResult {
  status: 'success' | 'error';
  message: string;
  timestamp: string;
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
    console.log('🚀 [OnBot Service] Enviando mensagem:', { 
      message: message.substring(0, 100), 
      sessionId, 
      hasFile: !!file,
      fileType: file?.type 
    });

    // ✅ FLUXO DE ARQUIVO
    if (file) {
      console.log('📁 [OnBot Service] Processando arquivo:', file.name);
      return await processFileUpload(file, sessionId, message);
    }

    // ✅ FLUXO DE MENSAGEM NORMAL
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: message
    };

    console.log('📤 [OnBot Service] Payload:', payload);
    const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    const result = await parseResponse(response);
    
    console.log('✅ [OnBot Service] Resposta final:', result);
    return result;

  } catch (error) {
    console.error('❌ [OnBot Service] Erro crítico:', error);
    const errorMessage = handleError(error);
    console.log('🔄 [OnBot Service] Retornando mensagem de erro:', errorMessage);
    return errorMessage;
  }
};

/**
 * 📁 PROCESSAMENTO DE ARQUIVO
 */
const processFileUpload = async (file: File, sessionId: string, message: string = ''): Promise<string> => {
  try {
    console.log('📁 [File Upload] Iniciando upload...');

    // 🔒 VALIDAÇÃO
    if (!file) throw new Error('Nenhum arquivo fornecido');
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 📖 LEITURA
    const fileContent = await readFileAsText(file);
    
    console.log('✅ [File Upload] Arquivo lido:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      contentLength: fileContent.length
    });

    // 🚀 PAYLOAD
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

    console.log('📤 [File Upload] Enviando para webhook...');
    const response = await makeRequest(CONFIG.DATA_WEBHOOK_URL, payload);
    const result = await parseResponse(response);
    
    console.log('✅ [File Upload] Upload concluído:', result);
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
    console.log(`🌐 [HTTP Request] Tentativa ${attempt} para:`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [HTTP Request] Timeout na tentativa ${attempt}`);
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

    console.log(`📊 [HTTP Request] Resposta recebida - Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [HTTP Request] Erro HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    return response;

  } catch (error) {
    console.error(`❌ [HTTP Request] Erro na tentativa ${attempt}:`, error);

    if (attempt < CONFIG.RETRY_ATTEMPTS && shouldRetry(error)) {
      console.warn(`🔄 [HTTP Request] Retentativa ${attempt + 1}`);
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
  if (error.message?.includes('timeout')) return true;
  return false;
};

/**
 * 📋 PARSE DA RESPOSTA
 */
const parseResponse = async (response: Response): Promise<string> => {
  try {
    const responseText = await response.text();
    console.log('📄 [Parse Response] Resposta bruta:', responseText);

    // Se a resposta estiver vazia
    if (!responseText.trim()) {
      console.warn('⚠️ [Parse Response] Resposta vazia');
      return '✅ Processado com sucesso!';
    }

    // Tenta parsear como JSON
    let data: ApiResponse;
    try {
      data = JSON.parse(responseText);
      console.log('📊 [Parse Response] JSON parseado:', data);
    } catch (parseError) {
      console.log('📝 [Parse Response] Resposta não é JSON, retornando texto direto');
      return responseText.trim();
    }

    // Extrai a mensagem de diferentes estruturas possíveis
    if (data.output && typeof data.output === 'string') return data.output;
    if (data.response && typeof data.response === 'string') return data.response;
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.text && typeof data.text === 'string') return data.text;
    if (data.error && typeof data.error === 'string') return `Erro: ${data.error}`;
    
    // Se for um objeto complexo, tenta stringify
    if (data.data) {
      return typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
    }

    // Fallback
    console.warn('⚠️ [Parse Response] Estrutura desconhecida, usando fallback');
    return '✅ Processado com sucesso!';

  } catch (error) {
    console.error('❌ [Parse Response] Erro ao processar resposta:', error);
    return '❌ Erro ao processar resposta do servidor';
  }
};

/**
 * 📖 LEITURA DE ARQUIVO
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('✅ [File Reader] Arquivo lido com sucesso');
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      console.error('❌ [File Reader] Erro na leitura do arquivo');
      reject(new Error('Falha na leitura do arquivo'));
    };
    
    reader.onabort = () => {
      console.error('❌ [File Reader] Leitura abortada');
      reject(new Error('Leitura do arquivo abortada'));
    };

    console.log('📖 [File Reader] Lendo arquivo...');
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * 🛑 TRATAMENTO DE ERROS
 */
const handleError = (error: any): string => {
  console.error('🛑 [Error Handler] Processando erro:', error);

  if (error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou muito para responder. Tente novamente.';
  }

  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return '🌐 Erro de conexão: Verifique sua internet e tente novamente.';
  }

  if (error.message?.includes('HTTP 5')) {
    return '🔧 Erro no servidor: Tente novamente em alguns instantes.';
  }

  if (error.message?.includes('HTTP 4')) {
    return '❌ Erro na requisição: Verifique os dados e tente novamente.';
  }

  if (error.message?.includes('arquivo')) {
    return `📁 ${error.message}`;
  }

  return `❌ Erro: ${error.message || 'Erro desconhecido. Tente novamente.'}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

/**
 * 🧪 TESTE DE CONEXÃO
 */
export const testConnection = async (): Promise<ConnectionTestResult> => {
  try {
    console.log('🧪 [Test Connection] Testando conexão...');

    const payload = {
      sessionId: 'health_check_' + Date.now(),
      chatInput: 'health_check'
    };

    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(CONFIG.JWT_TOKEN && { 'Authorization': `Bearer ${CONFIG.JWT_TOKEN}` })
      },
      body: JSON.stringify(payload),
    });

    console.log(`🧪 [Test Connection] Status: ${response.status}`);

    if (response.ok) {
      const result = await response.text();
      console.log('✅ [Test Connection] Conexão estabelecida:', result);
      
      return { 
        status: 'success', 
        message: '✅ Conexão com n8n estabelecida com sucesso',
        timestamp: new Date().toISOString()
      };
    } else {
      const errorText = await response.text();
      console.error('❌ [Test Connection] Erro HTTP:', errorText);
      
      return { 
        status: 'error', 
        message: `❌ Erro HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    console.error('❌ [Test Connection] Erro de conexão:', error);
    
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
    dataWebhookUrl: CONFIG.DATA_WEBHOOK_URL,
    version: '2.0.1'
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
export type { WebhookPayload, ApiResponse, FileData, ConnectionTestResult };