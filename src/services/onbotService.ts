// src/services/onbotService.ts
// ✅ VERSÃO 11.0 - COMPLETA E CORRIGIDA

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/a3edf1eb-7b77-4835-a685-1c937fc2957b/chat',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
  TIMEOUT: 45000, // Aumentado para 45 segundos
  RETRY_ATTEMPTS: 3,
  MAX_RETRY_DELAY: 30000 // 30 segundos máximo
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
    
    const response = await makeSecureRequestWithRetry(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return handleDynamicError(error);
  }
};

/**
 * 🎯 CRIAR PAYLOAD POR TIPO DE MENSAGEM - SCHEMA CORRIGIDO
 */
const createPayloadByMessageType = (message: string, sessionId: string): WebhookPayload => {
  const cleanMessage = message.trim();
  
  // 🎯 FORMATO SIMPLIFICADO E PADRONIZADO
  const basePayload = {
    sessionId,
    chatInput: cleanMessage,
    timestamp: new Date().toISOString(),
    token: generateToken()
  };

  // 🏢 DETECTAR SELEÇÃO DE EMPRESA (1, 2, 3...)
  const empresaMatch = cleanMessage.match(/^\d+$/);
  if (empresaMatch) {
    console.log('🏢 Número de empresa detectado:', cleanMessage);
    return {
      ...basePayload,
      action: 'selecionar_empresa',
      empresa: cleanMessage
    };
  }

  // 🔑 DETECTAR TOKEN (40+ caracteres hex)
  const tokenMatch = cleanMessage.match(/^[a-fA-F0-9]{40,}$/);
  if (tokenMatch) {
    console.log('🔑 Token detectado:', cleanMessage.substring(0, 20) + '...');
    return {
      ...basePayload,
      action: 'validar_token'
    };
  }

  // 📊 DETECTAR DADOS DE USUÁRIOS (contém email e/ou telefone)
  const hasUserData = cleanMessage.includes('@') || /\d{10,}/.test(cleanMessage);
  if (hasUserData) {
    console.log('👤 Dados de usuários detectados');
    return {
      ...basePayload,
      action: 'processar_usuarios',
      dadosUsuarios: cleanMessage,
      processType: 'dados_usuarios'
    };
  }

  // 💬 MENSAGEM GENÉRICA - SCHEMA SIMPLIFICADO
  console.log('💬 Mensagem genérica detectada');
  return {
    ...basePayload,
    action: 'processar_mensagem'
  };
};

/**
 * 🧪 PAYLOAD MÍNIMO PARA TESTE DE SCHEMA
 */
const createMinimalPayload = (message: string, sessionId: string): WebhookPayload => {
  return {
    sessionId,
    chatInput: message.trim(),
    action: 'chat',
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
    
    const response = await makeSecureRequestWithRetry(payload);
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
 * 🌐 REQUISIÇÃO SEGURA - COM MELHOR DIAGNÓSTICO DE ERRO
 */
const makeSecureRequest = async (payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('⏰ Timeout atingido - abortando requisição');
    controller.abort();
  }, CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando para n8n...', { 
      action: payload.action,
      sessionId: payload.sessionId,
      timeout: CONFIG.TIMEOUT
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

    // 🎯 CAPTURAR DETALHES DO ERRO 500
    if (!response.ok) {
      let errorDetails = '';
      
      try {
        const errorText = await response.text();
        errorDetails = errorText.substring(0, 500); // Limitar tamanho
        console.error('🔧 Detalhes do erro n8n:', errorDetails);
      } catch (textError) {
        errorDetails = 'Não foi possível ler resposta de erro';
      }
      
      throw new Error(`n8n retornou HTTP ${response.status}: ${response.statusText}. Detalhes: ${errorDetails}`);
    }

    return response;

  } catch (error) {
    clearTimeout(timeoutId);
    
    // 🎯 TRATAMENTO ESPECÍFICO PARA ABORT ERROR
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('⏰ Requisição abortada por timeout:', CONFIG.TIMEOUT);
      throw new Error(`n8n não respondeu dentro do tempo limite (${CONFIG.TIMEOUT}ms)`);
    }
    
    // 🔗 TRATAMENTO PARA ERROS DE REDE
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Erro de conexão:', error);
      throw new Error('Não foi possível conectar ao n8n - verifique a conexão de rede');
    }
    
    throw error;
  }
};

/**
 * 🔄 REQUISIÇÃO COM RETRY INTELIGENTE PARA QUOTA LIMITS
 */
const makeSecureRequestWithRetry = async (
  payload: WebhookPayload, 
  attempt = 1
): Promise<Response> => {
  try {
    return await makeSecureRequest(payload);
  } catch (error) {
    // 🎯 DETECTAR ERRO DE QUOTA EXCEDIDA
    const isQuotaError = error instanceof Error && 
      (error.message.includes('quota') || 
       error.message.includes('rate limit') ||
       error.message.includes('429') ||
       error.message.includes('too many requests'));

    // 🎯 DETECTAR ERROS TEMPORÁRIOS
    const isTemporaryError = error instanceof Error && 
      (error.message.includes('timeout') || 
       error.message.includes('conexão') ||
       error.message.includes('rede'));

    // 🎯 DETECTAR ERRO DE SCHEMA
    const isSchemaError = error instanceof Error && 
      (error.message.includes('tool input') || 
       error.message.includes('schema') ||
       error.message.includes('did not match'));

    // ⏰ BACKOFF EXPONENCIAL PARA QUOTA ERRORS
    if (isQuotaError && attempt < CONFIG.RETRY_ATTEMPTS) {
      const backoffTime = Math.min(1000 * Math.pow(2, attempt), CONFIG.MAX_RETRY_DELAY);
      console.log(`🔄 Quota excedida - Retry ${attempt} em ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return makeSecureRequestWithRetry(payload, attempt + 1);
    }

    // 🔄 RETRY PARA ERROS TEMPORÁRIOS
    if (isTemporaryError && attempt < CONFIG.RETRY_ATTEMPTS) {
      console.log(`🔄 Tentativa ${attempt + 1} de ${CONFIG.RETRY_ATTEMPTS}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      return makeSecureRequestWithRetry(payload, attempt + 1);
    }

    // 🔧 TENTAR PAYLOAD SIMPLIFICADO PARA ERROS DE SCHEMA
    if (isSchemaError && attempt === 1) {
      console.log('🔄 Tentando com payload simplificado...');
      const minimalPayload = createMinimalPayload(payload.chatInput, payload.sessionId);
      return makeSecureRequestWithRetry(minimalPayload, attempt + 1);
    }
    
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
    
    if (data.usuarios_criados !== undefined) {
      return `✅ Criados ${data.usuarios_criados} usuários`;
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
 * 🛑 TRATAMENTO DE ERROS - VERSÃO COMPLETA
 */
const handleDynamicError = (error: any): string => {
  console.error('❌ Erro detalhado:', error);

  if (error instanceof Error) {
    // 🎯 ERRO DE SCHEMA - TOOL INPUT
    if (error.message.includes('tool input') || error.message.includes('schema') || error.message.includes('did not match')) {
      return `🔧 Problema de configuração no n8n: Schema das ferramentas não corresponde.\n\nSoluções:\n• Verifique os "Tools" no agente LangChain\n• Valide os schemas de input\n• Teste com payload simplificado`;
    }
    
    // 🎯 ERRO 500 - PROBLEMA INTERNO DO n8n
    if (error.message.includes('HTTP 500')) {
      return `🔧 Erro interno no n8n (500). Verifique:\n\n• ✅ Workflow está ativado?\n• ✅ Credenciais da API configuradas?\n• ✅ Modelo LLM disponível?\n• ✅ Logs do n8n para detalhes`;
    }
    
    // 🎯 ERRO DE QUOTA EXCEDIDA
    if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429') || error.message.includes('too many requests')) {
      return `📊 Cota da API excedida. Aguarde alguns minutos ou altere para outro modelo no n8n.`;
    }
    
    // 🎯 ERROS DE TIMEOUT
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return `⏰ n8n não respondeu após ${CONFIG.TIMEOUT}ms. Tente novamente.`;
    }
    
    // 🌐 ERROS DE CONEXÃO
    if (error.message.includes('Failed to fetch') || error.message.includes('conexão') || error.message.includes('rede')) {
      return '🌐 Não foi possível conectar ao n8n. Verifique sua conexão de rede.';
    }
    
    // 📋 ERROS DE JSON
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return '🔧 n8n configurado incorretamente - deve retornar JSON válido';
    }
    
    // 🔧 ERROS DO n8n
    if (error.message.includes('n8n')) {
      return `🔧 ${error.message}`;
    }
    
    return `❌ ${error.message}`;
  }

  return `❌ Erro inesperado: ${String(error)}`;
};

// ==================== SERVIÇOS ADICIONAIS ====================

/**
 * 🧪 TESTE DE SCHEMA DO n8n
 */
export const testN8nSchema = async (): Promise<string> => {
  const testPayloads = [
    // Payload mínimo
    {
      sessionId: "test-schema",
      chatInput: "hello",
      action: "test",
      timestamp: new Date().toISOString(),
      token: "test-token"
    },
    // Payload com dados extras
    {
      sessionId: "test-schema-2", 
      chatInput: "test message",
      action: "chat",
      timestamp: new Date().toISOString(),
      token: "test-token-2",
      additionalData: "should be ignored if not in schema"
    }
  ];

  for (const payload of testPayloads) {
    try {
      console.log('🧪 Testando payload:', JSON.stringify(payload));
      const response = await makeSecureRequest(payload as WebhookPayload);
      const result = await response.text();
      console.log('✅ Payload funcionou:', payload.action);
      return `✅ Schema testado com sucesso: ${payload.action}`;
    } catch (error) {
      console.log('❌ Payload falhou:', payload.action, error);
    }
  }

  return '❌ Todos os testes de schema falharam';
};

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
    version: '11.0.0',
    description: 'Versão completa e corrigida com tratamento de schema',
    capabilities: [
      '🔗 Conexão direta com n8n',
      '🔑 Detecção automática de token',
      '🏢 Detecção de seleção de empresa', 
      '👤 Processamento de dados de usuários',
      '📊 Processamento de planilhas',
      '💬 Mensagens genéricas',
      '🔍 Validação estrita de JSON',
      '🔄 Sistema de retry inteligente',
      '🎯 Tratamento de erros de schema',
      '📊 Monitoramento de quota',
      '🧪 Teste de schema automático'
    ]
  };
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = processPlanilha;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log(`
🚀 Onbot Service 11.0.0 - VERSÃO COMPLETA E CORRIGIDA

🎯 CAPACIDADES:
🔗 Conexão direta com n8n
🔑 Detecção automática de token
🏢 Detecção de seleção de empresa
👤 Processamento de dados de usuários  
📊 Processamento de planilhas
💬 Mensagens genéricas
🔍 Validação estrita de JSON
🔄 Sistema de retry inteligente
🎯 Tratamento de erros de schema
📊 Monitoramento de quota
🧪 Teste de schema automático

📍 URL: ${CONFIG.CHAT_WEBHOOK_URL}
⏰ Timeout: ${CONFIG.TIMEOUT}ms
🔄 Retry: ${CONFIG.RETRY_ATTEMPTS} tentativas
✅ Pronto para processamento direto!
`);

// Exportações
export { generateSessionId as SessionManager };
export type { WebhookPayload, ApiResponse };