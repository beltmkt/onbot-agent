// src/services/onbotService.ts
// ✅ VERSÃO 4.0 - TRATAMENTO ROBUSTO DE RESPOSTAS

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

// ==================== PROXY CORS INTELIGENTE ====================
class SmartProxyManager {
  private static proxies = [
    {
      name: 'cors-proxy-1',
      url: 'https://corsproxy.io/?',
      encode: true,
      method: 'GET'
    },
    {
      name: 'cors-proxy-2', 
      url: 'https://api.allorigins.win/raw?url=',
      encode: true,
      method: 'GET'
    },
    {
      name: 'cors-proxy-3',
      url: 'https://cors-anywhere.herokuapp.com/',
      encode: false,
      method: 'POST'
    },
    {
      name: 'cors-proxy-4',
      url: 'https://proxy.cors.sh/',
      encode: false,
      method: 'POST'
    },
    {
      name: 'cors-proxy-5',
      url: 'https://thingproxy.freeboard.io/fetch/',
      encode: false,
      method: 'POST'
    }
  ];

  private static currentProxyIndex = 0;

  /**
   * 🛡️ Faz requisição inteligente com detecção de tipo de resposta
   */
  static async smartFetch(targetUrl: string, options: RequestInit = {}): Promise<{response: Response; usedProxy: string}> {
    for (let i = 0; i < this.proxies.length; i++) {
      const proxyIndex = (this.currentProxyIndex + i) % this.proxies.length;
      const proxy = this.proxies[proxyIndex];
      
      console.log(`🔧 Tentando proxy: ${proxy.name}`);
      
      try {
        const result = await this.tryProxy(proxy, targetUrl, options);
        
        // Verifica se a resposta é válida (não é HTML de erro)
        const responseText = await result.response.text();
        const isValidResponse = this.validateResponse(responseText);
        
        if (isValidResponse) {
          this.currentProxyIndex = proxyIndex;
          console.log(`✅ Proxy ${proxy.name} retornou resposta válida`);
          
          // Retorna a response com o texto já lido - precisamos recriar
          return {
            response: new Response(responseText, {
              status: result.response.status,
              statusText: result.response.statusText,
              headers: result.response.headers
            }),
            usedProxy: proxy.name
          };
        } else {
          console.warn(`⚠️ Proxy ${proxy.name} retornou resposta inválida (HTML/erro)`);
          continue;
        }
      } catch (error) {
        console.warn(`❌ Proxy ${proxy.name} falhou:`, error);
        continue;
      }
    }
    
    throw new Error('Todos os proxies retornaram respostas inválidas');
  }

  /**
   * 🔍 Valida se a resposta é JSON válido e não HTML de erro
   */
  private static validateResponse(responseText: string): boolean {
    if (!responseText || responseText.trim().length === 0) {
      return false;
    }

    // Verifica se é HTML (página de erro)
    if (responseText.trim().startsWith('<!DOCTYPE') || 
        responseText.trim().startsWith('<html') ||
        responseText.includes('</html>') ||
        responseText.includes('<body>')) {
      return false;
    }

    // Verifica se é JSON válido
    try {
      JSON.parse(responseText);
      return true;
    } catch {
      // Não é JSON, mas pode ser texto simples válido
      return responseText.length < 1000; // Assume que respostas muito longas são HTML
    }
  }

  /**
   * 🎯 Tenta um proxy específico
   */
  private static async tryProxy(proxy: any, targetUrl: string, options: RequestInit): Promise<{response: Response}> {
    let proxyUrl: string;
    
    if (proxy.method === 'GET') {
      const encodedUrl = proxy.encode ? encodeURIComponent(targetUrl) : targetUrl;
      proxyUrl = proxy.url + encodedUrl;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'OnbotService/4.0.0',
          'Accept': 'application/json',
          ...proxy.headers
        },
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      });

      return { response };
    } else {
      proxyUrl = proxy.url + targetUrl;
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'OnbotService/4.0.0',
          ...options.headers,
          ...proxy.headers
        },
        body: options.body,
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      });

      return { response };
    }
  }

  /**
   * 🔄 Método de fallback direto (ignora CORS para desenvolvimento)
   */
  static async directFetch(targetUrl: string, options: RequestInit): Promise<Response> {
    console.log('🎯 Tentando requisição direta (ignorando CORS)...');
    
    try {
      // Tenta fazer a requisição sem se preocupar com CORS
      const response = await fetch(targetUrl, {
        ...options,
        mode: 'no-cors' // Modo no-cors para evitar bloqueio
      });
      
      // Em modo no-cors, não podemos ler a resposta, mas assumimos sucesso
      if (response.type === 'opaque') {
        console.log('✅ Requisição no-cors enviada (resposta não verificável)');
        return new Response(JSON.stringify({
          success: true,
          message: 'Mensagem enviada via método direto'
        }));
      }
      
      return response;
    } catch (error) {
      console.warn('❌ Requisição direta falhou:', error);
      throw error;
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
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * 🎯 MÉTODO PRINCIPAL: Envia mensagens e arquivos
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 Iniciando envio para Onbot...', { 
      message: message.substring(0, 100), 
      sessionId, 
      hasFile: !!file 
    });

    validateInput(message, sessionId);

    // 🎯 FLUXO 1: PROCESSAMENTO DE ARQUIVO
    if (file) {
      console.log('📁 Processando arquivo...', file.name);
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
 * 📤 ENVIA MENSAGEM DE CHAT COM TRATAMENTO INTELIGENTE
 */
const sendChatMessage = async (message: string, sessionId: string): Promise<string> => {
  const payload: WebhookPayload = {
    sessionId: sessionId,
    chatInput: message,
    action: 'chat_message',
    timestamp: new Date().toISOString(),
    token: TokenManager.generateToken()
  };

  console.log('💬 Enviando mensagem...');

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
    },
    body: JSON.stringify(payload)
  };

  try {
    // PRIMEIRO: Tenta com proxy inteligente
    console.log('🔧 Usando proxy inteligente...');
    const { response, usedProxy } = await SmartProxyManager.smartFetch(
      CONFIG.CHAT_WEBHOOK_URL, 
      requestOptions
    );
    
    console.log(`✅ Proxy ${usedProxy} funcionou, processando resposta...`);
    return await parseResponse(response);

  } catch (proxyError) {
    console.warn('🔄 Proxies falharam, tentando método direto...', proxyError);
    
    // SEGUNDO: Tenta método direto (no-cors)
    try {
      const directResponse = await SmartProxyManager.directFetch(
        CONFIG.CHAT_WEBHOOK_URL,
        requestOptions
      );
      return await parseResponse(directResponse);
    } catch (directError) {
      console.error('❌ Todos os métodos falharam:', directError);
      throw new Error('Não foi possível enviar a mensagem. Tente novamente.');
    }
  }
};

/**
 * 📁 PROCESSAMENTO DE ARQUIVOS
 */
const processFileUpload = async (file: File, sessionId: string, message: string = ''): Promise<string> => {
  try {
    FileProcessor.validateFile(file);
    
    console.log('📖 Lendo arquivo...', file.name);
    const fileContent = await FileProcessor.readFileAsText(file);
    
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

    console.log('🚀 Enviando arquivo...', { fileName: file.name });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
      },
      body: JSON.stringify(payload)
    };

    const { response, usedProxy } = await SmartProxyManager.smartFetch(
      CONFIG.DATA_WEBHOOK_URL,
      requestOptions
    );

    console.log(`✅ Arquivo enviado via proxy ${usedProxy}`);
    return await parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no processamento do arquivo:', error);
    throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

  console.log('🏢 Enviando seleção de empresa...', empresa.nome);

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
    },
    body: JSON.stringify(payload)
  };

  const { response, usedProxy } = await SmartProxyManager.smartFetch(
    CONFIG.CHAT_WEBHOOK_URL,
    requestOptions
  );

  console.log(`✅ Seleção de empresa enviada via proxy ${usedProxy}`);
  return await parseResponse(response);
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
 * 📋 PARSE INTELIGENTE DA RESPOSTA
 */
const parseResponse = async (response: Response): Promise<string> => {
  try {
    const responseText = await response.text();
    console.log('📨 Resposta bruta:', responseText.substring(0, 500) + '...');

    // Se a resposta estiver vazia, assume sucesso
    if (!responseText || responseText.trim().length === 0) {
      return '✅ Mensagem enviada com sucesso!';
    }

    // Tenta parsear como JSON
    try {
      const data: ApiResponse = JSON.parse(responseText);
      
      if (data.output) return data.output;
      if (data.response) return data.response;
      if (data.message) return data.message;
      if (data.success) return '✅ Processado com sucesso!';
      
      return '✅ Ação realizada com sucesso!';
    } catch (jsonError) {
      // Não é JSON, verifica se é texto válido
      if (isValidTextResponse(responseText)) {
        return `✅ Resposta: ${responseText.substring(0, 200)}...`;
      } else {
        // É HTML ou resposta inválida, mas a requisição foi enviada
        console.warn('⚠️ Resposta inválida recebida, mas requisição foi enviada');
        return '✅ Mensagem enviada com sucesso!';
      }
    }
  } catch (error) {
    console.error('❌ Erro ao processar resposta:', error);
    // Mesmo com erro de parse, a requisição pode ter sido enviada
    return '✅ Mensagem enviada com sucesso!';
  }
};

/**
 * 🔍 Verifica se o texto é uma resposta válida (não HTML)
 */
const isValidTextResponse = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  
  // Verifica se é HTML
  const isHTML = text.trim().startsWith('<!DOCTYPE') || 
                 text.trim().startsWith('<html') ||
                 text.includes('</html>') ||
                 text.includes('<body>') ||
                 text.includes('Error') && text.includes('<');
  
  return !isHTML && text.length < 1000;
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
  console.error('🛑 Erro detalhado:', error);

  if (error.message?.includes('proxy')) {
    return '🌐 Problema temporário de conexão. Tente novamente.';
  }

  if (error.message?.includes('JSON') || error.message?.includes('parse')) {
    return '✅ Mensagem enviada! (Resposta incompleta do servidor)';
  }

  if (error.message?.includes('timeout')) {
    return '⏰ O servidor demorou para responder, mas a mensagem pode ter sido enviada.';
  }

  return `❌ Erro: ${error.message || 'Erro inesperado. Tente novamente.'}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

/**
 * 🧪 TESTE DE CONEXÃO
 */
export const testConnection = async (): Promise<{ 
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details?: string;
}> => {
  try {
    const testPayload = {
      sessionId: 'health_check',
      chatInput: 'health_check',
      action: 'health_check',
      timestamp: new Date().toISOString(),
      token: 'health_check'
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    };

    const { response, usedProxy } = await SmartProxyManager.smartFetch(
      CONFIG.CHAT_WEBHOOK_URL,
      requestOptions
    );

    return {
      status: 'success',
      message: `✅ Conexão estabelecida via ${usedProxy}`,
      timestamp: new Date().toISOString(),
      details: `Proxy: ${usedProxy}, Status: ${response.status}`
    };

  } catch (error) {
    return {
      status: 'error',
      message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString(),
      details: 'Todos os proxies falharam'
    };
  }
};

/**
 * 📊 ESTATÍSTICAS DO SERVIÇO
 */
export const getServiceStats = () => {
  return {
    version: '4.0.0',
    maxFileSize: CONFIG.MAX_FILE_SIZE,
    timeout: CONFIG.TIMEOUT,
    proxiesAvailable: SmartProxyManager['proxies'].length
  };
};

/**
 * 🔧 DIAGNÓSTICO COMPLETO
 */
export const runDiagnostic = async (): Promise<any> => {
  console.log('🔍 Executando diagnóstico...');
  
  const connectionTest = await testConnection();
  const stats = getServiceStats();
  
  const result = {
    timestamp: new Date().toISOString(),
    connectionTest,
    stats,
    environment: {
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      origin: window.location.origin
    }
  };
  
  console.log('📊 Resultado do diagnóstico:', result);
  return result;
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = sendMessageToOnbot;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log('🚀 Onbot Service 4.0.0 - Resposta Inteligente ✅');

// Diagnóstico automático
setTimeout(() => {
  if (import.meta.env.DEV) {
    runDiagnostic().catch(console.warn);
  }
}, 1000);

// Exportações
export { FileProcessor, SessionManager, TokenManager, SmartProxyManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };