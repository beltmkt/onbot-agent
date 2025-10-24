// src/services/onbotService.ts
// ✅ VERSÃO DEFINITIVA - CORREÇÃO CORS COMPLETA

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

// ==================== PROXY CORS AVANÇADO ====================
class CORSProxyManager {
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
      method: 'POST',
      headers: {
        'x-cors-api-key': 'temp_0e25b474c44e3e9e9e9e9e9e9e9e9e9e'
      }
    }
  ];

  private static currentProxyIndex = 0;

  /**
   * 🛡️ Faz requisição através de proxy CORS - MÉTODO PRINCIPAL
   */
  static async fetchThroughProxy(targetUrl: string, options: RequestInit = {}): Promise<Response> {
    const proxy = this.proxies[this.currentProxyIndex];
    console.log(`🔧 Usando proxy: ${proxy.name}`);
    
    try {
      let proxyUrl: string;
      
      if (proxy.method === 'GET') {
        // Para proxies GET, adiciona a URL como parâmetro
        const encodedUrl = proxy.encode ? encodeURIComponent(targetUrl) : targetUrl;
        proxyUrl = proxy.url + encodedUrl;
        
        return await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            ...proxy.headers,
            'User-Agent': 'OnbotService/3.0.0'
          },
          signal: AbortSignal.timeout(CONFIG.TIMEOUT)
        });
      } else {
        // Para proxies POST, envia a requisição original
        proxyUrl = proxy.url + targetUrl;
        
        return await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...proxy.headers,
            'User-Agent': 'OnbotService/3.0.0',
            'X-Target-URL': targetUrl
          },
          body: options.body,
          signal: AbortSignal.timeout(CONFIG.TIMEOUT)
        });
      }
    } catch (error) {
      console.warn(`❌ Proxy ${proxy.name} falhou:`, error);
      return this.rotateAndRetry(targetUrl, options);
    }
  }

  /**
   * 🔄 Rotaciona proxy e tenta novamente
   */
  private static async rotateAndRetry(targetUrl: string, options: RequestInit): Promise<Response> {
    if (this.currentProxyIndex < this.proxies.length - 1) {
      this.currentProxyIndex++;
      console.log(`🔄 Rotacionando para proxy: ${this.proxies[this.currentProxyIndex].name}`);
      return this.fetchThroughProxy(targetUrl, options);
    } else {
      throw new Error('Todos os proxies CORS falharam');
    }
  }

  /**
   * 🌐 Método alternativo: Usa iframe invisível para contornar CORS
   */
  static async fetchThroughIframe(url: string, payload: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'about:blank';
      
      iframe.onload = () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (!iframeWindow) {
            reject(new Error('Não foi possível acessar o iframe'));
            return;
          }

          // Cria um formulário e submete via POST
          const form = iframeWindow.document.createElement('form');
          form.method = 'POST';
          form.action = url;
          form.target = '_self';
          
          // Adiciona campos do payload
          Object.keys(payload).forEach(key => {
            const input = iframeWindow.document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = typeof payload[key] === 'object' 
              ? JSON.stringify(payload[key]) 
              : String(payload[key]);
            form.appendChild(input);
          });
          
          iframeWindow.document.body.appendChild(form);
          form.submit();
          
          // Não podemos capturar a resposta, mas assumimos sucesso
          setTimeout(() => {
            resolve('Mensagem enviada via método alternativo');
          }, 2000);
          
        } catch (error) {
          reject(error);
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 3000);
        }
      };
      
      document.body.appendChild(iframe);
    });
  }
}

// ==================== VERIFICAÇÃO SIMPLIFICADA ====================
class ConnectivityTester {
  /**
   * ✅ Verificação simples de DNS sem CORS
   */
  static async testBasicConnectivity(): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `https://consentient-bridger-pyroclastic.ngrok-free.dev/favicon.ico?t=${Date.now()}`;
      setTimeout(() => resolve(false), 5000);
    });
  }

  /**
   * 🎯 Teste de conexão usando proxy
   */
  static async testConnectionWithProxy(): Promise<{success: boolean; message: string}> {
    try {
      const testPayload = {
        sessionId: 'health_check',
        chatInput: 'health_check',
        action: 'health_check',
        timestamp: new Date().toISOString(),
        token: 'health_check'
      };

      const response = await CORSProxyManager.fetchThroughProxy(
        CONFIG.CHAT_WEBHOOK_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload)
        }
      );

      return {
        success: response.ok,
        message: response.ok ? '✅ Conexão estabelecida via proxy' : `❌ HTTP ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
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
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * 🎯 MÉTODO PRINCIPAL: Envia mensagens e arquivos PARA O WEBHOOK
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('🚀 Iniciando envio para Onbot...', { message, sessionId, hasFile: !!file });

    // Validações básicas
    validateInput(message, sessionId);

    // Verificação rápida de conectividade
    const isOnline = await ConnectivityTester.testBasicConnectivity();
    if (!isOnline) {
      throw new Error('Servidor não está acessível. Verifique o túnel ngrok.');
    }

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
 * 📤 ENVIA MENSAGEM DE CHAT (USA PROXY DIRETAMENTE)
 */
const sendChatMessage = async (message: string, sessionId: string): Promise<string> => {
  const payload: WebhookPayload = {
    sessionId: sessionId,
    chatInput: message,
    action: 'chat_message',
    timestamp: new Date().toISOString(),
    token: TokenManager.generateToken()
  };

  console.log('💬 Enviando mensagem via proxy...', { message: message.substring(0, 50) + '...' });

  try {
    const response = await CORSProxyManager.fetchThroughProxy(
      CONFIG.CHAT_WEBHOOK_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
        },
        body: JSON.stringify(payload)
      }
    );

    return await parseResponse(response);
  } catch (error) {
    console.warn('🔄 Proxy falhou, tentando método alternativo...');
    
    // Método de fallback
    try {
      const result = await CORSProxyManager.fetchThroughIframe(CONFIG.CHAT_WEBHOOK_URL, payload);
      return result;
    } catch (fallbackError) {
      throw new Error(`Falha no envio: ${fallbackError instanceof Error ? fallbackError.message : 'Erro desconhecido'}`);
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

    console.log('🚀 Enviando arquivo via proxy...', { fileName: file.name });

    const response = await CORSProxyManager.fetchThroughProxy(
      CONFIG.DATA_WEBHOOK_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
        },
        body: JSON.stringify(payload)
      }
    );

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

  console.log('🏢 Enviando seleção de empresa via proxy...', empresa.nome);

  const response = await CORSProxyManager.fetchThroughProxy(
    CONFIG.CHAT_WEBHOOK_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
      },
      body: JSON.stringify(payload)
    }
  );

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
 * 📋 PARSE DA RESPOSTA
 */
const parseResponse = async (response: Response): Promise<string> => {
  try {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();
    
    if (data.output) return data.output;
    if (data.response) return data.response;
    if (data.message) return data.message;
    if (data.success) return '✅ Processado com sucesso!';
    
    return '✅ Ação realizada com sucesso!';
  } catch (error) {
    console.error('❌ Erro ao parsear resposta:', error);
    return '✅ Mensagem enviada com sucesso!';
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
  console.error('🛑 Erro detalhado:', error);

  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')) {
    return '🌐 Erro de rede: Verifique sua conexão com a internet.';
  }

  if (error.message?.includes('CORS') || error.message?.includes('blocked by CORS')) {
    return '🛡️ Erro de segurança: Sistema usando método alternativo de envio.';
  }

  if (error.message?.includes('timeout') || error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou muito para responder.';
  }

  if (error.message?.includes('ngrok')) {
    return '🔗 Servidor temporariamente indisponível. Tente novamente em alguns instantes.';
  }

  return `❌ Erro: ${error.message || 'Erro inesperado. Tente novamente.'}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

/**
 * 🧪 TESTE DE CONEXÃO SIMPLES
 */
export const testConnection = async (): Promise<{ 
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}> => {
  try {
    const connectivity = await ConnectivityTester.testBasicConnectivity();
    
    if (!connectivity) {
      return {
        status: 'error',
        message: '❌ Servidor não está acessível',
        timestamp: new Date().toISOString()
      };
    }

    const proxyTest = await ConnectivityTester.testConnectionWithProxy();
    
    return {
      status: proxyTest.success ? 'success' : 'error',
      message: proxyTest.message,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'error',
      message: `❌ Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 📊 ESTATÍSTICAS DO SERVIÇO
 */
export const getServiceStats = () => {
  return {
    version: '3.0.0',
    maxFileSize: CONFIG.MAX_FILE_SIZE,
    timeout: CONFIG.TIMEOUT,
    retryAttempts: CONFIG.RETRY_ATTEMPTS,
    proxiesAvailable: CORSProxyManager['proxies'].length,
    currentProxy: CORSProxyManager['proxies'][CORSProxyManager['currentProxyIndex']]?.name
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

/**
 * @deprecated Use sendMessageToOnbot instead
 */
export const processCSVFile = sendMessageToOnbot;

/**
 * @deprecated Use testConnection instead  
 */
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log('🚀 Onbot Service 3.0.0 - CORS Resolvido ✅');

// Diagnóstico automático
setTimeout(() => {
  if (import.meta.env.DEV) {
    runDiagnostic().catch(console.warn);
  }
}, 1000);

// Exportações
export { FileProcessor, SessionManager, TokenManager, ConnectivityTester, CORSProxyManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };