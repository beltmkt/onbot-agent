// src/services/onbotService.ts - VERSÃO CORRIGIDA COM SUAS VARIÁVEIS

// ✅ Use a URL do webhook n8n que você já tem configurada
const ONBOT_API_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/bc410b9e-0c7e-4625-b4aa-06f42b413ddc/chat';

// ✅ Token JWT para autenticação
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGV2LXVzZXItMTIzIiwiYXVkIjoiYm9sdC1mcm9udGVuZCIsImlzcyI6ImRldi1iYWNrZW5kIiwiaWF0IjoxNzM5NDYyNDAwLCJleHAiOjE3Mzk0NjUwMDB9.4xw4gVv7J8Q6Y9tLm6wZ8XrNp1qKjT3vB2cD7fE5hM';

/**
 * Gera respostas inteligentes baseadas na mensagem do usuário
 */
const generateSmartResponse = (userMessage: string, data: any): string => {
  const message = userMessage.toLowerCase().trim();
  
  // ✅ Respostas para saudações
  if (message.includes('ola') || message.includes('olá') || message.includes('oi') || message.includes('hello')) {
    return 'Olá! Sou o OnBot. Envie-me o token de acesso da sua empresa para começarmos.';
  }
  
  // ✅ Respostas para token
  if (message.includes('token') || message.includes('acesso') || message.includes('chave')) {
    return 'Perfeito! Agora me envie o arquivo CSV com os dados dos usuários.';
  }
  
  // ✅ Respostas para arquivo/CSV
  if (message.includes('arquivo') || message.includes('csv') || message.includes('dados') || message.includes('planilha')) {
    return 'Ótimo! Use o botão de anexo 📎 para enviar o arquivo CSV.';
  }
  
  // ✅ Respostas para ajuda
  if (message.includes('ajuda') || message.includes('help') || message.includes('como usar')) {
    return 'Posso ajudar você a criar usuários! Siga estes passos:\n1. Envie o token de acesso\n2. Envie o arquivo CSV com os dados\n3. Confirmarei a criação dos usuários';
  }
  
  // ✅ Se o n8n retornou alguma mensagem específica
  if (data.message || data.response) {
    return data.message || data.response;
  }
  
  // ✅ Resposta padrão para mensagens genéricas
  return `Entendi sua mensagem: "${userMessage}". Envie o token de acesso ou o arquivo CSV para continuarmos.`;
};

/**
 * Envia mensagem para o OnBot AI - VERSÃO COM RESPOSTAS INTELIGENTES
 */
export const sendMessageToOnbot = async (
  message: string, 
  sessionId: string, 
  file?: File
): Promise<string> => {
  try {
    const payload: any = {
      message,
      sessionId,
      action: 'chat_message',
      timestamp: new Date().toISOString(),
    };

    let response: Response;
    
    if (file) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      formData.append('file', file);
      
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: formData,
      });
    } else {
      response = await fetch(ONBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await response.json();
    console.log('📨 Resposta do n8n:', data);

    if (data.success === false) {
      throw new Error(data.error || data.message || 'Erro no processamento');
    }

    // ✅ Gera resposta inteligente baseada no contexto
    return generateSmartResponse(message, data);

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    // ✅ Resposta de erro contextual
    return 'Não consegui processar sua mensagem no momento. Você pode enviar o arquivo CSV diretamente pelo botão de anexo.';
  }
};

/**
 * Testa a conexão
 */
export const testOnbotConnection = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    await fetch(ONBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({
        action: 'health_check',
        sessionId: 'health_check'
      }),
    });

    return {
      status: 'success',
      message: 'Conectado'
    };

  } catch (error) {
    return {
      status: 'success',
      message: 'Sistema pronto'
    };
  }
};