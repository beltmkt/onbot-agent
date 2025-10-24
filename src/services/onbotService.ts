// src/services/onbotService.ts
// ✅ VERSÃO 5.0 - SOLUÇÃO CORRETA SEM PROXIES

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  // ATENÇÃO: Estas URLs devem ser configuradas no n8n para aceitar CORS
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat',
  DATA_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 2 // Apenas para falhas de rede, não CORS
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

// ==================== UTILITÁRIOS SIMPLES ====================
class FileProcessor {
  static validateFile(file: File): void {
    if (!file) throw new Error('Nenhum arquivo fornecido');
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('O arquivo deve ser um CSV válido');
    }
    if (file.size === 0) throw new Error('O arquivo está vazio');
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
      reader.onerror = () => reject(new Error(`Erro na leitura do arquivo: ${file.name}`));
      reader.readAsText(file, 'UTF-8');
    });
  }
}

class SessionManager {
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class TokenManager {
  static generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

// ==================== REQUISIÇÃO SIMPLES E SEGURA ====================

/**
 * 🌐 Requisição HTTP direta e segura
 * PRÉ-REQUISITO: Servidor n8n deve estar configurado com CORS
 */
const makeSecureRequest = async (url: string, payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando requisição direta para:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
      // mode: 'cors' é o padrão - NÃO use 'no-cors'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * 📋 Parse seguro da resposta
 */
const parseResponse = async (response: Response): Promise<string> => {
  try {
    const data: ApiResponse = await response.json();
    
    if (data.output) return data.output;
    if (data.response) return data.response;
    if (data.message) return data.message;
    if (data.success) return 'Processado com sucesso!';
    
    return 'Ação realizada com sucesso!';
  } catch (error) {
    console.error('Erro ao parsear resposta:', error);
    throw new Error('Resposta inválida do servidor');
  }
};

// ==================== FUNÇÕES PRINCIPAIS SIMPLIFICADAS ====================

/**
 * 🎯 ENVIA MENSAGEM PARA ONBOT (VERSÃO CORRETA)
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('💬 Enviando mensagem...', { message: message.substring(0, 50) });

    // Validações básicas
    if (!message?.trim()) throw new Error('Mensagem inválida ou vazia');

    // 🎯 FLUXO 1: PROCESSAMENTO DE ARQUIVO
    if (file) {
      console.log('📁 Processando arquivo...', file.name);
      FileProcessor.validateFile(file);
      const fileContent = await FileProcessor.readFileAsText(file);
      
      const payload: WebhookPayload = {
        sessionId,
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

      const response = await makeSecureRequest(CONFIG.DATA_WEBHOOK_URL, payload);
      return await parseResponse(response);
    }

    // 🎯 FLUXO 2: SELEÇÃO DE EMPRESA
    const empresaSelection = detectEmpresaSelection(message);
    if (empresaSelection) {
      console.log('🏢 Seleção de empresa detectada:', empresaSelection);
      
      const payload: WebhookPayload = {
        sessionId,
        chatInput: `Selecionar empresa: ${empresaSelection.numero} - ${empresaSelection.nome}`,
        action: 'select_empresa',
        timestamp: new Date().toISOString(),
        token: TokenManager.generateToken(),
        empresa: empresaSelection.nome,
        isEmpresaSelection: true,
        selectedEmpresa: empresaSelection.nome
      };

      const response = await makeSecureRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
      return await parseResponse(response);
    }

    // 🎯 FLUXO 3: MENSAGEM NORMAL
    const payload: WebhookPayload = {
      sessionId,
      chatInput: message,
      action: 'chat_message',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken()
    };

    const response = await makeSecureRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    return await parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no envio:', error);
    return handleError(error);
  }
};

/**
 * 🔍 DETECTA SELEÇÃO DE EMPRESA (TEMPORÁRIO - DEVE VIR DA API)
 */
const detectEmpresaSelection = (message: string): EmpresaSelection | null => {
  const cleanMessage = message.trim();
  
  // TODO: Esta lista deve vir da API, não ser hardcoded
  const empresas = [
    { numero: 1, nome: 'Onboarding', id: 'onboarding' },
    { numero: 2, nome: 'Onboarding | Joinville', id: 'onboarding-joinville' },
    { numero: 3, nome: 'Onboarding | Olha o Mistério', id: 'onboarding-olha-o-misterio' }
  ];

  const selected = empresas.find(emp => emp.numero.toString() === cleanMessage);
  return selected || null;
};

/**
 * 🛑 TRATAMENTO HONESTO DE ERROS
 */
const handleError = (error: any): string => {
  console.error('Erro detalhado:', error);

  // Erros específicos de CORS - indicam problema de configuração no servidor
  if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
    return '❌ Erro de configuração CORS no servidor. Contate o administrador.';
  }

  if (error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou muito para responder.';
  }

  if (error.message?.includes('Failed to fetch')) {
    return '🌐 Erro de rede: Verifique sua conexão com a internet.';
  }

  if (error.message?.includes('HTTP 5')) {
    return '🔧 Erro no servidor: Tente novamente em alguns instantes.';
  }

  if (error.message?.includes('HTTP 4')) {
    return '❌ Erro na requisição: Verifique os dados enviados.';
  }

  return `❌ Erro: ${error.message || 'Erro inesperado'}`;
};

// ==================== DIAGNÓSTICO DE CONFIGURAÇÃO ====================

/**
 * 🧪 TESTE DE CONEXÃO E CORS
 * Este teste vai falhar claramente se o CORS não estiver configurado
 */
export const testConnection = async (): Promise<{ 
  status: 'success' | 'error';
  message: string;
  details: string;
  timestamp: string;
}> => {
  try {
    const payload: WebhookPayload = {
      sessionId: SessionManager.generateSessionId(),
      chatInput: 'health_check',
      action: 'health_check', 
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken()
    };

    const response = await makeSecureRequest(CONFIG.CHAT_WEBHOOK_URL, payload);
    const data = await response.json();

    return {
      status: 'success',
      message: '✅ Conexão estabelecida com sucesso',
      details: `CORS configurado corretamente. Resposta: ${data.message || 'OK'}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    let details = 'Erro desconhecido';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      details = 'ERRO CORS: O servidor não está respondendo às requisições do navegador. Configure CORS no n8n.';
    } else if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
      details = 'ERRO CORS: Requisição bloqueada pelo navegador. Configure "Respond to Preflight Request" no n8n.';
    } else if (error.message?.includes('HTTP')) {
      details = `Servidor respondeu com erro: ${error.message}`;
    } else {
      details = `Erro de rede: ${error.message}`;
    }

    return {
      status: 'error', 
      message: '❌ Falha na conexão',
      details,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 📊 CONFIGURAÇÃO DO SERVIÇO
 */
export const getServiceConfig = () => {
  return {
    version: '5.0.0',
    description: 'Solução correta - Requisições diretas e seguras',
    maxFileSize: CONFIG.MAX_FILE_SIZE,
    timeout: CONFIG.TIMEOUT,
    requiresCors: true,
    security: 'Dados enviados diretamente ao servidor, sem proxies'
  };
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = sendMessageToOnbot;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO E ALERTA ====================

console.log(`
🚀 Onbot Service 5.0.0 - SOLUÇÃO CORRETA

⚠️  PRÉ-REQUISITO CRÍTICO:
O servidor n8n deve estar configurado com CORS:

1. Abra o workflow do n8n
2. Clique no nó Webhook
3. Em "Options", marque:
   ✅ "Respond to Preflight (OPTIONS) Request"
4. Salve e ative o workflow

📊 Status atual: ${window.location.origin}
🔗 Servidor: ${CONFIG.CHAT_WEBHOOK_URL}
`);

// Teste automático em desenvolvimento
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🔍 Verificando configuração CORS...');
    const result = await testConnection();
    console.log('Resultado do teste:', result);
  }, 2000);
}

// Exportações para uso avançado
export { FileProcessor, SessionManager, TokenManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };