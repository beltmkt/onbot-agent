// src/services/onbotService.ts
// ✅ VERSÃO 6.0 - PROCESSAMENTO INTELIGENTE DE DADOS DESESTRUTURADOS

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/a3edf1eb-7b77-4835-a685-1c937fc2957b/chat',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2
} as const;

// ==================== TIPOS ====================
interface EmpresaSelection {
  numero: number;
  nome: string;
  id: string;
}

interface WebhookPayload {
  sessionId: string;
  chatInput: string;
  action: string;
  timestamp: string;
  token: string;
  empresa?: string;
  processType?: string;
  dadosUsuarios?: string; // Dados brutos desestruturados
  isEmpresaSelection?: boolean;
  selectedEmpresa?: string;
}

interface ApiResponse {
  success: boolean;
  output?: string;
  response?: string;
  message?: string;
  error?: string;
  usuarios_processados?: number;
  usuarios_criados?: number;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * 🎯 ENVIA DADOS DESESTRUTURADOS PARA PROCESSAMENTO INTELIGENTE
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string
): Promise<string> => {
  try {
    console.log('💬 Processando dados desestruturados...', { 
      message: message?.substring(0, 100) || '(vazio)'
    });

    if (!message?.trim()) {
      throw new Error('Forneça os dados dos usuários para criação');
    }

    // 🎯 DETECTAR SE É SELEÇÃO DE EMPRESA
    const empresaSelection = detectEmpresaSelection(message);
    if (empresaSelection) {
      console.log('🏢 Seleção de empresa detectada:', empresaSelection);
      
      const payload: WebhookPayload = {
        sessionId,
        chatInput: `Selecionar empresa: ${empresaSelection.numero} - ${empresaSelection.nome}`,
        action: 'select_empresa',
        timestamp: new Date().toISOString(),
        token: generateToken(),
        empresa: empresaSelection.nome,
        isEmpresaSelection: true,
        selectedEmpresa: empresaSelection.nome
      };

      const response = await makeSecureRequest(payload);
      return await parseResponse(response);
    }

    // 🎯 PROCESSAMENTO DE DADOS DESESTRUTURADOS
    console.log('🔍 Analisando dados desestruturados para múltiplos usuários...');
    
    const payload: WebhookPayload = {
      sessionId,
      chatInput: message.trim(),
      action: 'processar_dados_desestruturados',
      timestamp: new Date().toISOString(),
      token: generateToken(),
      dadosUsuarios: message.trim(),
      processType: 'criacao_multipla_usuarios'
    };

    const response = await makeSecureRequest(payload);
    return await parseResponse(response);

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    return handleError(error);
  }
};

// ==================== UTILITÁRIOS ====================
const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
 * 🌐 REQUISIÇÃO SEGURA
 */
const makeSecureRequest = async (payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando dados para processamento inteligente...');
    
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
 * 📋 PARSE DA RESPOSTA
 */
const parseResponse = async (response: Response): Promise<string> => {
  try {
    const data: ApiResponse = await response.json();
    
    if (data.output) return data.output;
    if (data.response) return data.response;
    if (data.message) return data.message;
    
    // Resposta com métricas de processamento
    if (data.usuarios_processados !== undefined) {
      return `✅ Processados ${data.usuarios_processados} usuários, ${data.usuarios_criados} criados com sucesso!`;
    }
    
    if (data.success) return 'Processado com sucesso!';
    
    return 'Ação realizada com sucesso!';
  } catch (error) {
    console.error('Erro ao parsear resposta:', error);
    throw new Error('Resposta inválida do servidor');
  }
};

/**
 * 🛑 TRATAMENTO DE ERROS
 */
const handleError = (error: any): string => {
  console.error('Erro detalhado:', error);

  if (error.message?.includes('Forneça os dados')) {
    return '❌ ' + error.message;
  }

  if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
    return '❌ Erro de configuração no servidor.';
  }

  if (error.name === 'AbortError') {
    return '⏰ Timeout: O servidor demorou para responder.';
  }

  if (error.message?.includes('Failed to fetch')) {
    return '🌐 Erro de rede: Verifique a conexão.';
  }

  return `❌ Erro: ${error.message || 'Erro inesperado'}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

export const testConnection = async (): Promise<{ 
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}> => {
  try {
    const payload: WebhookPayload = {
      sessionId: generateSessionId(),
      chatInput: 'health_check',
      action: 'health_check', 
      timestamp: new Date().toISOString(),
      token: generateToken()
    };

    const response = await makeSecureRequest(payload);
    const data = await response.json();

    return {
      status: 'success',
      message: '✅ Conexão estabelecida!',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'error', 
      message: `❌ Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const getServiceConfig = () => {
  return {
    version: '6.0.0',
    description: 'Processamento inteligente de dados desestruturados',
    capabilities: [
      'Criação múltipla de usuários',
      'Processamento sensitivo de dados',
      'Detecção automática de padrões',
      'Integração com empresa selecionada'
    ]
  };
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = sendMessageToOnbot;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log(`
🚀 Onbot Service 6.0.0 - PROCESSAMENTO INTELIGENTE

🎯 NOVA CAPACIDADE:
✅ Processamento sensitivo de dados desestruturados
✅ Criação múltipla de usuários 
✅ Detecção automática de padrões
✅ Integração direta com empresa selecionada

📍 Pronto para receber dados em qualquer formato!
`);

// Exportações
export { generateSessionId as SessionManager };
export type { EmpresaSelection, WebhookPayload, ApiResponse };