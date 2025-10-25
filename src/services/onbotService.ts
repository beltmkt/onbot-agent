// src/services/onbotService.ts
// ✅ VERSÃO 10.0 - CONEXÃO DINÂMICA CORRIGIDA COM n8n

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/a3edf1eb-7b77-4835-a685-1c937fc2957b/chat',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 2
} as const;

// ==================== TIPOS ====================
interface WebhookPayload {
  sessionId: string;
  chatInput: string;
  action: string;
  timestamp: string;
  token: string;
  empresa?: string;
  processType?: string;
  dadosUsuarios?: string;
  isPlanilha?: boolean;
  planilhaData?: string[][];
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

// ==================== VALIDAÇÃO DINÂMICA n8n ====================

/**
 * 🔍 VALIDAR SE n8n ESTÁ RETORNANDO JSON VÁLIDO
 */
const validateN8nResponse = async (): Promise<void> => {
  const testPayload = {
    sessionId: "health_check",
    chatInput: "health_check",
    action: "health_check",
    timestamp: new Date().toISOString(),
    token: "health_check_token"
  };

  try {
    console.log('🔍 Validando conexão com n8n...');
    
    const response = await fetch(CONFIG.CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      throw new Error(`n8n retornou HTTP ${response.status}`);
    }

    const responseText = await response.text();
    console.log('📨 Resposta de validação n8n:', responseText.substring(0, 200));

    // ✅ EXIGIR JSON VÁLIDO
    try {
      const data = JSON.parse(responseText);
      
      if (typeof data !== 'object' || data === null) {
        throw new Error('Resposta n8n não é um objeto JSON');
      }
      
      console.log('✅ n8n configurado corretamente - retorna JSON válido');
    } catch (jsonError) {
      throw new Error(`n8n não retorna JSON válido: ${jsonError instanceof Error ? jsonError.message : 'Erro de parse'}`);
    }

  } catch (error) {
    console.error('❌ Validação n8n falhou:', error);
    throw new Error(`Configuração n8n incorreta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * 🎯 ENVIAR MENSAGEM PARA PROCESSAMENTO NO n8n
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string
): Promise<string> => {
  try {
    console.log('💬 Enviando mensagem para n8n...', { 
      message: message?.substring(0, 100) || '(vazio)',
      sessionId 
    });

    if (!message?.trim()) {
      throw new Error('Digite uma mensagem para continuar');
    }

    // 🎯 DETECTAR TIPO DE MENSAGEM E CRIAR PAYLOAD
    const payload = createPayloadByMessageType(message, sessionId);
    
    // 🐛 DEBUG DO PAYLOAD
    debugPayloadToN8n(payload);
    
    const response = await makeSecureRequest(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return handleDynamicError(error);
  }
};

/**
 * 🎯 CRIAR PAYLOAD POR TIPO DE MENSAGEM
 */
const createPayloadByMessageType = (message: string, sessionId: string): WebhookPayload => {
  const cleanMessage = message.trim();
  
  // 🏢 DETECTAR SELEÇÃO DE EMPRESA (1, 2, 3...)
  const empresaMatch = cleanMessage.match(/^\d+$/);
  if (empresaMatch) {
    console.log('🏢 Número de empresa detectado:', cleanMessage);
    return {
      sessionId,
      chatInput: cleanMessage,
      action: 'selecionar_empresa',
      timestamp: new Date().toISOString(),
      token: generateToken(),
      empresa: cleanMessage
    };
  }

  // 🔑 DETECTAR TOKEN (40+ caracteres hex)
  const tokenMatch = cleanMessage.match(/^[a-fA-F0-9]{40,}$/);
  if (tokenMatch) {
    console.log('🔑 Token detectado:', cleanMessage.substring(0, 20) + '...');
    return {
      sessionId,
      chatInput: cleanMessage,
      action: 'validar_token',
      timestamp: new Date().toISOString(),
      token: generateToken()
    };
  }

  // 📊 DETECTAR DADOS DE USUÁRIOS (contém email e/ou telefone)
  const hasUserData = cleanMessage.includes('@') || /\d{10,}/.test(cleanMessage);
  if (hasUserData) {
    console.log('👤 Dados de usuários detectados');
    return {
      sessionId,
      chatInput: cleanMessage,
      action: 'processar_usuarios',
      timestamp: new Date().toISOString(),
      token: generateToken(),
      dadosUsuarios: cleanMessage,
      processType: 'dados_usuarios'
    };
  }

  // 💬 MENSAGEM GENÉRICA
  console.log('💬 Mensagem genérica detectada');
  return {
    sessionId,
    chatInput: cleanMessage,
    action: 'processar_mensagem',
    timestamp: new Date().toISOString(),
    token: generateToken()
  };
};

/**
 * 📊 PROCESSAR PLANILHA
 */
export const processPlanilha = async (
  dadosPlanilha: string[][],
  sessionId: string,
  empresaSelecionada?: string
): Promise<string> => {
  try {
    console.log('📊 Processando planilha...', { 
      linhas: dadosPlanilha.length,
      sessionId 
    });

    if (!dadosPlanilha || dadosPlanilha.length === 0) {
      throw new Error('Planilha vazia ou sem dados');
    }

    // Converter planilha para texto
    const textoPlanilha = convertPlanilhaParaTexto(dadosPlanilha);
    
    const payload: WebhookPayload = {
      sessionId,
      chatInput: textoPlanilha,
      action: 'processar_planilha',
      timestamp: new Date().toISOString(),
      token: generateToken(),
      empresa: empresaSelecionada,
      processType: 'planilha_csv',
      isPlanilha: true,
      planilhaData: dadosPlanilha,
      dadosUsuarios: textoPlanilha
    };

    // 🐛 DEBUG DO PAYLOAD
    debugPayloadToN8n(payload);
    
    const response = await makeSecureRequest(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao processar planilha:', error);
    return handleDynamicError(error);
  }
};

// ==================== UTILITÁRIOS ====================

/**
 * 🐛 DEBUG - VERIFICAR ENVIO PARA n8n
 */
const debugPayloadToN8n = (payload: WebhookPayload): void => {
  console.log('📤 DEBUG - ENVIANDO PARA n8n:', {
    '✅ sessionId': payload.sessionId,
    '✅ chatInput': payload.chatInput?.substring(0, 150) + '...',
    '✅ action': payload.action,
    '🏢 empresa': payload.empresa || 'Não enviada',
    '📊 processType': payload.processType || 'Não especificado',
    '🔑 token': payload.token?.substring(0, 20) + '...',
    '📦 dadosUsuarios': payload.dadosUsuarios ? 'Presente' : 'Ausente',
    '📋 planilhaData': payload.planilhaData ? `${payload.planilhaData.length} linhas` : 'Não'
  });
};

/**
 * 🔄 CONVERTER PLANILHA PARA TEXTO
 */
const convertPlanilhaParaTexto = (dadosPlanilha: string[][]): string => {
  const linhasDados = dadosPlanilha.length > 1 ? dadosPlanilha.slice(1) : dadosPlanilha;
  
  const linhasTexto = linhasDados.map(linha => {
    return linha.filter(cell => cell && cell.trim().length > 0).join(', ');
  });

  return linhasTexto.join('\n');
};

const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 🌐 REQUISIÇÃO SEGURA
 */
const makeSecureRequest = async (payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando para n8n...', { 
      action: payload.action,
      sessionId: payload.sessionId
    });
    
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
      throw new Error(`n8n retornou HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * 📋 PARSE DA RESPOSTA n8n
 */
const parseN8nResponse = async (response: Response): Promise<string> => {
  const responseText = await response.text();
  
  console.log('📨 Resposta do n8n:', {
    tamanho: responseText.length,
    preview: responseText.substring(0, 200),
    isJson: isJsonString(responseText)
  });

  // ✅ VALIDAÇÃO ESTRITA - EXIGIR JSON VÁLIDO
  if (!responseText.trim()) {
    throw new Error('n8n retornou resposta vazia');
  }

  if (!isJsonString(responseText)) {
    throw new Error('n8n não retornou JSON válido. Verifique a configuração do workflow.');
  }

  try {
    const data: ApiResponse = JSON.parse(responseText);
    
    // ✅ PROPAGAR ERROS DO n8n
    if (data.error) {
      throw new Error(`n8n: ${data.error}`);
    }

    if (!data.success && !data.output && !data.response && !data.message) {
      throw new Error('n8n retornou estrutura JSON inválida');
    }

    // ✅ RETORNAR RESPOSTAS DO n8n
    if (data.output) return data.output;
    if (data.response) return data.response;
    if (data.message) return data.message;
    
    if (data.usuarios_processados !== undefined) {
      return `✅ Processados ${data.usuarios_processados} usuários`;
    }
    
    if (data.success) return '✅ Processamento concluído';
    
    throw new Error('n8n retornou resposta sem dados processáveis');

  } catch (error) {
    console.error('❌ Erro no parse:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('n8n')) {
        throw error;
      }
      throw new Error(`Erro de comunicação com n8n: ${error.message}`);
    }
    
    throw new Error('Erro desconhecido na comunicação com n8n');
  }
};

/**
 * 🔍 VALIDAR SE STRING É JSON VÁLIDO
 */
const isJsonString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * 🛑 TRATAMENTO DE ERROS
 */
const handleDynamicError = (error: any): string => {
  console.error('❌ Erro detalhado:', error);

  if (error instanceof Error) {
    if (error.message.includes('n8n')) {
      return `🔧 ${error.message}`;
    }
    
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return '🔧 n8n configurado incorretamente - deve retornar JSON válido';
    }
    
    if (error.message.includes('HTTP')) {
      return `🌐 Erro n8n: ${error.message}`;
    }
    
    if (error.name === 'AbortError') {
      return '⏰ n8n não respondeu a tempo';
    }
    
    if (error.message.includes('Failed to fetch')) {
      return '🌐 n8n indisponível - verifique a conexão';
    }
    
    return `❌ ${error.message}`;
  }

  return `❌ Erro inesperado: ${String(error)}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

export const testConnection = async (): Promise<{ 
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}> => {
  try {
    await validateN8nResponse();
    
    return {
      status: 'success',
      message: '✅ Conexão com n8n estabelecida!',
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
    version: '10.0.0',
    description: 'Conexão dinâmica corrigida com n8n',
    capabilities: [
      '🔗 Conexão direta com n8n',
      '🔑 Detecção automática de token',
      '🏢 Detecção de seleção de empresa', 
      '👤 Processamento de dados de usuários',
      '📊 Processamento de planilhas',
      '💬 Mensagens genéricas',
      '🔍 Validação estrita de JSON'
    ]
  };
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = processPlanilha;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log(`
🚀 Onbot Service 10.0.0 - CONEXÃO CORRIGIDA

🎯 CAPACIDADES:
🔗 Conexão direta com n8n
🔑 Detecção automática de token
🏢 Detecção de seleção de empresa
👤 Processamento de dados de usuários  
📊 Processamento de planilhas
💬 Mensagens genéricas
🔍 Validação estrita de JSON

📍 URL: ${CONFIG.CHAT_WEBHOOK_URL}
✅ Pronto para processamento direto!
`);

// Exportações
export { generateSessionId as SessionManager };
export type { WebhookPayload, ApiResponse };