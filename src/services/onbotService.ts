// src/services/onbotService.ts
// ✅ VERSÃO 8.0 - CONEXÃO DINÂMICA EM TEMPO REAL COM n8n

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
  dadosUsuarios?: string;
  isEmpresaSelection?: boolean;
  selectedEmpresa?: string;
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
    sessionId: "health_check_dynamic",
    chatInput: "health_check",
    action: "health_check",
    timestamp: new Date().toISOString(),
    token: "health_check_token"
  };

  try {
    console.log('🔍 Validando conexão dinâmica com n8n...');
    
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
 * 🎯 ENVIA DADOS DESESTRUTURADOS PARA PROCESSAMENTO DINÂMICO
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string
): Promise<string> => {
  try {
    console.log('💬 Processando dados dinamicamente...', { 
      message: message?.substring(0, 100) || '(vazio)',
      sessionId 
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
      return await parseN8nResponse(response);
    }

    // 🎯 PROCESSAMENTO DINÂMICO DE DADOS
    console.log('🔍 Analisando dados dinamicamente para múltiplos usuários...');
    
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
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro no processamento dinâmico:', error);
    return handleDynamicError(error);
  }
};

/**
 * 📊 PROCESSAR PLANILHA DINAMICAMENTE
 */
export const processPlanilha = async (
  dadosPlanilha: string[][],
  sessionId: string,
  empresaSelecionada?: string
): Promise<string> => {
  try {
    console.log('📊 Processando planilha dinamicamente...', { 
      linhas: dadosPlanilha.length,
      empresa: empresaSelecionada,
      sessionId
    });

    if (!dadosPlanilha || dadosPlanilha.length === 0) {
      throw new Error('Planilha vazia ou sem dados');
    }

    // Converter planilha para formato processável
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

    console.log('📋 Dados da planilha convertidos dinamicamente:', textoPlanilha.substring(0, 200) + '...');

    const response = await makeSecureRequest(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao processar planilha dinamicamente:', error);
    return handleDynamicError(error);
  }
};

/**
 * 📝 PROCESSAR DADOS DE TEXTO DINAMICAMENTE
 */
export const processTextData = async (
  texto: string,
  sessionId: string,
  formato: 'csv' | 'json' | 'texto_livre' = 'texto_livre',
  empresaSelecionada?: string
): Promise<string> => {
  try {
    console.log('📝 Processando dados textuais dinamicamente...', { 
      formato,
      sessionId,
      tamanho: texto.length 
    });

    const payload: WebhookPayload = {
      sessionId,
      chatInput: texto.trim(),
      action: 'processar_dados_texto',
      timestamp: new Date().toISOString(),
      token: generateToken(),
      empresa: empresaSelecionada,
      processType: formato,
      dadosUsuarios: texto.trim()
    };

    const response = await makeSecureRequest(payload);
    return await parseN8nResponse(response);

  } catch (error) {
    console.error('❌ Erro ao processar texto dinamicamente:', error);
    return handleDynamicError(error);
  }
};

// ==================== UTILITÁRIOS DINÂMICOS ====================

/**
 * 🔄 CONVERTER PLANILHA PARA TEXTO PROCESSÁVEL
 */
const convertPlanilhaParaTexto = (dadosPlanilha: string[][]): string => {
  const linhasDados = dadosPlanilha.length > 1 ? dadosPlanilha.slice(1) : dadosPlanilha;
  
  const linhasTexto = linhasDados.map(linha => {
    return linha.filter(cell => cell && cell.trim().length > 0).join(', ');
  });

  return linhasTexto.join('\n');
};

/**
 * 🏢 DETECTAR SELEÇÃO DE EMPRESA
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

const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 🌐 REQUISIÇÃO SEGURA DINÂMICA
 */
const makeSecureRequest = async (payload: WebhookPayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    console.log('🌐 Enviando dinamicamente para n8n...', { 
      action: payload.action,
      sessionId: payload.sessionId,
      hasData: !!payload.dadosUsuarios 
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
 * 📋 PARSE DINÂMICO DA RESPOSTA n8n - SEM FALLBACK
 */
const parseN8nResponse = async (response: Response): Promise<string> => {
  const responseText = await response.text();
  
  console.log('📨 Resposta dinâmica do n8n:', {
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
    
    // ✅ PROPAGAR ERROS ESPECÍFICOS DO n8n
    if (data.error) {
      throw new Error(`n8n: ${data.error}`);
    }

    if (!data.success && !data.output && !data.response && !data.message) {
      throw new Error('n8n retornou estrutura JSON inválida');
    }

    // ✅ RETORNAR RESPOSTAS DINÂMICAS DO n8n
    if (data.output) return data.output;
    if (data.response) return data.response;
    if (data.message) return data.message;
    
    if (data.usuarios_processados !== undefined) {
      return `✅ Processados ${data.usuarios_processados} usuários dinamicamente`;
    }
    
    if (data.success) return '✅ Processamento dinâmico concluído';
    
    throw new Error('n8n retornou resposta sem dados processáveis');

  } catch (error) {
    console.error('❌ Erro no parse dinâmico:', error);
    
    if (error instanceof Error) {
      // Manter erros específicos do n8n
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
 * 🛑 TRATAMENTO DINÂMICO DE ERROS
 */
const handleDynamicError = (error: any): string => {
  console.error('❌ Erro dinâmico detalhado:', error);

  // ✅ ERROS ESPECÍFICOS DO n8n
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

// ==================== SERVIÇOS ADICIONAIS DINÂMICOS ====================

export const testConnection = async (): Promise<{ 
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}> => {
  try {
    // ✅ VALIDAR CONEXÃO DINÂMICA PRIMEIRO
    await validateN8nResponse();
    
    const payload: WebhookPayload = {
      sessionId: generateSessionId(),
      chatInput: 'health_check_dynamic',
      action: 'health_check', 
      timestamp: new Date().toISOString(),
      token: generateToken()
    };

    const response = await makeSecureRequest(payload);
    const data = await response.json();

    return {
      status: 'success',
      message: '✅ Conexão dinâmica com n8n estabelecida!',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'error', 
      message: `❌ Falha na conexão dinâmica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    };
  }
};

export const getServiceConfig = () => {
  return {
    version: '8.0.0',
    description: 'Conexão dinâmica em tempo real com n8n',
    capabilities: [
      '🔗 Conexão dinâmica em tempo real com n8n',
      '📊 Processamento de planilhas CSV/Excel',
      '💬 Dados desestruturados em texto livre',
      '👥 Criação múltipla de usuários',
      '🏢 Integração com empresa selecionada',
      '🔄 Conversão automática de formatos',
      '🔍 Validação estrita de JSON'
    ]
  };
};

// ==================== COMPATIBILIDADE ====================

export const processCSVFile = processPlanilha;
export const testOnbotConnection = testConnection;

// ==================== INICIALIZAÇÃO DINÂMICA ====================

// ✅ VALIDAR CONEXÃO NA INICIALIZAÇÃO
console.log(`
🚀 Onbot Service 8.0.0 - CONEXÃO DINÂMICA n8n

🎯 CAPACIDADES DINÂMICAS:
🔗 Conexão em tempo real com n8n
📊 Processamento dinâmico de planilhas  
💬 Dados desestruturados dinâmicos
👥 Criação múltipla dinâmica de usuários
🏢 Integração dinâmica com empresa
🔄 Conversão automática dinâmica
🔍 Validação estrita de JSON

📍 URL: ${CONFIG.CHAT_WEBHOOK_URL}
✅ Conectando dinamicamente com n8n...
`);

// Exportações
export { generateSessionId as SessionManager };
export type { EmpresaSelection, WebhookPayload, ApiResponse };