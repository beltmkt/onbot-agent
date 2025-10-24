// src/services/onbotService.ts
// ✅ VERSÃO COMPLETA COM SOLUÇÃO CORS

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat',
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
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

// ==================== SOLUÇÃO CORS ====================
class CORSManager {
  private static proxyUrls = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://corsproxy.io/?',
  ];

  private static currentProxyIndex = 0;

  /**
   * 🛡️ Resolve problemas CORS usando proxies
   */
  static async makeCORSRequest(url: string, options: RequestInit): Promise<Response> {
    // Primeiro tenta requisição direta
    try {
      console.log('🔧 Tentando requisição direta...');
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        console.log('✅ Requisição direta bem-sucedida');
        return response;
      }
    } catch (directError) {
      console.log('❌ Requisição direta falhou, usando proxy...', directError);
    }

    // Se falhar, tenta com proxies
    for (let i = 0; i < this.proxyUrls.length; i++) {
      try {
        const proxyUrl = this.proxyUrls[this.currentProxyIndex] + encodeURIComponent(url);
        console.log(`🔧 Tentando com proxy ${this.currentProxyIndex + 1}: ${this.proxyUrls[this.currentProxyIndex]}`);
        
        const response = await fetch(proxyUrl, {
          ...options,
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          console.log(`✅ Proxy ${this.currentProxyIndex + 1} funcionou`);
          return response;
        }
      } catch (proxyError) {
        console.warn(`❌ Proxy ${this.currentProxyIndex + 1} falhou:`, proxyError);
        this.rotateProxy();
      }
    }

    throw new Error('Todos os métodos CORS falharam');
  }

  private static rotateProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyUrls.length;
  }

  /**
   * 🎯 Método alternativo: JSONP para contornar CORS
   */
  static jsonpRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      
      // @ts-ignore
      window[callbackName] = (data: any) => {
        resolve(data);
        // Cleanup
        document.head.removeChild(script);
        // @ts-ignore
        delete window[callbackName];
      };

      const script = document.createElement('script');
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
      script.onerror = reject;
      
      document.head.appendChild(script);
    });
  }
}

// ==================== DIAGNÓSTICO DE CONEXÃO ====================
class ConnectionDiagnostic {
  static async testCORSCompatibility(url: string): Promise<{
    corsEnabled: boolean;
    preflightSuccess: boolean;
    details: string;
  }> {
    try {
      // Teste de preflight OPTIONS
      const preflightResponse = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });

      const corsHeaders = {
        allowOrigin: preflightResponse.headers.get('access-control-allow-origin'),
        allowMethods: preflightResponse.headers.get('access-control-allow-methods'),
        allowHeaders: preflightResponse.headers.get('access-control-allow-headers')
      };

      console.log('🔍 CORS Headers:', corsHeaders);

      return {
        corsEnabled: !!corsHeaders.allowOrigin,
        preflightSuccess: preflightResponse.ok,
        details: corsHeaders.allowOrigin 
          ? `CORS habilitado para: ${corsHeaders.allowOrigin}`
          : 'CORS não habilitado no servidor'
      };

    } catch (error) {
      return {
        corsEnabled: false,
        preflightSuccess: false,
        details: `Erro no preflight CORS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  static async testWebhookConnectivity(): Promise<{
    dnsResolution: boolean;
    serverReachable: boolean;
    corsEnabled: boolean;
    details: string;
  }> {
    const domain = 'consentient-bridger-pyroclastic.ngrok-free.dev';
    
    try {
      // Teste básico de DNS
      const dnsOk = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = `https://${domain}/favicon.ico?t=${Date.now()}`;
        setTimeout(() => resolve(false), 5000);
      });

      if (!dnsOk) {
        return {
          dnsResolution: false,
          serverReachable: false,
          corsEnabled: false,
          details: 'DNS não conseguiu resolver o domínio'
        };
      }

      // Teste CORS
      const corsTest = await this.testCORSCompatibility(CONFIG.CHAT_WEBHOOK_URL);

      return {
        dnsResolution: true,
        serverReachable: corsTest.preflightSuccess,
        corsEnabled: corsTest.corsEnabled,
        details: corsTest.details
      };

    } catch (error) {
      return {
        dnsResolution: false,
        serverReachable: false,
        corsEnabled: false,
        details: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
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

    // Verificação de conectividade antes de processar
    const diagnostic = await ConnectionDiagnostic.testWebhookConnectivity();
    if (!diagnostic.dnsResolution) {
      throw new Error('Servidor não está acessível. Verifique se o túnel ngrok está ativo.');
    }

    console.log('🔍 Diagnóstico CORS:', diagnostic);

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
        content: fileContent,
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
 * 🌐 REQUISIÇÃO HTTP COM SOLUÇÃO CORS
 */
const makeRequest = async (url: string, payload: WebhookPayload, attempt: number = 1): Promise<Response> => {
  try {
    console.log(`🌐 Tentativa ${attempt} - URL:`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
        'X-Request-ID': generateRequestId(),
        'User-Agent': 'OnbotService/2.2.0',
        'Accept': 'application/json',
        // Headers CORS-friendly
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    };

    let response: Response;

    // Na primeira tentativa, verifica CORS
    if (attempt === 1) {
      const corsTest = await ConnectionDiagnostic.testCORSCompatibility(url);
      console.log('🔍 Status CORS:', corsTest);

      if (!corsTest.corsEnabled) {
        console.log('🛡️ CORS não habilitado, usando proxy...');
        response = await CORSManager.makeCORSRequest(url, requestOptions);
      } else {
        console.log('✅ CORS habilitado, requisição direta...');
        response = await fetch(url, { ...requestOptions, mode: 'cors' });
      }
    } else {
      // Tentativas seguintes usam proxy diretamente
      response = await CORSManager.makeCORSRequest(url, requestOptions);
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ Requisição ${attempt} bem-sucedida`);
    return response;

  } catch (error) {
    console.error(`❌ Erro na tentativa ${attempt}:`, error);

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
  if (error instanceof TypeError) return true;
  if (error.message?.includes('Failed to fetch')) return true;
  if (error.message?.includes('NetworkError')) return true;
  if (error.message?.includes('CORS')) return true;
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
  try {
    const data: ApiResponse = await response.json();
    if (data.output) return data.output;
    if (data.response) return data.response;
    if (data.message) return data.message;
    if (data.success) return 'Processado com sucesso!';
    return 'Resposta recebida sem conteúdo específico.';
  } catch (error) {
    console.error('❌ Erro ao parsear resposta:', error);
    return 'Resposta recebida mas não pôde ser processada.';
  }
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
  console.error('🛑 Tratamento de erro:', error);

  if (error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou muito para responder. Tente novamente.';
  }

  if (error instanceof TypeError || error.message?.includes('Failed to fetch')) {
    return '🌐 Erro de conexão: Não foi possível conectar ao servidor.';
  }

  if (error.message?.includes('CORS')) {
    return '🛡️ Erro CORS: O servidor não permite requisições do seu domínio. Usando método alternativo...';
  }

  if (error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
    return '🔗 Erro de DNS: O servidor não está acessível. O túnel ngrok pode ter expirado.';
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
 * 🧪 TESTE DE CONEXÃO COMPLETO
 */
export const testConnection = async (): Promise<{ 
  status: 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
  diagnostic?: any;
  suggestions?: string[];
}> => {
  try {
    // Diagnóstico completo
    const diagnostic = await ConnectionDiagnostic.testWebhookConnectivity();
    const corsTest = await ConnectionDiagnostic.testCORSCompatibility(CONFIG.CHAT_WEBHOOK_URL);
    
    const fullDiagnostic = { ...diagnostic, corsTest };

    if (!diagnostic.dnsResolution) {
      return {
        status: 'error',
        message: '❌ DNS não conseguiu resolver o domínio',
        timestamp: new Date().toISOString(),
        diagnostic: fullDiagnostic,
        suggestions: [
          'Verifique se o túnel ngrok está ativo',
          'O domínio ngrok pode ter expirado - reinicie o ngrok'
        ]
      };
    }

    if (!diagnostic.corsEnabled) {
      return {
        status: 'warning',
        message: '⚠️ Servidor acessível mas CORS não habilitado - usando proxies',
        timestamp: new Date().toISOString(),
        diagnostic: fullDiagnostic,
        suggestions: [
          'O servidor precisa configurar CORS para seu domínio',
          'Sistema usando proxies CORS como fallback'
        ]
      };
    }

    // Teste de requisição real
    const payload: WebhookPayload = {
      sessionId: SessionManager.generateSessionId(),
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken()
    };

    const response = await makeRequest(CONFIG.CHAT_WEBHOOK_URL, payload);

    if (response.ok) {
      return { 
        status: 'success', 
        message: '✅ Conexão estabelecida com sucesso',
        timestamp: new Date().toISOString(),
        diagnostic: fullDiagnostic
      };
    } else {
      return { 
        status: 'error', 
        message: `❌ Erro HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        diagnostic: fullDiagnostic,
        suggestions: ['Verifique o token JWT', 'O webhook pode estar mal configurado']
      };
    }

  } catch (error) {
    return { 
      status: 'error', 
      message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Execute o diagnóstico completo: runDiagnostic()',
        'Verifique se o ngrok está rodando com CORS habilitado'
      ]
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
    version: '2.2.0',
    currentRetryCount: retryCount,
    corsProxies: CORSManager['proxyUrls'].length
  };
};

// ==================== MÉTODOS DE DIAGNÓSTICO ====================

/**
 * 🔧 EXECUTA DIAGNÓSTICO COMPLETO
 */
export const runDiagnostic = async (): Promise<any> => {
  console.log('🔍 Iniciando diagnóstico completo do Onbot Service...');
  
  const connectionTest = await testConnection();
  const webhookDiagnostic = await ConnectionDiagnostic.testWebhookConnectivity();
  const corsTest = await ConnectionDiagnostic.testCORSCompatibility(CONFIG.CHAT_WEBHOOK_URL);
  const stats = getServiceStats();
  
  const diagnosticResult = {
    timestamp: new Date().toISOString(),
    connectionTest,
    webhookDiagnostic,
    corsTest,
    stats,
    environment: {
      hasJwtToken: !!CONFIG.JWT_TOKEN && CONFIG.JWT_TOKEN !== 'default-token',
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      origin: window.location.origin
    }
  };
  
  console.log('📊 Diagnóstico completo:', diagnosticResult);
  return diagnosticResult;
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

// ==================== INICIALIZAÇÃO ====================

// Teste automático de conexão ao carregar o módulo
console.log('🚀 Onbot Service inicializado - versão 2.2.0 com suporte CORS');

// Executa diagnóstico silencioso após 2 segundos
setTimeout(() => {
  if (import.meta.env.DEV) {
    runDiagnostic().catch(console.error);
  }
}, 2000);

// Exportações para uso avançado
export { FileProcessor, SessionManager, TokenManager, ConnectionDiagnostic, CORSManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };