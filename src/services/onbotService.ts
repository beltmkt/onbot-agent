// src/services/onbotService.ts - VERSÃO COM INTEGRAÇÃO N8N CORRIGIDA
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  file?: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const sendMessageToOnbot = async (message: string, sessionId: string, file?: File): Promise<string> => {
  try {
    console.log('🔄 OnBot - Iniciando processamento:', { message, sessionId, hasFile: !!file });

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
    const N8N_WEBHOOK_DATA_URL = 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/dados_recebidos';

    // 🔥 ESTRATÉGIA 1: Se tem arquivo CSV, enviar PARA N8N APENAS (fluxo do Agente IA)
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      console.log('📁 CSV detectado - enviando para n8n (Agente IA):', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('originalMessage', message);
      formData.append('source', 'onbot_chat');
      formData.append('timestamp', new Date().toISOString());
      formData.append('process_type', 'csv_planilha');

      const response = await fetch(N8N_WEBHOOK_DATA_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar CSV para n8n: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Resposta do n8n (Agente IA) para CSV:', responseData);
      return extractResponseText(responseData);
    }

    // 🔥 ESTRATÉGIA 2: Se tem arquivo NÃO-CSV, enviar para n8n (Agente IA)
    if (file) {
      console.log('📄 Arquivo não-CSV - enviando para n8n (Agente IA):', file.name);
      
      const formData = new FormData();
      formData.append('chatInput', `📄 Arquivo: ${file.name}\n${message}`);
      formData.append('sessionId', sessionId);
      formData.append('file', file);
      formData.append('fileType', file.type);
      formData.append('timestamp', new Date().toISOString());
      formData.append('process_type', 'arquivo_anexo');

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP n8n: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Resposta do n8n (Agente IA) para arquivo:', responseData);
      return extractResponseText(responseData);
    }

    // 🔥 ESTRATÉGIA 3: Apenas texto - enviar PARA N8N (Agente IA controla o fluxo)
    console.log('💬 Mensagem de texto - enviando para n8n (Agente IA)');
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: message,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        source: 'onbot_chat_direct',
        messageType: 'user_input'
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP n8n: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('✅ Resposta do n8n (Agente IA):', responseData);
    return extractResponseText(responseData);

  } catch (error) {
    console.error('❌ Erro no serviço onbot:', error);
    
    // 🔥 FALLBACK: Se n8n falhar, tentar Gemini como backup
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        console.log('🔄 n8n offline, usando Gemini como fallback');
        return await fallbackToGemini(message, sessionId);
      }
    }
    
    return '⚠️ Ocorreu um erro inesperado. Por favor, tente novamente.';
  }
};

// 🔥 FUNÇÃO FALLBACK: Usar Gemini apenas se n8n estiver offline
const fallbackToGemini = async (message: string, sessionId: string): Promise<string> => {
  try {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return '🔌 Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
    }

    const GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Modelo mais compatível
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `Você é o OnBot, assistente de onboarding. Responda brevemente:

Usuário: ${message}

Contexto: ${sessionId}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      throw new Error(`Gemini fallback error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Resposta vazia do Gemini');

  } catch (geminiError) {
    console.error('❌ Erro no fallback Gemini:', geminiError);
    return '👋 Olá! Sou o OnBot. No momento nosso sistema principal está em manutenção. Por favor, tente novamente em alguns minutos.';
  }
};

// 🔥 FUNÇÃO PARA RECEBER MENSAGENS DO N8N (Agente IA)
export const receiveMessageFromN8N = async (payload: any): Promise<string> => {
  try {
    console.log('📨 Mensagem recebida do n8n (Agente IA):', payload);

    // Processar de acordo com o tipo de mensagem do Agente IA
    if (payload.action === 'ask_question') {
      return payload.question || 'Por favor, responda à pergunta acima.';
    }
    
    if (payload.action === 'request_token') {
      return '🔑 **Token de Acesso Necessário**\n\nPor favor, forneça seu token de acesso para continuarmos com o onboarding.';
    }
    
    if (payload.action === 'select_company') {
      const companies = payload.companies || [];
      if (companies.length > 0) {
        let companyList = '🏢 **Selecione a Empresa**\n\n';
        companies.forEach((company: any, index: number) => {
          companyList += `${index + 1}. ${company.name}\n`;
        });
        companyList += '\nDigite o número da empresa:';
        return companyList;
      }
      return '🏢 Por favor, informe o nome da empresa para associar os usuários.';
    }
    
    if (payload.action === 'confirm_creation') {
      const users = payload.users || [];
      let confirmationMessage = '📊 **Confirmação de Criação**\n\n';
      
      users.forEach((user: any) => {
        confirmationMessage += `• ${user.name} (${user.email})\n`;
      });
      
      confirmationMessage += `\nEmpresa: ${payload.company_name || 'Não especificada'}\n`;
      confirmationMessage += `Total: ${users.length} usuário(s)\n\n`;
      confirmationMessage += '✅ Confirmar criação? (Sim/Não)';
      
      return confirmationMessage;
    }

    // Se for uma resposta direta do Agente IA
    if (payload.response) {
      return payload.response;
    }

    // Se for um output padrão do n8n
    return extractResponseText(payload);

  } catch (error) {
    console.error('❌ Erro ao processar mensagem do n8n:', error);
    return '⚠️ Erro no processamento da mensagem.';
  }
};

// 🔥 FUNÇÃO PARA ENVIAR RESPOSTAS DO USUÁRIO PARA O N8N
export const sendUserResponseToN8N = async (userResponse: string, sessionId: string, context?: any): Promise<void> => {
  try {
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    const payload = {
      chatInput: userResponse,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      source: 'user_response',
      messageType: 'user_reply',
      context: context || {}
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('✅ Resposta do usuário enviada para n8n');
    } else {
      console.warn('⚠️ Erro ao enviar resposta para n8n:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar resposta para n8n:', error);
  }
};

// ✅ FUNÇÃO PARA EXTRAIR TEXTO DE RESPOSTAS DO N8N
const extractResponseText = (responseData: any): string => {
  console.log('📨 Estrutura completa da resposta n8n:', responseData);

  if (!responseData) {
    return '✅ Mensagem recebida! Processando...';
  }

  // Se já é string, retorna direto
  if (typeof responseData === 'string') {
    return responseData.replace(/\\n/g, '\n').trim();
  }

  // 🔥 PRIORIDADE: Respostas estruturadas do Agente IA
  if (typeof responseData === 'object') {
    // Resposta do Agente IA (fluxo estruturado)
    if (responseData.agent_response) {
      return responseData.agent_response;
    }
    
    // Mensagem do fluxo de onboarding
    if (responseData.message) {
      return responseData.message;
    }
    
    // Output padrão do n8n
    if (responseData.output) {
      return responseData.output;
    }
    
    // Resposta de texto simples
    if (responseData.response) {
      return responseData.response;
    }
    
    // Conteúdo de chat
    if (responseData.content) {
      return responseData.content;
    }
    
    // Texto direto
    if (responseData.text) {
      return responseData.text;
    }

    // 🔥 Dados de planilha processada
    if (responseData.planilha_processada) {
      const users = responseData.planilha_processada.usuarios || [];
      let message = `📊 **Planilha Processada**\n\nEncontrei ${users.length} usuário(s):\n\n`;
      
      users.forEach((user: any, index: number) => {
        message += `${index + 1}. ${user.name} - ${user.email}\n`;
      });
      
      message += '\n✅ Continuar com a criação?';
      return message;
    }

    // 🔥 Lista de empresas
    if (Array.isArray(responseData.empresas)) {
      let message = '🏢 **Empresas Disponíveis**\n\n';
      responseData.empresas.forEach((empresa: any, index: number) => {
        message += `${index + 1}. ${empresa.name}\n`;
      });
      message += '\n🔢 Digite o número da empresa:';
      return message;
    }

    // Tentar encontrar qualquer campo de texto útil
    const textFields = ['result', 'data', 'info', 'description', 'reply'];
    for (const field of textFields) {
      if (typeof responseData[field] === 'string' && responseData[field].trim().length > 0) {
        return responseData[field];
      }
    }

    // Se for array, pegar o primeiro item string
    if (Array.isArray(responseData) && responseData.length > 0) {
      const firstString = responseData.find(item => typeof item === 'string');
      if (firstString) return firstString;
    }

    // Último recurso: stringify se for pequeno
    try {
      const stringValue = JSON.stringify(responseData);
      if (stringValue.length < 300) {
        return `📋 ${stringValue}`;
      }
    } catch {
      // Ignora erro de stringify
    }
  }

  return '✅ Processamento concluído! Como posso ajudar?';
};

// 🔥 FUNÇÃO PARA TESTAR CONEXÃO COM N8N
export const testN8NConnection = async (): Promise<{status: string, details: any}> => {
  try {
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    const testPayload = {
      chatInput: 'Teste de conexão',
      sessionId: 'test_session',
      timestamp: new Date().toISOString(),
      source: 'connection_test',
      messageType: 'test'
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
    });

    if (!response.ok) {
      return {
        status: 'error',
        details: `HTTP ${response.status} - ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      status: 'success',
      details: data
    };

  } catch (error: any) {
    return {
      status: 'error',
      details: error.message || 'Erro desconhecido'
    };
  }
};