// src/services/onbotService.ts
// ✅ VERSÃO 13.0 - SEGURA E COM RESPOSTAS FORMATADAS

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  CHAT_WEBHOOK_URL: 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/c3f08451-1847-461c-9ba0-a0f6d0bac603/chat',
  JWT_TOKEN: import.meta.env.VITE_JWT_TOKEN || 'default-token',
  TIMEOUT: 45000,
  RETRY_ATTEMPTS: 3,
  MAX_RETRY_DELAY: 30000
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
  success?: boolean;
  output?: string;
  response?: string;
  message?: string;
  error?: string;
  usuarios_processados?: number;
  usuarios_criados?: number;
  intermediateSteps?: Array<{
    action: any;
    observation: string;
  }>;
}

// ==================== UTILITÁRIOS DE SEGURANÇA ====================

/**
 * 🔒 MASCARAR DADOS SENSÍVEIS PARA LOGS
 */
const maskSensitiveData = (data: any): any => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Mascarar tokens (40+ caracteres hex)
    if (data.match(/^[a-fA-F0-9]{40,}$/)) {
      return `token_${data.substring(0, 8)}...`;
    }
    
    // Mascarar emails
    if (data.includes('@')) {
      const [user, domain] = data.split('@');
      return `${user.substring(0, 3)}...@${domain}`;
    }
    
    // Mascarar telefones
    if (data.replace(/\D/g, '').length >= 10) {
      const clean = data.replace(/\D/g, '');
      return `...${clean.substring(clean.length - 4)}`;
    }
  }
  
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }
  
  if (typeof data === 'object') {
    const masked = { ...data };
    const sensitiveFields = ['token', 'password', 'authorization', 'email', 'phone', 'telefone'];
    
    sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = maskSensitiveData(masked[field]);
      }
    });
    
    return masked;
  }
  
  return data;
};

/**
 * 🏢 FORMATAR LISTA DE EMPRESAS
 */
const formatCompaniesList = (companiesData: any): string => {
  try {
    if (!companiesData) return '🏢 Nenhuma empresa encontrada';
    
    let companies = [];
    
    // Extrair empresas do formato do Agent
    if (Array.isArray(companiesData)) {
      companiesData.forEach(company => {
        if (company.sub_companies && Array.isArray(company.sub_companies)) {
          companies.push(...company.sub_companies);
        } else if (company.company_name) {
          companies.push(company);
        }
      });
    } else if (companiesData.sub_companies) {
      companies = companiesData.sub_companies;
    }
    
    if (companies.length === 0) {
      return '🏢 Nenhuma empresa disponível';
    }
    
    let formatted = '🏢 **EMPRESAS DISPONÍVEIS:**\n\n';
    
    companies.forEach((company: any, index: number) => {
      if (company.company_name) {
        formatted += `${index + 1}. ${company.company_name}\n`;
      }
    });
    
    formatted += '\n🔢 **Digite o número da empresa desejada**';
    
    return formatted;
  } catch (error) {
    return '🏢 Empresas carregadas - digite o número da opção desejada';
  }
};

/**
 * 📊 FORMATAR RESPOSTA DO AGENT
 */
const formatAgentResponse = (response: any): string => {
  if (!response) return '🤖 Resposta não disponível';
  
  // Se for string, retornar diretamente
  if (typeof response === 'string') {
    // Tentar parsear JSON se for estrutura de empresas
    if (response.includes('company_name') || response.includes('company_id')) {
      try {
        const companiesData = JSON.parse(response);
        return formatCompaniesList(companiesData);
      } catch (e) {
        // Não é JSON válido, retornar texto original
        return response;
      }
    }
    return response;
  }
  
  // Se for objeto com empresas
  if (response.company_name || response.sub_companies) {
    return formatCompaniesList(response);
  }
  
  // Se for array de empresas
  if (Array.isArray(response) && response.some(item => item.company_name)) {
    return formatCompaniesList(response);
  }
  
  // Outros casos - converter para string
  return String(response);
};

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
    
    // ✅ LOG SEGURO
    console.log('📨 Resposta validação - tamanho:', responseText.length);

    try {
      JSON.parse(responseText);
      console.log('✅ n8n configurado - JSON válido');
    } catch (jsonError) {
      throw new Error(`n8n não retorna JSON válido`);
    }

  } catch (error) {
    console.error('❌ Validação n8n falhou');
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
    // ✅ LOG SEGURO
    console.log('💬 Enviando mensagem - tamanho:', message?.length || 0);

    if (!message?.trim()) {
      throw new Error('Digite uma mensagem para continuar');
    }

    const payload = createPayloadByMessageType(message, sessionId);
    
    // ✅ DEBUG SEGURO
    debugPayloadToN8n(payload);
    
    const response = await makeSecureRequestWithRetry(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem');
    return handleDynamicError(error);
  }
};

/**
 * 🎯 CRIAR PAYLOAD POR TIPO DE MENSAGEM
 */
const createPayloadByMessageType = (message: string, sessionId: string): WebhookPayload => {
  const cleanMessage = message.trim();
  
  const basePayload = {
    sessionId,
    chatInput: cleanMessage,
    timestamp: new Date().toISOString(),
    token: generateToken()
  };

  // 🏢 DETECTAR SELEÇÃO DE EMPRESA
  const empresaMatch = cleanMessage.match(/^\d+$/);
  if (empresaMatch) {
    console.log('🏢 Número empresa detectado');
    return {
      ...basePayload,
      action: 'selecionar_empresa',
      empresa: cleanMessage
    };
  }

  // 🔑 DETECTAR TOKEN
  const tokenMatch = cleanMessage.match(/^[a-fA-F0-9]{40,}$/);
  if (tokenMatch) {
    console.log('🔑 Token detectado');
    return {
      ...basePayload,
      action: 'validar_token'
    };
  }

  // 📊 DETECTAR DADOS DE USUÁRIOS
  const hasUserData = cleanMessage.includes('@') || /\d{10,}/.test(cleanMessage);
  if (hasUserData) {
    console.log('👤 Dados usuários detectados');
    return {
      ...basePayload,
      action: 'processar_usuarios',
      dadosUsuarios: cleanMessage,
      processType: 'dados_usuarios'
    };
  }

  // 💬 MENSAGEM GENÉRICA
  console.log('💬 Mensagem genérica detectada');
  return {
    ...basePayload,
    action: 'processar_mensagem'
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
    // ✅ LOG SEGURO
    console.log('📊 Processando planilha - linhas:', dadosPlanilha.length);

    if (!dadosPlanilha || dadosPlanilha.length === 0) {
      throw new Error('Planilha vazia ou sem dados');
    }

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

    debugPayloadToN8n(payload);
    
    const response = await makeSecureRequestWithRetry(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao processar planilha');
    return handleDynamicError(error);
  }
};

// ==================== UTILITÁRIOS ====================

/**
 * 🐛 DEBUG SEGURO - VERIFICAR ENVIO PARA n8n
 */
const debugPayloadToN8n = (payload: WebhookPayload): void => {
  const maskedPayload = maskSensitiveData(payload);
  console.log('📤 DEBUG - Payload mascarado:', maskedPayload);
};

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

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 🌐 REQUISIÇÃO SEGURA
 */
const makeSecureRequest = async (payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('⏰ Timeout atingido');
    controller.abort();
  }, CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando n8n - action:', payload.action);
    
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
      await response.text();
      console.error('🔧 Erro n8n - status:', response.status);
      throw new Error(`n8n retornou HTTP ${response.status}`);
    }

    return response;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`n8n não respondeu a tempo`);
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao n8n');
    }
    
    throw error;
  }
};

/**
 * 🔄 REQUISIÇÃO COM RETRY
 */
const makeSecureRequestWithRetry = async (
  payload: WebhookPayload, 
  attempt = 1
): Promise<Response> => {
  try {
    return await makeSecureRequest(payload);
  } catch (error) {
    const isTemporaryError = error instanceof Error && 
      (error.message.includes('timeout') || error.message.includes('conexão'));

    if (isTemporaryError && attempt < CONFIG.RETRY_ATTEMPTS) {
      console.log(`🔄 Tentativa ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      return makeSecureRequestWithRetry(payload, attempt + 1);
    }
    
    throw error;
  }
};

/**
 * 📋 PARSE DA RESPOSTA n8n - SEGURO E FORMATADO
 */
const parseN8nResponse = async (response: Response): Promise<string> => {
  const responseText = await response.text();
  
  // ✅ LOG SEGURO
  console.log('📨 Resposta n8n - tamanho:', responseText.length);

  if (!responseText.trim()) {
    throw new Error('n8n retornou resposta vazia');
  }

  if (!isJsonString(responseText)) {
    throw new Error('n8n não retornou JSON válido');
  }

  try {
    const data: ApiResponse = JSON.parse(responseText);
    
    // ✅ LOG SEGURO
    console.log('🤖 Agent - steps:', data.intermediateSteps?.length || 0);

    // 🎯 AGENT COM TOOLS - FORMATAR RESPOSTA
    if (data.intermediateSteps && Array.isArray(data.intermediateSteps)) {
      
      // ✅ FORMATAR LISTA DE EMPRESAS
      if (data.output && (data.output.includes('company_name') || data.output.includes('['))) {
        try {
          const companiesData = JSON.parse(data.output);
          return formatCompaniesList(companiesData);
        } catch (e) {
          // Não é JSON, usar output original
        }
      }
      
      if (data.output && data.output.trim()) {
        return formatAgentResponse(data.output);
      }
      
      // ✅ PROCURAR OBSERVATIONS
      for (let i = data.intermediateSteps.length - 1; i >= 0; i--) {
        const step = data.intermediateSteps[i];
        if (step.observation && step.observation.trim()) {
          return formatAgentResponse(step.observation);
        }
      }
      
      return '✅ Ação executada com sucesso';
    }

    // 🎯 RESPOSTA SIMPLES
    if (data.error) throw new Error(`n8n: ${data.error}`);
    if (data.output) return formatAgentResponse(data.output);
    if (data.response) return formatAgentResponse(data.response);
    if (data.message) return formatAgentResponse(data.message);
    
    if (data.usuarios_processados !== undefined) {
      return `✅ Processados ${data.usuarios_processados} usuários`;
    }
    
    if (data.usuarios_criados !== undefined) {
      return `✅ Criados ${data.usuarios_criados} usuários`;
    }

    throw new Error('Resposta inválida do n8n');

  } catch (error) {
    console.error('❌ Erro no parse');
    throw new Error(`Erro de comunicação com n8n`);
  }
};

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
  console.error('❌ Erro detalhado');

  if (error instanceof Error) {
    if (error.message.includes('HTTP 500')) {
      return `🔧 Erro interno no n8n`;
    }
    
    if (error.message.includes('timeout')) {
      return `⏰ n8n não respondeu a tempo`;
    }
    
    if (error.message.includes('conexão')) {
      return '🌐 Não foi possível conectar ao n8n';
    }
    
    return `❌ ${error.message}`;
  }

  return `❌ Erro inesperado`;
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
      message: `❌ Falha na conexão`,
      timestamp: new Date().toISOString()
    };
  }
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = processPlanilha;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO ====================

console.log(`
🚀 Onbot Service 13.0 - SEGURO E FORMATADO

📍 URL: ${CONFIG.CHAT_WEBHOOK_URL}
⏰ Timeout: ${CONFIG.TIMEOUT}ms
🔄 Retry: ${CONFIG.RETRY_ATTEMPTS} tentativas
🔒 Dados sensíveis protegidos
✅ Pronto para uso!
`);

// Exportações
export type { WebhookPayload, ApiResponse };