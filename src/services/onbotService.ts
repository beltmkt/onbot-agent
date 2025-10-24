// src/services/onbotService.ts
// ✅ VERSÃO CORRIGIDA - CONTEXTO PRESERVADO

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat',
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3
} as const;

// ==================== TIPOS ====================
interface EmpresaSelection {
  numero: number;
  nome: string;
  id: string;
}

interface FileData {
  fileName: string;
  fileSize: number;
  mimeType: string;
  content: string;
  lastModified: number;
  encoding: string;
}

interface WebhookPayload {
  sessionId: string;
  chatInput: string;
  action: string;
  timestamp: string;
  token: string;
  empresa?: string;
  processType?: string;
  fileData?: FileData;
  isEmpresaSelection?: boolean;
  selectedEmpresa?: string;
}

interface ApiResponse {
  success: boolean;
  output?: string;
  response?: string;
  message?: string;
  error?: string;
}

// ==================== UTILITÁRIOS ====================
class FileProcessor {
  static validateFile(file: File): void {
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('O arquivo deve ser um CSV válido');
    }
    if (file.size === 0) {
      throw new Error('O arquivo está vazio');
    }
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Falha ao ler conteúdo do arquivo'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Erro na leitura do arquivo: ${file.name}`));
      };
      
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('Timeout na leitura do arquivo'));
      }, 10000);

      reader.onloadend = () => clearTimeout(timeout);
      
      reader.readAsText(file, 'UTF-8');
    });
  }
}

class SessionManager {
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static validateSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.length > 10 && sessionId.startsWith('session_');
  }
}

class TokenManager {
  static generateToken(): string {
    const randomPart1 = Math.random().toString(36).substr(2, 16);
    const randomPart2 = Math.random().toString(36).substr(2, 16);
    const randomPart3 = Math.random().toString(36).substr(2, 16);
    return `${randomPart1}${randomPart2}${randomPart3}`.substr(0, 48);
  }

  static extractTokenFromMessage(message: string): string | null {
    const tokenPattern = /[a-fA-F0-9]{40,64}/;
    const match = message.match(tokenPattern);
    return match ? match[0] : null;
  }
}

// ==================== FUNÇÕES PRINCIPAIS ====================

// ✅ VARIÁVEL DE ESTADO COMPARTILHADA
let retryCount = 0;

/**
 * 🎯 MÉTODO PRINCIPAL: Envia mensagens e arquivos para o webhook
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    // ✅ RESET DO CONTADOR (usando variável global)
    retryCount = 0;
    
    // Validações básicas
    validateInput(message, sessionId);

    // 🎯 FLUXO 1: PROCESSAMENTO DE ARQUIVO
    if (file) {
      console.log('📁 Arquivo detectado - iniciando processamento...', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      return await processFileUpload(file, sessionId, message);
    }

    // 🎯 FLUXO 2: SELEÇÃO DE EMPRESA
    const empresaSelection = detectEmpresaSelection(message);
    if (empresaSelection) {
      console.log('🏢 Seleção de empresa detectada:', empresaSelection);
      return await sendEmpresaSelection(empresaSelection, sessionId);
    }

    // 🎯 FLUXO 3: MENSAGEM NORMAL
    return await sendChatMessage(message, sessionId);

  } catch (error) {
    console.error('❌ Erro no processamento principal:', error);
    return handleError(error);
  }
};

/**
 * 📤 ENVIA MENSAGEM DE CHAT
 */
const sendChatMessage = async (message: string, sessionId: string): Promise<string> => {
  const payload: WebhookPayload = {
    sessionId: sessionId,
    chatInput: message,
    action: 'chat_message',
    timestamp: new Date().toISOString(),
    token: TokenManager.generateToken()
  };

  console.log('💬 Enviando mensagem de chat:', { message, sessionId });

  const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
  return parseResponse(response);
};

/**
 * 📁 PROCESSAMENTO ROBUSTO DE ARQUIVOS
 */
const processFileUpload = async (file: File, sessionId: string, message: string = ''): Promise<string> => {
  try {
    // 🔒 VALIDAÇÃO DO ARQUIVO
    FileProcessor.validateFile(file);

    // 📖 LEITURA DO CONTEÚDO
    console.log('📖 Lendo conteúdo do arquivo...', file.name);
    const fileContent = await FileProcessor.readFileAsText(file);
    
    console.log('✅ Conteúdo lido com sucesso:', {
      fileName: file.name,
      contentLength: fileContent.length,
      lines: fileContent.split('\n').length
    });

    // 🚀 PREPARAÇÃO DO PAYLOAD
    const payload: WebhookPayload = {
      sessionId: sessionId,
      chatInput: message || `Upload de CSV: ${file.name}`,
      action: 'process_csv',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken(),
      empresa: 'Onboarding | Olha o Mistério',
      processType: 'csv_upload',
      fileData: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        content: fileContent, // ✅ CONTEÚDO REAL DO CSV
        lastModified: file.lastModified,
        encoding: 'utf-8'
      }
    };

    console.log('🚀 Enviando arquivo para processamento:', {
      fileName: file.name,
      sessionId: sessionId,
      contentSize: fileContent.length
    });

    // 📨 ENVIO PARA WEBHOOK
    const response = await makeRequest(CONFIG.DATA_WEBHOOK_URL, payload);
    return parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no processamento do arquivo:', error);
    throw new Error(`Falha no upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * 🏢 PROCESSAMENTO DE SELEÇÃO DE EMPRESA
 */
const sendEmpresaSelection = async (empresa: EmpresaSelection, sessionId: string): Promise<string> => {
  const payload: WebhookPayload = {
    sessionId: sessionId,
    chatInput: `Selecionar empresa: ${empresa.numero} - ${empresa.nome}`,
    action: 'select_empresa',
    timestamp: new Date().toISOString(),
    token: TokenManager.generateToken(),
    empresa: empresa.nome,
    isEmpresaSelection: true,
    selectedEmpresa: empresa.nome
  };

  console.log('🏢 Enviando seleção de empresa:', empresa);

  const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
  return parseResponse(response);
};

/**
 * 🔍 DETECTA SELEÇÃO DE EMPRESA
 */
const detectEmpresaSelection = (message: string): EmpresaSelection | null => {
  const cleanMessage = message.trim();
  
  const empresas = [
    { numero: 1, nome: 'Onboarding', id: 'onboarding' },
    { numero: 2, nome: 'Onboarding | Joinville', id: 'onboarding-joinville' },
    { numero: 3, nome: 'Onboarding | Olha o Mistério', id: 'onboarding-olha-o-misterio' }
  ];

  const selected = empresas.find(emp => emp.numero.toString() === cleanMessage);
  return selected || null;
};

/**
 * 🌐 REQUISIÇÃO HTTP ROBUSTA COM RETRY
 */
const makeRequest = async (url: string, payload: WebhookPayload, attempt: number = 1): Promise<Response> => {
  try {
    console.log(`🌐 Tentativa ${attempt} para:`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
        'X-Request-ID': generateRequestId(),
        'User-Agent': 'OnbotService/2.0.0'
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
 * 🆔 GERA ID ÚNICO PARA REQUISIÇÃO
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 📋 PARSE DA RESPOSTA
 */
const parseResponse = async (response: Response): Promise<string> => {
  const data: ApiResponse = await response.json();
  if (data.output) return data.output;
  if (data.response) return data.response;
  if (data.message) return data.message;
  return 'Processado com sucesso!';
};

/**
 * 🔒 VALIDAÇÃO DE INPUT
 */
const validateInput = (message: string, sessionId: string): void => {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Mensagem inválida ou vazia');
  }

  if (!SessionManager.validateSessionId(sessionId)) {
    throw new Error('Session ID inválido');
  }
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

/**
 * 🧪 TESTE DE CONEXÃO
 */
export const testConnection = async (): Promise<{ 
  status: 'success' | 'error'; 
  message: string; 
  timestamp: string 
}> => {
  try {
    const payload: WebhookPayload = {
      sessionId: SessionManager.generateSessionId(),
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken()
    };

    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { 
        status: 'success', 
        message: '✅ Conexão estabelecida com sucesso',
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

/**
 * 📊 ESTATÍSTICAS DO SERVIÇO
 */
export const getServiceStats = () => {
  return {
    maxFileSize: CONFIG.MAX_FILE_SIZE,
    timeout: CONFIG.TIMEOUT,
    retryAttempts: CONFIG.RETRY_ATTEMPTS,
    version: '2.0.0',
    currentRetryCount: retryCount
  };
};

// ==================== MÉTODOS DE COMPATIBILIDADE ====================

/**
 * @deprecated Use sendMessageToOnbot instead
 */
export const processCSVFile = sendMessageToOnbot;

/**
 * @deprecated Use testConnection instead  
 */
export const testOnbotConnection = testConnection;

// Exportações para uso avançado
export { FileProcessor, SessionManager, TokenManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };