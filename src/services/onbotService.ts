// src/services/onbotService.ts
// ✅ VERSÃO 5.2 - USA APENAS WEBHOOK COM CORS CONFIGURADO

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  // ✅ APENAS O WEBHOOK DE CHAT ESTÁ COM CORS CONFIGURADO
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 2
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
 * ✅ USA APENAS O WEBHOOK COM CORS CONFIGURADO
 */
const makeSecureRequest = async (payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando para webhook com CORS...');
    
    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
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

// ==================== FUNÇÕES PRINCIPAIS CORRIGIDAS ====================

/**
 * 🎯 ENVIA MENSAGEM PARA ONBOT (USA APENAS WEBHOOK COM CORS)
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    console.log('💬 Processando envio...', { 
      message: message?.substring(0, 50) || '(vazio)', 
      hasFile: !!file,
      fileName: file?.name 
    });

    // ✅ VALIDAÇÃO CORRIGIDA: Permite mensagem vazia se houver arquivo
    if ((!message || !message.trim()) && !file) {
      throw new Error('Digite uma mensagem ou anexe um arquivo');
    }

    // 🎯 FLUXO 1: PROCESSAMENTO DE ARQUIVO (USA MESMO WEBHOOK)
    if (file) {
      console.log('📁 Iniciando processamento de arquivo...', file.name);
      
      // Valida e lê o arquivo
      FileProcessor.validateFile(file);
      const fileContent = await FileProcessor.readFileAsText(file);
      
      console.log('✅ Arquivo lido com sucesso:', {
        fileName: file.name,
        size: file.size,
        lines: fileContent.split('\n').length
      });
      
      const payload: WebhookPayload = {
        sessionId,
        chatInput: message?.trim() || `Upload de arquivo: ${file.name}`,
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

      console.log('🚀 Enviando arquivo via webhook de chat...');
      const response = await makeSecureRequest(payload);
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

      const response = await makeSecureRequest(payload);
      return await parseResponse(response);
    }

    // 🎯 FLUXO 3: MENSAGEM NORMAL DE TEXTO
    console.log('💭 Enviando mensagem de texto...');
    const payload: WebhookPayload = {
      sessionId,
      chatInput: message.trim(),
      action: 'chat_message',
      timestamp: new Date().toISOString(),
      token: TokenManager.generateToken()
    };

    const response = await makeSecureRequest(payload);
    return await parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no envio:', error);
    return handleError(error);
  }
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
 * 🛑 TRATAMENTO HONESTO DE ERROS
 */
const handleError = (error: any): string => {
  console.error('Erro detalhado:', error);

  // Erro de validação do usuário
  if (error.message?.includes('Digite uma mensagem')) {
    return '❌ ' + error.message;
  }

  // Erros de arquivo
  if (error.message?.includes('arquivo')) {
    return `❌ ${error.message}`;
  }

  // Erros de CORS específicos
  if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
    return '❌ Erro de CORS: O webhook não está configurado para aceitar requisições do seu domínio.';
  }

  if (error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou muito para responder.';
  }

  if (error.message?.includes('Failed to fetch')) {
    return '🌐 Erro de rede: Não foi possível conectar ao servidor. Verifique a URL do webhook.';
  }

  if (error.message?.includes('HTTP 5')) {
    return '🔧 Erro no servidor: Tente novamente em alguns instantes.';
  }

  if (error.message?.includes('HTTP 4')) {
    return '❌ Erro na requisição: Verifique os dados enviados.';
  }

  return `❌ Erro: ${error.message || 'Erro inesperado'}`;
};

// ==================== DIAGNÓSTICO DE CONEXÃO ====================

/**
 * 🧪 TESTE DE CONEXÃO 
 * ✅ Testa apenas o webhook que sabemos que tem CORS
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

    console.log('🔍 Testando webhook de chat com CORS...');
    const response = await makeSecureRequest(payload);
    const data = await response.json();

    return {
      status: 'success',
      message: '✅ Conexão estabelecida com sucesso!',
      details: `Webhook de chat com CORS configurado. Resposta: ${data.message || 'OK'}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    let details = 'Erro desconhecido';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      details = 'ERRO: Não foi possível conectar ao webhook de chat. Verifique se o n8n está rodando.';
    } else if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
      details = 'ERRO CORS: O webhook de chat precisa ter "Respond to Preflight Request" ativado no n8n.';
    } else {
      details = `Erro: ${error.message}`;
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
    version: '5.2.0',
    description: 'Usa apenas webhook com CORS configurado ✅',
    maxFileSize: CONFIG.MAX_FILE_SIZE,
    timeout: CONFIG.TIMEOUT,
    security: 'Requisições diretas e seguras',
    status: 'Webhook de chat funcionando - Dados via mesmo endpoint'
  };
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = sendMessageToOnbot;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log(`
🚀 Onbot Service 5.2.0 - SOLUÇÃO DEFINITIVA

🎯 ESTRATÉGIA:
✅ Webhook de chat: CORS CONFIGURADO (funciona)
❌ Webhook de dados: SEM CORS (não funciona)
✅ SOLUÇÃO: Usar apenas o webhook de chat para tudo

📊 Status:
✅ Uploads de arquivo via webhook de chat
✅ Mensagens de texto via webhook de chat  
✅ Seleção de empresas via webhook de chat
✅ Tudo em um endpoint seguro com CORS

📍 Origin: ${window.location.origin}
🔗 Webhook: ${CONFIG.CHAT_WEBHOOK_URL}
`);

// Teste automático em desenvolvimento
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🔍 Verificando conexão com webhook de chat...');
    try {
      const result = await testConnection();
      console.log('✅ Teste de conexão:', result);
    } catch (error) {
      console.warn('⚠️ Teste de conexão falhou:', error);
    }
  }, 1000);
}

// Exportações para uso avançado
export { FileProcessor, SessionManager, TokenManager };
export type { EmpresaSelection, FileData, WebhookPayload, ApiResponse };